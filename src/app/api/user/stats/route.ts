import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const dynamic = 'force-dynamic';

// GET — fetch user's real stats from the database
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const user = session?.user;
    const supabase = await createClient();
    
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId') || (user as any)?.id;

    if (!targetUserId) return Response.json({ error: "Unauthorized" }, { status: 401 });

    // Try to get the user profile
    const { data: profile } = await supabase
      .from("users")
      .select("*")
      .eq("id", targetUserId)
      .single();

    if (!profile) return Response.json({ stats: { posts: 0, followers: 0, following: 0, films: 0, scripts: 0, coins: 0, badges: 0, saved: 0 } });

    // ─── Real-time Counts ───
    
    // Count Followers (people following ME)
    const { count: followerCount } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("following_id", targetUserId);

    // Count Following (people I follow)
    const { count: followingCount } = await supabase
      .from("user_follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_id", targetUserId);

    // Count Scripts
    const { count: scriptCount } = await supabase
      .from("scripts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId);

    // Count Films
    const { count: filmCount } = await supabase
      .from("films")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId);

    // Count Posts
    const { count: postCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId)
      .eq("is_deleted", false);

    // Count Saved
    const { count: savedCount } = await supabase
      .from("post_bookmarks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId);

    // Count Badges
    const { count: badgeCount } = await supabase
      .from("user_badges")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId);

    // Count Awards (Certificates)
    const { count: awardCount } = await supabase
      .from("certificates")
      .select("*", { count: "exact", head: true })
      .eq("user_id", targetUserId);

    return Response.json({
      stats: {
        posts: postCount || 0,
        followers: followerCount || 0,
        following: followingCount || 0,
        films: filmCount || 0,
        scripts: scriptCount || 0,
        coins: profile.coins || 0,
        badges: badgeCount || 0,
        saved: savedCount || 0,
        awards: awardCount || 0,
        avg_rating: profile.avg_rating_received || 0,
        total_ratings: profile.total_ratings_received || 0,
        streak_days: profile.streak_days || 0,
      }
    });

  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
