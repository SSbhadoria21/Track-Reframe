import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET /api/posts/comments?post_id=xxx — Fetch comments for a post
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const postId = req.nextUrl.searchParams.get("post_id");
    if (!postId) return Response.json({ error: "post_id required" }, { status: 400 });

    const { data, error } = await supabase
      .from("post_comments")
      .select(`
        *,
        author:user_id (
          id,
          display_name,
          username,
          avatar_url
        )
      `)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ comments: data || [] });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/posts/comments — Create a comment
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Ensure user profile exists in public.users table
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

    const body = await req.json();
    const { post_id, content } = body;

    if (!post_id || !content?.trim()) {
      return Response.json({ error: "post_id and content required" }, { status: 400 });
    }

    // Insert comment
    const { data, error } = await supabase
      .from("post_comments")
      .insert({
        post_id,
        user_id: user.id,
        content: content.trim(),
      })
      .select(`
        *,
        author:user_id (
          id,
          display_name,
          username,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Notify Post Owner
    const { data: post } = await supabase
      .from("posts")
      .select("user_id, content")
      .eq("id", post_id)
      .single();

    if (post && post.user_id !== user.id) {
      const displayName = user.name || "Someone";
      await supabase.from("notifications").insert({
        user_id: post.user_id,
        actor_id: user.id,
        type: "comment",
        title: `${displayName} commented on your post`,
        content: `"${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
        target_id: post_id
      });
    }

    return Response.json({ comment: data });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/posts/comments?id=xxx — Delete own comment
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const commentId = req.nextUrl.searchParams.get("id");
    const postId = req.nextUrl.searchParams.get("post_id");
    if (!commentId) return Response.json({ error: "Comment ID required" }, { status: 400 });

    const { error } = await supabase
      .from("post_comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting comment:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Decrement comment count
    if (postId) {
      supabase
        .from("posts")
        .select("comment_count")
        .eq("id", postId)
        .single()
        .then(({ data: post }) => {
          if (post) {
            supabase
              .from("posts")
              .update({ comment_count: Math.max(0, (post.comment_count || 1) - 1) })
              .eq("id", postId)
              .then(() => {});
          }
        });
    }

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
