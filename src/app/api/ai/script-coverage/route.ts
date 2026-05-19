import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get user id
    const { data: userProfile } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!userProfile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Check Rate Limit (3 reports per 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabaseAdmin
      .from("ai_usage_tracking")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userProfile.id)
      .eq("tool_type", "script-coverage")
      .gte("created_at", twentyFourHoursAgo);

    if (countError) {
      console.error("Rate limit check error:", countError);
    }

    if (count !== null && count >= 3) {
      return new Response(
        JSON.stringify({ error: "You have reached your limit of 3 free coverage reports per 24 hours. Please try again tomorrow." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { scriptText, scriptType, coverageDepth, focusAreas, userConcerns } = body;

    if (!scriptText?.trim()) {
      return new Response(JSON.stringify({ error: "Script text is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Track AI usage
    await supabaseAdmin.from("ai_usage_tracking").insert({
      user_id: userProfile.id,
      tool_type: "script-coverage",
    });

    const depthInstruction = {
      "Quick Read": "Provide brief, high-level feedback for each section.",
      "Standard Coverage": "Provide standard industry-depth feedback for each section.",
      "Deep Analysis": "Provide comprehensive, deep professional coverage with extensive analysis."
    }[coverageDepth as string] || "Provide standard industry-depth feedback for each section.";

    const systemPrompt = `You are an experienced script reader and development executive with 15+ years of experience. You have read thousands of screenplays for production companies, festivals, and studios.
Give honest, professional, actionable coverage. Do not soften feedback to be nice. A weak second act is a weak second act. The writer needs to know the truth so they can fix it.

Script Type: ${scriptType}
Coverage Depth: ${coverageDepth} (${depthInstruction})
Focus Areas: ${focusAreas?.join(", ")}
User Concerns: ${userConcerns || "None specified."}

You MUST format your entire response using the following structure, using the exact tags specified. Do not include any other markdown or conversational filler. The content inside the tags must be valid JSON as described.

[LOGLINE_PREMISE]
{
  "logline": "A one-sentence logline summarizing the screenplay.",
  "premise_strength": "Weak" | "Fair" | "Strong" | "Excellent",
  "premise_explanation": "A 2-3 sentence explanation of the premise's strength and core concept."
}
[END_LOGLINE_PREMISE]

[COVERAGE_GRADES]
{
  "overall": "A" | "B" | "C" | "D" | "F",
  "overall_explanation": "Overall verdict explanation.",
  "story_structure": "A" | "B" | "C" | "D" | "F",
  "story_structure_explanation": "Story structure explanation.",
  "character_development": "A" | "B" | "C" | "D" | "F",
  "character_development_explanation": "Character development explanation.",
  "dialogue": "A" | "B" | "C" | "D" | "F",
  "dialogue_explanation": "Dialogue explanation.",
  "pacing": "A" | "B" | "C" | "D" | "F",
  "pacing_explanation": "Pacing explanation.",
  "theme_subtext": "A" | "B" | "C" | "D" | "F",
  "theme_subtext_explanation": "Theme & subtext explanation.",
  "originality": "A" | "B" | "C" | "D" | "F",
  "originality_explanation": "Originality explanation.",
  "commercial_viability": "A" | "B" | "C" | "D" | "F",
  "commercial_viability_explanation": "Commercial viability explanation."
}
[END_COVERAGE_GRADES]

[STRENGTHS]
[
  "First strength of the script",
  "Second strength of the script",
  "Third strength of the script"
]
[END_STRENGTHS]

[WEAKNESSES]
[
  {
    "title": "First core issue",
    "explanation": "Detailed explanation of why it doesn't work and its impact."
  },
  {
    "title": "Second core issue",
    "explanation": "Detailed explanation."
  }
]
[END_WEAKNESSES]

[SCENE_BREAKDOWN]
[
  {
    "scene_num": 1,
    "heading": "INT. SCENE HEADING - DAY",
    "grade": "A" | "B" | "C" | "D" | "F",
    "note": "A 1-line note analyzing the scene."
  }
]
[END_SCENE_BREAKDOWN]

[DIALOGUE_SAMPLES]
[
  {
    "character": "CHARACTER NAME",
    "dialogue": "Lines of dialogue",
    "note": "AI note explaining why it is weak or strong.",
    "strength": "Weak" | "Strong"
  }
]
[END_DIALOGUE_SAMPLES]

[RECOMMENDATIONS]
[
  {
    "title": "First Actionable Recommendation",
    "explanation": "A 2-3 line paragraph explaining how to implement this recommendation."
  }
]
[END_RECOMMENDATIONS]

[VERDICT]
{
  "verdict": "RECOMMEND" | "CONSIDER" | "PASS",
  "verdict_narrative": "Three paragraphs of detailed narrative verdict prose."
}
[END_VERDICT]`;

    const prompt = `Analyze this screenplay:\n\n${scriptText}`;

    const models = ["gemini-2.5-flash", "gemini-2.0-flash"];
    let model;

    // We try to get gemini-2.5-flash
    try {
      model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: systemPrompt,
      });
    } catch {
      model = genAI.getGenerativeModel({
        model: "gemini-2.0-flash",
        systemInstruction: systemPrompt,
      });
    }

    const result = await model.generateContentStream(prompt);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: chunkText })}\n\n`));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Script coverage error:", error);
    return new Response(JSON.stringify({ error: error.message || "Failed to generate coverage report" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
