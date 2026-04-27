import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scriptText, continuationLineIndex, directorSlug, customStyle, toneArray, lengthChoice } = body;

    if (!scriptText?.trim()) {
      return Response.json({ error: "Script text is required" }, { status: 400 });
    }

    // Build style context
    let styleContext = "";
    if (directorSlug && directorSlug !== "__custom__") {
      styleContext = `Write in the unmistakable style of ${directorSlug}. Channel their signature techniques, dialogue patterns, pacing, visual storytelling approach, and narrative structure.`;
    } else if (customStyle) {
      styleContext = `Write in this custom style: ${customStyle}`;
    }

    const toneContext = toneArray?.length > 0 ? `Tone: ${toneArray.join(", ")}.` : "";

    const lengthMap: Record<string, string> = {
      short: "Write approximately 500 words of continuation.",
      medium: "Write approximately 1,000 words of continuation.",
      long: "Write approximately 2,000 words of continuation.",
    };
    const lengthInstruction = lengthMap[lengthChoice] || lengthMap.medium;

    // Handle continuation marker
    let scriptForPrompt = scriptText;
    if (continuationLineIndex !== null && continuationLineIndex !== undefined) {
      const lines = scriptText.split("\n");
      scriptForPrompt = lines.slice(0, continuationLineIndex + 1).join("\n");
    }

    const systemPrompt = `You are a professional screenwriter and script continuation AI for Track Reframe, a cinematic creator platform.

Your job is to seamlessly continue the user's screenplay from where they left off.

Rules:
- Output ONLY screenplay content. No meta-commentary, no explanations, no markdown headers.
- Use proper screenplay formatting: scene headings (INT./EXT.), character names in CAPS, parentheticals in (), action lines, and transitions.
- Maintain consistency with established characters, settings, tone, and plot threads.
- ${styleContext}
- ${toneContext}
- ${lengthInstruction}
- Make the continuation feel natural, as if the same writer continued without interruption.`;

    const prompt = `Continue this screenplay:\n\n${scriptForPrompt}`;

    // Try primary model, fallback to gemini-2.0-flash on rate limit
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-lite"];
    let lastError: any = null;

    for (const modelName of models) {
      try {
        console.log(`Generating continuity with ${modelName}...`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt,
        });

        const result = await model.generateContentStream(prompt);

        // Stream the response
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          async start(controller) {
            try {
              for await (const chunk of result.stream) {
                const chunkText = chunk.text();
                controller.enqueue(encoder.encode(chunkText));
              }
              controller.close();
            } catch (err) {
              controller.error(err);
            }
          },
        });

        return new Response(readable, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Transfer-Encoding": "chunked",
          },
        });
      } catch (err: any) {
        lastError = err;
        const is429 = err.message?.includes("429") || err.message?.includes("Too Many Requests") || err.message?.includes("quota");
        console.warn(`${modelName} failed${is429 ? " (rate limited)" : ""}:`, err.message);
        if (!is429) break;
      }
    }

    const is429 = lastError?.message?.includes("429") || lastError?.message?.includes("Too Many Requests") || lastError?.message?.includes("quota");
    return Response.json(
      { error: lastError?.message || "Failed to generate script continuation" },
      { status: is429 ? 429 : 500 }
    );
  } catch (error: any) {
    console.error("Script continuity error:", error);
    const is429 = error.message?.includes("429") || error.message?.includes("Too Many Requests") || error.message?.includes("quota");
    return Response.json(
      { error: error.message || "Failed to generate script continuation" },
      { status: is429 ? 429 : 500 }
    );
  }
}
