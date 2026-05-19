import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { rawText, pageCount } = body;

    if (!rawText?.trim()) {
      return NextResponse.json({ error: "Raw text is required" }, { status: 400 });
    }

    const systemPrompt = `You are an expert screenplay formatter. You will receive raw text that was extracted via OCR from handwritten script pages. The text may have:
- OCR errors and misread words
- Inconsistent spacing and line breaks
- Mixed formatting (some lines correctly formatted, others not)
- Page markers like '--- Page 2 ---' that should be removed
- Possibly Hindi/Tamil/other Indian language words mixed in (preserve them as-is)
- Abbreviations common in handwritten scripts (INT = Interior, EXT = Exterior, V.O. = Voice Over, O.S. = Off Screen)

Your job:
1. Fix obvious OCR errors (e.g., 'lNT.' should be 'INT.', '0' vs 'O' confusion, etc.)
2. Identify and properly format screenplay elements:
   - Scene headings: INT./EXT. LOCATION - DAY/NIGHT (UPPERCASE, own line)
   - Action lines: Normal case, full width
   - Character names: UPPERCASE, centered (output as: CHARACTER NAME on its own line)
   - Dialogue: Below character name, indented
   - Parentheticals: (in parentheses, indented, below character name)
   - Transitions: CUT TO:, FADE OUT., etc. (UPPERCASE, right-aligned - output as: [TRANSITION] CUT TO:)
3. Remove page markers.
4. Preserve all story content - do NOT add, remove, or change the actual story, dialogue, or scenes.
5. Output ONLY the cleaned screenplay text. No explanation. No preamble.`;

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt
    });
    const response = await model.generateContent(rawText);

    const cleanedText = response.response.text();

    return NextResponse.json({
      success: true,
      cleanedText,
      changesNote: "Fixed formatting and unified page transcriptions"
    });
  } catch (error: any) {
    console.error("Script cleanup error:", error);
    return NextResponse.json({ error: error.message || "Failed to cleanup script" }, { status: 500 });
  }
}
