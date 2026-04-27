import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

// Master client to bypass RLS since we use NextAuth
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

// Helper to ensure user profile exists
async function ensureUserProfile(user: any) {
  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const displayName = user.name || "Creator";
    const username = user.username || `creator_${user.id.substring(0, 5)}`;

    await supabaseAdmin.from("users").insert({
      id: user.id,
      username,
      display_name: displayName,
      email: user.email || "",
      coins: 0,
    });
  }
}

// GET /api/posts — Fetch all posts for the feed with user interactions
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    // Fetch posts with author info
    const { data: posts, error } = await supabaseAdmin
      .from("posts")
      .select(`
        *,
        author:user_id (
          id,
          display_name,
          username,
          avatar_url
        )
      `)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching posts:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    // If user is logged in, fetch their likes, bookmarks, and follows
    let userLikes: Set<string> = new Set();
    let userBookmarks: Set<string> = new Set();
    let followedUserIds: Set<string> = new Set();

    if (user && posts && posts.length > 0) {
      const postIds = posts.map((p: any) => p.id);
      const authorIds = [...new Set(posts.map((p: any) => p.user_id))];

      const [likesRes, bookmarksRes, followsRes] = await Promise.all([
        supabaseAdmin
          .from("post_likes")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds),
        supabaseAdmin
          .from("post_bookmarks")
          .select("post_id")
          .eq("user_id", user.id)
          .in("post_id", postIds),
        supabaseAdmin
          .from("user_follows")
          .select("following_id")
          .eq("follower_id", user.id)
          .in("following_id", authorIds),
      ]);

      if (likesRes.data) likesRes.data.forEach((l: any) => userLikes.add(l.post_id));
      if (bookmarksRes.data) bookmarksRes.data.forEach((b: any) => userBookmarks.add(b.post_id));
      if (followsRes.data) followsRes.data.forEach((f: any) => followedUserIds.add(f.following_id));
    }

    // Attach interaction status to each post
    const enrichedPosts = (posts || []).map((post: any) => ({
      ...post,
      user_liked: userLikes.has(post.id),
      user_bookmarked: userBookmarks.has(post.id),
      is_following: followedUserIds.has(post.user_id),
    }));

    return Response.json({ posts: enrichedPosts });
  } catch (err: any) {
    console.error("Posts GET error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/posts — Create a new post (authenticated)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
      return Response.json({ error: "You must be logged in to post" }, { status: 401 });
    }

    await ensureUserProfile(user);

    const body = await req.json();
    const { content, type, genre_tags, media_url, media_type } = body;

    if (!content?.trim()) {
      return Response.json({ error: "Post content cannot be empty" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("posts")
      .insert({
        user_id: user.id,
        content: content.trim(),
        type: type || "text",
        genre_tags: genre_tags || [],
        media_url: media_url || null,
        media_type: media_type || null,
        is_deleted: false,
        like_count: 0,
        comment_count: 0,
        repost_count: 0,
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
      console.error("Error creating post:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ post: { ...data, user_liked: false, user_bookmarked: false } });
  } catch (err: any) {
    console.error("Posts POST error:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /api/posts — Update a post (owner only)
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, content } = body;

    if (!id || !content?.trim()) {
      return Response.json({ error: "ID and content required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("posts")
      .update({ content: content.trim() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error updating post:", error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/posts — Delete a post (owner only)
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const postId = req.nextUrl.searchParams.get("id");
    if (!postId) return Response.json({ error: "Post ID required" }, { status: 400 });

    const { error } = await supabase
      .from("posts")
      .update({ is_deleted: true })
      .eq("id", postId)
      .eq("user_id", user.id);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (err: any) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
