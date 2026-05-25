import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const endpoint = searchParams.get("endpoint");
    const query = searchParams.get("query");
    const page = searchParams.get("page") || "1";

    if (!endpoint) {
      return NextResponse.json({ error: "Endpoint is required" }, { status: 400 });
    }

    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "TMDB API key not configured" }, { status: 500 });
    }

    let tmdbUrl = `https://api.themoviedb.org/3${endpoint}?api_key=${apiKey}&page=${page}&language=en-US`;
    if (query) {
      tmdbUrl += `&query=${encodeURIComponent(query)}`;
    }

    const response = await fetch(tmdbUrl);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Failed to fetch from TMDB", details: errorData },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("TMDB API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
