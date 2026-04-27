import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();


  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      competition_id, title, video_link, thumbnail_url, 
      genre_tags, runtime_seconds, language, synopsis,
      director_name, cast_list, crew_list, inspiration,
      cineforge_tools_used, declaration_accepted
    } = body;

    // Check if competition exists and is open
    const { data: comp, error: compFetchError } = await supabase
      .from("competitions")
      .select("status, round1_end")
      .eq("id", competition_id)
      .single();

    if (compFetchError || !comp) {
      return NextResponse.json({ error: "Competition not found" }, { status: 404 });
    }

    if (comp.status !== "round1_open" && comp.status !== "upcoming") {
        // Technically 'upcoming' might be too early, but usually people submit early. 
        // Let's stick to checking if the deadline has passed.
        const now = new Date();
        if (comp.round1_end && now > new Date(comp.round1_end)) {
            return NextResponse.json({ error: "Submissions are closed" }, { status: 400 });
        }
    }

    // Check for duplicate submission
    const { data: existing } = await supabase
      .from("competition_submissions")
      .select("id")
      .eq("competition_id", competition_id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      return NextResponse.json({ error: "You have already submitted to this competition" }, { status: 400 });
    }

    // Create submission
    const { data: sub, error: subError } = await supabase
      .from("competition_submissions")
      .insert({
        competition_id,
        user_id: user.id,
        title,
        video_link,
        thumbnail_url,
        genre_tags,
        runtime_seconds,
        language,
        synopsis,
        director_name,
        cast_list,
        crew_list,
        inspiration,
        cineforge_tools_used,
        declaration_accepted,
        submission_status: "submitted"
      })
      .select()
      .single();

    if (subError) throw subError;

    // Update competition submission count
    await supabase.rpc("increment_competition_submissions", { comp_id: competition_id });

    // Create a post for the feed
    await supabase.from("posts").insert({
      user_id: user.id,
      type: "film",
      film_title: title,
      film_link: video_link,
      thumbnail_url,
      genre_tags,
      synopsis,
      is_competition_entry: true,
      competition_id
    });

    return NextResponse.json({ submission: sub });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
