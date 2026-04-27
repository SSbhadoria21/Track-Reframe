import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sceneDescription, genre, mood, location, timeOfDay, shotCount } = body;

    if (!sceneDescription?.trim()) {
      return Response.json({ error: "Scene description is required" }, { status: 400 });
    }

    const systemPrompt = `You are a world-class cinematographer and shot planner for professional film productions. You think like Roger Deakins, Emmanuel Lubezki, and Bradford Young combined.

Your job is to take a scene description and create a detailed, visual SHOT LIST that a director and DP can use on set.

For each shot, provide ALL of the following in a structured JSON format:

{
  "shots": [
    {
      "shotNumber": 1,
      "shotType": "WIDE SHOT / MEDIUM SHOT / CLOSE-UP / EXTREME CLOSE-UP / OVER THE SHOULDER / POV / AERIAL / TRACKING / DOLLY / CRANE / STEADICAM / HANDHELD / DUTCH ANGLE / INSERT / ESTABLISHING / TWO-SHOT",
      "description": "Brief cinematic description of what this shot captures",
      "cameraAngle": "LOW ANGLE / HIGH ANGLE / EYE LEVEL / BIRD'S EYE / WORM'S EYE / DUTCH",
      "cameraMovement": "STATIC / PAN LEFT / PAN RIGHT / TILT UP / TILT DOWN / DOLLY IN / DOLLY OUT / TRACKING / CRANE UP / CRANE DOWN / STEADICAM FOLLOW / HANDHELD / WHIP PAN / ZOOM IN / ZOOM OUT / NONE",
      "lens": "e.g. 24mm wide / 50mm prime / 85mm portrait / 135mm telephoto / 200mm telephoto",
      "fStop": "e.g. f/1.4 / f/2.8 / f/5.6 / f/11",
      "lighting": "Description of lighting setup (key light position, fill, practical lights, etc.)",
      "lightingMood": "WARM / COOL / NEUTRAL / DRAMATIC / NATURAL / NEON / GOLDEN HOUR / BLUE HOUR / HIGH KEY / LOW KEY / CHIAROSCURO / SILHOUETTE",
      "gear": ["List of specific gear needed - camera body, lenses, stabilizers, lighting fixtures, etc."],
      "duration": "Estimated duration in seconds, e.g. '3-5s'",
      "notes": "Director/DP notes - any special considerations, actor blocking, VFX markers, etc.",
      "transition": "CUT / DISSOLVE / WHIP PAN / MATCH CUT / SMASH CUT / FADE / J-CUT / L-CUT / NONE"
    }
  ],
  "sceneOverview": {
    "estimatedDuration": "Total estimated scene duration",
    "dominantMood": "The overall visual mood",
    "colorPalette": ["3-4 hex color codes that define this scene's palette"],
    "referenceFilms": ["2-3 films with similar cinematography"],
    "dpNotes": "Overall cinematography notes for the scene"
  }
}

Rules:
- Output ONLY valid JSON. No markdown, no commentary, no code fences.
- Generate exactly the number of shots requested (default 6-8 if not specified).
- Make each shot visually distinct and purposeful — every shot should advance the story.
- Consider the emotional arc within the scene.
- Be specific about gear — use real camera/lens/light names when possible.
- Vary shot types to create visual rhythm (wide → close → medium → etc.).
- Include at least one creative/unexpected shot choice.
- The color palette should use actual hex codes that match the scene's mood.`;

    const contextParts = [];
    if (genre) contextParts.push(`Genre: ${genre}`);
    if (mood) contextParts.push(`Mood: ${mood}`);
    if (location) contextParts.push(`Location: ${location}`);
    if (timeOfDay) contextParts.push(`Time of Day: ${timeOfDay}`);
    if (shotCount) contextParts.push(`Generate exactly ${shotCount} shots`);
    
    const contextStr = contextParts.length > 0 ? `\n\nContext:\n${contextParts.join("\n")}` : "";

    const prompt = `${systemPrompt}\n\nCreate a detailed shot list for this scene:${contextStr}\n\nScene Description:\n${sceneDescription}`;

    // Try models with fallback
    const models = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash-lite"];
    let lastError: any = null;

    for (const modelName of models) {
      try {
        console.log(`Shot planner trying: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();

        if (!text) {
          console.error(`${modelName} returned empty response`);
          continue;
        }

        // Clean potential markdown fences from response
        let cleaned = text.trim();
        if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
        if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
        if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
        cleaned = cleaned.trim();

        // Validate JSON
        const parsed = JSON.parse(cleaned);
        
        console.log(`Shot plan generated with ${modelName}. Shots: ${parsed.shots?.length}`);
        return Response.json(parsed);
      } catch (err: any) {
        lastError = err;
        const is429 = err.message?.includes("429") || err.message?.includes("Too Many Requests") || err.message?.includes("quota");
        console.warn(`${modelName} failed${is429 ? " (rate limited)" : ""}:`, err.message);
        if (!is429) break;
      }
    }

    const is429 = lastError?.message?.includes("429") || lastError?.message?.includes("Too Many Requests") || lastError?.message?.includes("quota");
    return Response.json(
      { error: lastError?.message || "Failed to generate shot plan" },
      { status: is429 ? 429 : 500 }
    );
  } catch (error: any) {
    console.error("Shot planner error:", error);
    const is429 = error.message?.includes("429") || error.message?.includes("Too Many Requests") || error.message?.includes("quota");
    return Response.json(
      { error: error.message || "Failed to generate shot plan" },
      { status: is429 ? 429 : 500 }
    );
  }
}
