import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const textContext = formData.get('textContext') as string | null;
    const scale = formData.get('scale') as string || 'Indie';

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing.' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' }); // Using a highly available model

    const promptText = `
      You are an expert film producer and line producer. I am providing you with a script or a synopsis for a film, and the selected production scale is "${scale}".
      Please analyze the content and suggest budget line items across various departments.
      
      Respond with a JSON object where keys are the department names (in lowercase, e.g., "cast", "above the line", "art department") 
      and values are arrays of objects with the following keys:
      - name (string)
      - roleDescription (string)
      - paymentType (string - one of: 'One-time', 'Daily', 'Weekly', 'Monthly', 'Hourly', 'Per Project', 'Deferred', 'In-Kind')
      - rate (number)
      - units (number)
      - notes (string)

      Provide realistic estimates based on the "${scale}" scale. Keep the response strictly as a JSON object, no markdown, no other text.
    `;

    let result;

    if (file) {
      // If we have a file (PDF, txt, etc.)
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // We send it inline
      const inlineDataPart = {
        inlineData: {
          data: buffer.toString('base64'),
          mimeType: file.type || 'application/pdf',
        }
      };

      result = await model.generateContent([promptText, inlineDataPart]);
    } else if (textContext) {
      result = await model.generateContent([promptText, textContext]);
    } else {
      return NextResponse.json({ error: 'No script or text provided' }, { status: 400 });
    }

    const responseText = result.response.text();
    
    // Attempt to parse JSON from the response
    let suggestions = {};
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        suggestions = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', responseText);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({ suggestions });

  } catch (error: any) {
    console.error('Error with AI Budget Estimator:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate budget suggestions.' },
      { status: 500 }
    );
  }
}
