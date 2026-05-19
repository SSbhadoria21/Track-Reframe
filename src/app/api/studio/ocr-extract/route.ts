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

    // Resolve userId
    const { data: userProfile } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", session.user.email)
      .single();

    if (!userProfile) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    const userId = userProfile.id;

    // Rate Limiting (10 uploads per user per day, reset at midnight IST)
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istMidnight = new Date(now.getTime() + istOffset);
    istMidnight.setUTCHours(0, 0, 0, 0);
    const utcMidnight = new Date(istMidnight.getTime() - istOffset).toISOString();

    // Check Redis first if configured, else database
    let usageCount = 0;
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (redisUrl && redisToken) {
      const cleanUrl = redisUrl.replace(/\/$/, "");
      const redisKey = `ocr_limit:${userId}`;
      const getRes = await fetch(`${cleanUrl}/get/${redisKey}`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
      if (getRes.ok) {
        const getVal = await getRes.json();
        usageCount = parseInt(getVal.result || "0", 10);
      }
    } else {
      const { count } = await supabaseAdmin
        .from("ai_usage_tracking")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("tool_type", "ocr-extract")
        .gte("created_at", utcMidnight);
      
      usageCount = count || 0;
    }

    if (usageCount >= 10) {
      return NextResponse.json(
        { error: "You've used your 10 free uploads today. Resets at midnight." },
        { status: 429 }
      );
    }

    // Process FormData
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    // Process up to 5 images
    const targetFiles = files.slice(0, 5);
    const extractedTexts: string[] = [];

    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    for (let i = 0; i < targetFiles.length; i++) {
      const file = targetFiles[i];
      const buffer = Buffer.from(await file.arrayBuffer());
      
      const prompt = `This is a photo of a handwritten screenplay/script. Extract ALL the text you can read from this image, preserving the original line breaks and structure as much as possible. Output ONLY the extracted text, nothing else. If you cannot read certain words clearly, use [illegible] as a placeholder.`;

      const response = await model.generateContent([
        {
          inlineData: {
            data: buffer.toString("base64"),
            mimeType: file.type || "image/jpeg",
          }
        },
        prompt
      ]);

      const text = response.response.text();
      extractedTexts.push(text);

      // Track usage for each page
      if (redisUrl && redisToken) {
        const cleanUrl = redisUrl.replace(/\/$/, "");
        const redisKey = `ocr_limit:${userId}`;
        const nextMidnightIST = new Date(now.getTime() + istOffset);
        nextMidnightIST.setUTCHours(24, 0, 0, 0);
        const ttlSeconds = Math.max(1, Math.floor((nextMidnightIST.getTime() - istOffset - now.getTime()) / 1000));

        await fetch(`${cleanUrl}/incr/${redisKey}`, {
          headers: { Authorization: `Bearer ${redisToken}` }
        });
        await fetch(`${cleanUrl}/expire/${redisKey}/${ttlSeconds}`, {
          headers: { Authorization: `Bearer ${redisToken}` }
        });
      } else {
        await supabaseAdmin.from("ai_usage_tracking").insert({
          user_id: userId,
          tool_type: "ocr-extract",
        });
      }
    }

    // Concatenate text with page break comments
    let combinedText = "";
    for (let i = 0; i < extractedTexts.length; i++) {
      if (i > 0) {
        combinedText += `\n\n--- Page ${i + 1} ---\n\n`;
      }
      combinedText += extractedTexts[i];
    }

    const wordCount = combinedText.split(/\s+/).filter(Boolean).length;

    return NextResponse.json({
      success: true,
      rawText: combinedText,
      wordCount,
      pageCount: targetFiles.length
    });
  } catch (error: any) {
    console.error("OCR extract error:", error);
    return NextResponse.json({ error: error.message || "Failed to process image OCR" }, { status: 500 });
  }
}
