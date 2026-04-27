import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Helper to ensure user profile exists
async function ensureUserProfile(supabase: any, user: any) {
  const { data: profile } = await supabase
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const displayName = user.name || "Creator";
    const username = user.username || `creator_${user.id.substring(0, 5)}`;
    
    await supabase.from("users").insert({
      id: user.id,
      username,
      display_name: displayName,
      email: user.email || "",
      coins: 0,
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('user_id') || user?.id;

    if (!targetUserId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { data, error } = await supabase
      .from("scripts")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ scripts: data || [] });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Ensure the user exists in the 'users' table before saving the script
    await ensureUserProfile(supabase, user);

    const body = await req.json();
    const { title, raw_text, formatted_text, director_name, tool_used, genre_tags } = body;
    const wordCount = (formatted_text || raw_text || "").split(/\s+/).filter(Boolean).length;

    const { data, error } = await supabase
      .from("scripts")
      .insert({
        user_id: user.id,
        title: title || "Untitled Script",
        raw_text,
        formatted_text,
        word_count: wordCount,
        director_name,
        tool_used: tool_used || "continuity_ai",
        genre_tags: genre_tags || [],
        is_public: false,
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ script: data });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
