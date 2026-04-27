import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "user_id is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("films")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ films: data });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    const {
      title,
      video_link,
      thumbnail_url,
      genre_tags,
      runtime_seconds,
      synopsis,
      release_year
    } = body;

    if (!title || !video_link) {
      return NextResponse.json({ error: "Title and Video Link are required" }, { status: 400 });
    }

    // Insert into films table
    const { data: film, error: filmError } = await supabase
      .from("films")
      .insert({
        user_id: userId,
        title,
        video_link,
        thumbnail_url,
        genre_tags: genre_tags || [],
        runtime_seconds,
        synopsis,
        release_year
      })
      .select()
      .single();

    if (filmError) {
      console.error("Error inserting film:", filmError);
      return NextResponse.json({ error: filmError.message }, { status: 500 });
    }

    // Optionally, create a post for the feed
    const { error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: userId,
        type: 'film',
        film_link: video_link,
        film_title: title,
        thumbnail_url,
        genre_tags: genre_tags || [],
        synopsis,
        runtime_seconds
      });
      
    if (postError) {
      console.error("Error creating feed post for film:", postError);
      // We don't fail the whole request if the post fails, but log it.
    }

    return NextResponse.json({ success: true, film });
  } catch (error: any) {
    console.error("Film API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
