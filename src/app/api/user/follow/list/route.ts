import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const type = searchParams.get('type'); // "followers" or "following"
    
    if (!userId || !type) {
      return NextResponse.json({ error: "userId and type required" }, { status: 400 });
    }

    if (type === "followers") {
      const { data, error } = await supabaseAdmin
        .from("follows")
        .select(`
          users!follows_follower_id_fkey (id, username, display_name, avatar_url, roles, bio)
        `)
        .eq("following_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return NextResponse.json({ users: data.map((d: any) => d.users) });
    } else {
      const { data, error } = await supabaseAdmin
        .from("follows")
        .select(`
          users!follows_following_id_fkey (id, username, display_name, avatar_url, roles, bio)
        `)
        .eq("follower_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return NextResponse.json({ users: data.map((d: any) => d.users) });
    }
  } catch (err: any) {
    console.error("Follow list error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
