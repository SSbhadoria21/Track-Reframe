import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { filmTitle, logline, keywords, festivalName, festivalDesc } = body;

    if (!filmTitle || !logline) {
      return new Response(JSON.stringify({ error: "Film Title and Logline are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are a professional film publicist and creative copywriter.
Your task is to write a compelling, tailored, 100-word synopsis for a film submission.
Optimize the tone and focus specifically for this festival: "${festivalName}".
Festival profile/details: ${festivalDesc || "A prestigious film festival showcasing unique voices."}

Keywords to incorporate or channel: ${keywords || "none"}
Title of the film: "${filmTitle}"
Core Logline: "${logline}"

Rules:
- Output ONLY the synopsis. Do not include any headers, greeting, intro/outro, or quote marks around the whole text.
- Stay strictly within 100 words (approx. 90-110 words).
- Make it punchy, engaging, and professional. Match the festival's artistic or commercial focus.`;

    const prompt = `Write the tailored synopsis for "${filmTitle}".`;

    const modelName = "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContentStream(prompt);

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
  } catch (error: any) {
    console.error("Festival synopsis API error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate synopsis" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
