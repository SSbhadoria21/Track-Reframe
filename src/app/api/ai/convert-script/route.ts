import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rawText, language } = body;

    if (!rawText?.trim()) {
      return Response.json({ error: "Text is required" }, { status: 400 });
    }

    const systemPrompt = `You are an elite screenplay formatter and script doctor used by professional filmmakers worldwide.

Your job is to take RAW, UNFORMATTED text — which could be:
- A rough story idea written in plain paragraphs
- A narrative description in any language (Hindi, Tamil, Telugu, Bengali, Marathi, Kannada, Malayalam, English, or mixed)
- Casual notes about scenes and characters
- A rough draft with dialogue mixed into paragraphs
- A synopsis or treatment

And CONVERT it into a PROPERLY FORMATTED Hollywood/Industry-standard screenplay.

OUTPUT FORMAT RULES (CRITICAL — follow exactly):
1. Scene Headings: Always start with INT. or EXT. followed by LOCATION - TIME OF DAY
   Example: INT. COFFEE SHOP - DAY
   Example: EXT. MUMBAI STREET - NIGHT

2. Action/Description Lines: Written in present tense, visual and cinematic. Full width.
   Example: Rain lashes against the window. MAYA (30s) stares at her cold coffee.

3. Character Names: ALL CAPS, centered above their dialogue, on their own line.
   Example: MAYA

4. Parentheticals: In parentheses, below character name, for acting directions only.
   Example: (whispering)

5. Dialogue: Below character name (or parenthetical), indented. Natural speech.
   Example: I wasn't sure you'd actually show up.

6. Transitions: ALL CAPS, right-aligned. Use sparingly.
   Example: CUT TO:
   Example: FADE OUT.

7. Keep blank lines between elements for readability.

CONTENT RULES:
- If the input is in a regional language, TRANSLATE the dialogue to English but keep character names and cultural context authentic
- If names aren't specified, create authentic names fitting the cultural context
- Break continuous narrative into logical SCENES with proper INT./EXT. headings
- Extract dialogue from narration — if someone "says" something, format it as proper dialogue
- Add cinematic action descriptions between dialogue
- Add scene transitions where natural breaks occur
- Create parentheticals where emotional context is implied
- If the rough text describes a location, convert it to a proper scene heading
- Maintain the original story's tone, culture, and intent
- Make it feel like a real shooting script that a director could use

OUTPUT ONLY THE FORMATTED SCREENPLAY. No explanations, no markdown, no commentary, no headers like "SCREENPLAY" or "TITLE". Just the raw screenplay content starting with the first scene heading.`;

    const langHint = language ? `\n\n[Note: The input may be in ${language}. Translate dialogue to English while keeping cultural authenticity.]` : "";
    const prompt = `${systemPrompt}\n\nConvert this rough text into a properly formatted screenplay:${langHint}\n\n---\n${rawText}\n---`;

    // Try primary model, fallback to gemini-2.0-flash on rate limit
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-lite"];
    let lastError: any = null;

    for (const modelName of models) {
      try {
        console.log(`Trying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const formatted = result.response.text();

        if (!formatted) {
          console.error(`${modelName} returned an empty response`);
          continue;
        }

        console.log(`Successfully converted script with ${modelName}. Length:`, formatted.length);
        return Response.json({ formatted });
      } catch (err: any) {
        lastError = err;
        const is429 = err.message?.includes("429") || err.message?.includes("Too Many Requests") || err.message?.includes("quota");
        console.warn(`${modelName} failed${is429 ? " (rate limited)" : ""}:`, err.message);
        if (!is429) break; // Only fallback on rate limit errors
      }
    }

    // Forward 429 status properly if it was a rate limit error
    const is429 = lastError?.message?.includes("429") || lastError?.message?.includes("Too Many Requests") || lastError?.message?.includes("quota");
    return Response.json(
      { error: lastError?.message || "Failed to convert script" },
      { status: is429 ? 429 : 500 }
    );
  } catch (error: any) {
    console.error("Script convert error:", error);
    const is429 = error.message?.includes("429") || error.message?.includes("Too Many Requests") || error.message?.includes("quota");
    return Response.json(
      { error: error.message || "Failed to convert script" },
      { status: is429 ? 429 : 500 }
    );
  }
}
