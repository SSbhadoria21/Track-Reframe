import { GoogleGenAI } from "@google/genai";
import { NextRequest } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { shotDescription, shotType, cameraAngle, lightingMood, location } = body;

    if (!shotDescription?.trim()) {
      return Response.json({ error: "Shot description is required" }, { status: 400 });
    }

    const prompt = `Create a black and white pencil sketch storyboard frame for a film. 
Style: Professional film storyboard, hand-drawn pencil sketch look, clean lines, cinematic composition.
Shot type: ${shotType || "Medium Shot"}
Camera angle: ${cameraAngle || "Eye Level"}
Lighting: ${lightingMood || "Dramatic"}
${location ? `Setting: ${location}` : ""}

Scene: ${shotDescription}

Important: Draw it as a single storyboard panel with clear composition showing the camera framing. Black and white pencil sketch only. No text or labels.`;

    // Try image-capable models
    const imageModels = ["gemini-2.5-flash-image"];

    for (const modelName of imageModels) {
      try {
        console.log(`Generating storyboard with ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            responseModalities: ["IMAGE"],
          },
        });

        // Extract image data from response
        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData) {
              return Response.json({
                image: part.inlineData.data,
                mimeType: part.inlineData.mimeType || "image/png",
              });
            }
          }
        }

        console.warn(`${modelName} returned no image data`);
      } catch (err: any) {
        const is429 = err.message?.includes("429") || err.message?.includes("Too Many Requests") || err.message?.includes("quota");
        console.warn(`${modelName} failed${is429 ? " (rate limited)" : ""}:`, err.message);
        if (is429) {
          return Response.json(
            { error: "Rate limit reached. Please wait a moment and try again." },
            { status: 429 }
          );
        }
      }
    }

    return Response.json({ error: "Image generation unavailable" }, { status: 500 });
  } catch (error: any) {
    console.error("Storyboard generation error:", error);
    const is429 = error.message?.includes("429") || error.message?.includes("Too Many Requests") || error.message?.includes("quota");
    return Response.json(
      { error: error.message || "Failed to generate storyboard" },
      { status: is429 ? 429 : 500 }
    );
  }
}
