import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { script } = body;

    if (!script?.trim()) {
      return Response.json({ error: "Script text is required" }, { status: 400 });
    }

    const systemPrompt = `You are a professional screenplay editor and script doctor for Hollywood and Bollywood films.

Your job is to ENHANCE the given screenplay while keeping the story, characters, and structure intact.

Improvements to make:
- Tighten action lines (remove redundant words, make them visual and cinematic)
- Improve dialogue (make it more natural, subtext-rich, and character-specific)
- Fix any formatting issues (ensure proper INT./EXT. headings, character cues, parentheticals)
- Enhance scene descriptions to be more evocative and directorial
- Add missing transitions where appropriate
- Ensure proper screenplay structure and pacing

Rules:
- Output ONLY the enhanced screenplay text. No explanations, no markdown, no commentary.
- Keep the same scenes, characters, and plot. Do NOT add new scenes or remove existing ones.
- Use standard screenplay formatting throughout.
- Preserve the writer's voice and intent.`;

    // Try primary model, fallback to gemini-2.0-flash on rate limit
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-lite"];
    let lastError: any = null;

    for (const modelName of models) {
      try {
        console.log(`Enhancing with ${modelName}...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
        });
        const result = await model.generateContent(`Enhance this screenplay:\n\n${script}`);
        const enhanced = result.response.text();

        if (!enhanced) continue;

        console.log(`Successfully enhanced with ${modelName}. Length:`, enhanced.length);
        return Response.json({ enhanced });
      } catch (err: any) {
        lastError = err;
        const is429 = err.message?.includes("429") || err.message?.includes("Too Many Requests") || err.message?.includes("quota");
        console.warn(`${modelName} failed${is429 ? " (rate limited)" : ""}:`, err.message);
        if (!is429) break;
      }
    }

    const is429 = lastError?.message?.includes("429") || lastError?.message?.includes("Too Many Requests") || lastError?.message?.includes("quota");
    return Response.json(
      { error: lastError?.message || "Failed to enhance script" },
      { status: is429 ? 429 : 500 }
    );
  } catch (error: any) {
    console.error("Script enhance error:", error);
    const is429 = error.message?.includes("429") || error.message?.includes("Too Many Requests") || error.message?.includes("quota");
    return Response.json(
      { error: error.message || "Failed to enhance script" },
      { status: is429 ? 429 : 500 }
    );
  }
}
