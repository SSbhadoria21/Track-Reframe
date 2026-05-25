import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, year, overview } = body;

    if (!title) {
      return new Response(JSON.stringify({ error: "Movie title is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert film historian and cinephile.
Provide a fascinating, 2-3 sentence piece of trivia, behind-the-scenes fact, or thematic insight about the movie provided.
Do not simply summarize the plot. Provide interesting context that a movie buff would appreciate.
Output ONLY the trivia text. No headers, quotes, or conversational filler.`;

    const prompt = `Movie: ${title} (${year || 'Unknown Year'})\nSynopsis: ${overview || 'N/A'}`;

    const modelName = "gemini-2.5-flash";
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return new Response(JSON.stringify({ facts: text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Movie facts API error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate facts" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
