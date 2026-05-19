import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { image } = body; // Base64 data URL

    if (!image) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    // Extract base64 content
    const base64Data = image.split(",")[1] || image;
    const mimeType = image.split(";")[0].split(":")[1] || "image/jpeg";

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Data,
          mimeType: mimeType,
        },
      },
      "Perform OCR on this image of a handwritten or typed script page. Output ONLY the transcribed text. Do not include any headers, footers, conversational filler, or commentary. Preserve the formatting, line breaks, and indentation exactly as it appears in the image.",
    ]);

    const text = result.response.text();

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("OCR API Error:", error);
    return NextResponse.json({ error: error.message || "Failed to perform OCR" }, { status: 500 });
  }
}
