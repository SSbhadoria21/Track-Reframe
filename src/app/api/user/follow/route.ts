import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { broadcastNotification } from "@/lib/supabase/server-broadcast";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ following: false });

    const { searchParams } = new URL(req.url);
    const targetId = searchParams.get('targetId');
    if (!targetId) return NextResponse.json({ error: "targetId required" }, { status: 400 });

    let userId = (session.user as any).id;
    const userEmail = session.user?.email;

    // Resolve UUID if needed
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId || "");
    if (!isUuid && userEmail) {
      const { data: profile } = await supabaseAdmin.from("users").select("id").eq("email", userEmail).maybeSingle();
      if (profile) userId = profile.id;
    }

    const { data } = await supabaseAdmin
      .from("follows")
      .select("id")
      .eq("follower_id", userId)
      .eq("following_id", targetId)
      .maybeSingle();

    return NextResponse.json({ following: !!data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { target_user_id } = await req.json();
    if (!target_user_id) return NextResponse.json({ error: "target_user_id required" }, { status: 400 });

    let userId = (session.user as any).id;
    const userEmail = session.user?.email;

    // Resolve UUID if needed
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId || "");
    if (!isUuid && userEmail) {
      const { data: profile } = await supabaseAdmin.from("users").select("id").eq("email", userEmail).maybeSingle();
      if (profile) userId = profile.id;
    }

    if (target_user_id === userId) return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });

    const { data: existing } = await supabaseAdmin
      .from("follows")
      .select("id")
      .eq("follower_id", userId)
      .eq("following_id", target_user_id)
      .maybeSingle();

    if (existing) {
      // Unfollow
      const { error } = await supabaseAdmin.from("follows").delete().eq("id", existing.id);
      if (error) throw error;

      // Fetch updated counts for the target user
      const { count: targetFollowerCount } = await supabaseAdmin
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", target_user_id);

      return NextResponse.json({ following: false, follower_count: targetFollowerCount || 0 });
    } else {
      // Follow
      const { error } = await supabaseAdmin.from("follows").insert({ follower_id: userId, following_id: target_user_id });
      if (error) throw error;
      
      // Send notification (use correct column names from schema)
      const { data: userProfile } = await supabaseAdmin.from("users").select("display_name").eq("id", userId).single();
      const displayName = userProfile?.display_name || "Someone";
      
      const notif = {
        user_id: target_user_id,
        related_user_id: userId,
        type: "follow",
        title: `${displayName} started following you`,
        body: `Connect and collaborate on your next project!`,
        related_entity_id: userId,
        related_entity_type: "user"
      };
      await supabaseAdmin.from("notifications").insert(notif).then(async ({ error: notifError }) => {
        if (notifError) console.error("Notification insert error (non-fatal):", notifError.message);
        else {
          await broadcastNotification(`sidebar_stats:${target_user_id}`, notif);
        }
      });

      // Fetch updated counts for the target user
      const { count: targetFollowerCount } = await supabaseAdmin
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", target_user_id);

      return NextResponse.json({ following: true, follower_count: targetFollowerCount || 0 });
    }
  } catch (err: any) {
    console.error("Follow API error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
