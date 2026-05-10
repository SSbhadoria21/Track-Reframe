import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/posts/like — Toggle like on a post
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { post_id } = await req.json();
    if (!post_id) return Response.json({ error: "post_id required" }, { status: 400 });

    // Helper for broadcasting changes instantly
    const broadcastChange = async (type: 'like' | 'comment', newCount: number) => {
      await supabaseAdmin.channel(`post_changes_${post_id}`).send({
        type: 'broadcast',
        event: 'metrics_updated',
        payload: { type, count: newCount }
      });
    };

    // Check if already liked
    const { data: existing } = await supabaseAdmin
      .from("post_likes")
      .select("id")
      .eq("post_id", post_id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      // Unlike
      await supabaseAdmin.from("post_likes").delete().eq("id", existing.id);
      
      // Get new count and broadcast
      const { data: post } = await supabaseAdmin.from("posts").select("like_count").eq("id", post_id).maybeSingle();
      if (post) await broadcastChange('like', post.like_count);

      return Response.json({ liked: false });
    } else {
      // Like
      await supabaseAdmin.from("post_likes").insert({ post_id, user_id: user.id });

      // Notify Post Owner
      const { data: post } = await supabaseAdmin
        .from("posts")
        .select("user_id, content, like_count")
        .eq("id", post_id)
        .maybeSingle();

      if (post) {
        // Broadcast the new count instantly
        await broadcastChange('like', post.like_count);

        if (post.user_id !== user.id) {
          const displayName = user.name || "Someone";
          await supabaseAdmin.from("notifications").insert({
            user_id: post.user_id,
            actor_id: user.id,
            type: "like",
            title: `${displayName} liked your post`,
            content: post.content ? `"${post.content.substring(0, 50)}${post.content.length > 50 ? '...' : ''}"` : "Liked your post",
            target_id: post_id
          });
        }
      }

      return Response.json({ liked: true });
    }
  } catch (err: any) {
    console.error("Like error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

async function getCount(supabase: any, postId: string, field: string) {
  const { data } = await supabase.from("posts").select(field).eq("id", postId).maybeSingle();
  return data?.[field] || 0;
}
