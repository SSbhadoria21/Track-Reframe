import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const textContext = formData.get('textContext') as string | null;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'Gemini API Key is missing.' },
        { status: 500 }
      );
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

    const promptText = `
      You are an expert 1st Assistant Director (1st AD) breaking down a screenplay. I am providing you with a script or a synopsis for a film.
      Please analyze the content and extract information for a Call Sheet.
      
      Respond with a JSON object strictly matching this schema:
      {
        "locations": ["List of distinct locations mentioned in the script"],
        "scenes": [
          {
            "sceneNumber": "string (e.g., '1', '12A', '2')",
            "description": "string (Brief 1-line description of what happens)",
            "location": "string (The location where this scene happens)",
            "intExt": "string (INT, EXT, or I/E)",
            "dayNight": "string (DAY, NIGHT, EVENING, or MORNING)",
            "pages": "string (Estimated page count, e.g., '1/8', '2 1/8')"
          }
        ],
        "characters": [
          {
            "name": "string (Name of the character)",
            "scenesIn": ["List of scene numbers this character appears in"]
          }
        ]
      }

      Keep the response strictly as a JSON object, no markdown, no other text.
    `;

    let result;

    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

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
    
    let parsedData = {};
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        parsedData = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response as JSON:', responseText);
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error('Error with AI Call Sheet Parser:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to analyze script.' },
      { status: 500 }
    );
  }
}
