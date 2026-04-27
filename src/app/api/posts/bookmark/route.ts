import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// POST /api/posts/bookmark — Toggle bookmark on a post
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { post_id } = await req.json();
    if (!post_id) return Response.json({ error: "post_id required" }, { status: 400 });

    // Check if already bookmarked
    const { data: existing } = await supabase
      .from("post_bookmarks")
      .select("id")
      .eq("post_id", post_id)
      .eq("user_id", user.id)
      .single();

    if (existing) {
      // Unbookmark
      await supabase.from("post_bookmarks").delete().eq("id", existing.id);
      return Response.json({ bookmarked: false });
    } else {
      // Bookmark
      await supabase.from("post_bookmarks").insert({ post_id, user_id: user.id });
      return Response.json({ bookmarked: true });
    }
  } catch (err: any) {
    console.error("Bookmark error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
