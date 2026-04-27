import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// POST /api/user/follow — Toggle follow status
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { target_user_id } = await req.json();
    if (!target_user_id) return Response.json({ error: "target_user_id required" }, { status: 400 });
    if (target_user_id === user.id) return Response.json({ error: "Cannot follow yourself" }, { status: 400 });

    // Check if already following
    const { data: existing } = await supabase
      .from("user_follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", target_user_id)
      .single();

    if (existing) {
      // Unfollow
      await supabase.from("user_follows").delete().eq("id", existing.id);
      return Response.json({ following: false });
    } else {
      // Follow
      await supabase.from("user_follows").insert({ 
        follower_id: user.id, 
        following_id: target_user_id 
      });

      // Notify the target user
      const displayName = user.name || "Someone";
      await supabase.from("notifications").insert({
        user_id: target_user_id,
        actor_id: user.id,
        type: "follow",
        title: `${displayName} started following you`,
        content: `Connect and collaborate on your next project!`,
        target_id: user.id
      });

      return Response.json({ following: true });
    }
  } catch (err: any) {
    console.error("Follow error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
