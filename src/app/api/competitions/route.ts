import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const supabase = await createClient();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  let query = supabase
    .from("competitions")
    .select(`
      *,
      creator:users!competitions_creator_id_fkey(username, display_name, avatar_url),
      prize_badge:badges(name, icon_url, rarity)
    `)
    .order("created_at", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ competitions: data });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { 
      title, theme, description, rules, 
      round1_start, round1_end, 
      prize_description, prize_coins,
      post_to_feed 
    } = await req.json();

    if (!round1_end || round1_end === "") {
        return NextResponse.json({ error: "Please select a valid end date and time" }, { status: 400 });
    }

    const { data: comp, error: compError } = await supabase
      .from("competitions")
      .insert({
        title,
        theme,
        description,
        rules,
        round1_start,
        round1_end,
        prize_description,
        prize_coins,
        creator_id: user.id,
        status: "upcoming"
      })
      .select()
      .single();

    if (compError) throw compError;

    // Create a post if requested
    if (post_to_feed) {
      await supabase.from("posts").insert({
        user_id: user.id,
        type: "text",
        content: `🎬 NEW COMPETITION: ${title}\n\nTheme: ${theme}\n\nJoin now and win ${prize_coins} coins!`,
        is_competition_entry: false,
        competition_id: comp.id
      });
    }

    // Notify all users (in a real app, this would be a background job)
    // For now, we'll just create a notification for the creator as a placeholder
    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "system",
      title: "Competition Created",
      body: `Your competition "${title}" is now live!`,
      related_entity_type: "competition",
      related_entity_id: comp.id
    });

    return NextResponse.json({ competition: comp });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { 
      id, title, theme, description, rules, 
      round1_start, round1_end, 
      prize_description, prize_coins,
      status
    } = await req.json();

    if (!id) return NextResponse.json({ error: "Competition ID is required" }, { status: 400 });

    // Security: Only allow update if user is creator OR if competition has no creator yet
    const { data: existing } = await supabase
        .from("competitions")
        .select("creator_id")
        .eq("id", id)
        .single();

    if (existing && existing.creator_id && existing.creator_id !== user.id) {
        return NextResponse.json({ error: "Unauthorized: You are not the creator of this challenge" }, { status: 403 });
    }

    const { data: comp, error: compError } = await supabase
      .from("competitions")
      .update({
        title,
        theme,
        description,
        rules,
        round1_start,
        round1_end,
        prize_description,
        prize_coins,
        creator_id: existing?.creator_id || user.id,
        status: status
      })
      .eq("id", id)
      .select()
      .single();

    if (compError) throw compError;

    // Optional: Qualify top films if moving to round 2
    if (status === "round2") {
        try {
            const { data: topSubmissions } = await supabase
                .from("competition_submissions")
                .select("id")
                .eq("competition_id", id)
                .order("avg_rating", { ascending: false })
                .limit(10);

            if (topSubmissions && topSubmissions.length > 0) {
                const ids = topSubmissions.map(s => s.id);
                // We use upsert or handle errors gracefully here
                await supabase
                    .from("competition_submissions")
                    .update({ round1_qualified: true })
                    .in("id", ids);
            }
        } catch (e) {
            console.error("Auto-qualification failed, continuing anyway:", e);
        }
    }

    return NextResponse.json({ competition: comp });


  } catch (error: any) {
    console.error("COMPETITION_PATCH_ERROR:", error);
    return NextResponse.json({ 
        error: error.message || "Internal Server Error",
        details: error.toString()
    }, { status: 500 });
  }
}


