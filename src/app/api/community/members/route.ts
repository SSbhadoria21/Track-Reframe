import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;

    // 1. Fetch member records first
    const { data: members, error: memberError } = await supabase
      .from("community_members")
      .select("id, role, user_id, joined_at")
      .eq("room_id", roomId)
      .order("joined_at", { ascending: true });

    if (memberError) {
      console.error("Member fetch error:", memberError);
      return NextResponse.json({ error: memberError.message }, { status: 500 });
    }

    if (!members || members.length === 0) {
      return NextResponse.json({ 
        members: [], 
        debug: { roomId, count: 0, userId: currentUser?.id } 
      });
    }

    // 2. Fetch profiles for these users
    const userIds = members.map(m => m.user_id);
    const { data: profiles, error: profileError } = await supabase
      .from("users")
      .select("id, username, display_name, avatar_url")
      .in("id", userIds);

    // 3. Merge data
    const profileMap = (profiles || []).reduce((acc: any, p) => {
      acc[p.id] = p;
      return acc;
    }, {});

    const enrichedMembers = members.map(m => ({
      ...m,
      users: profileMap[m.user_id] || null
    }));

    return NextResponse.json({ 
      members: enrichedMembers,
      debug: { 
        roomId, 
        count: enrichedMembers.length,
        userId: currentUser?.id
      } 
    });
  } catch (error: any) {
    console.error("Error fetching members:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("roomId");
    const userIdToRemove = searchParams.get("userId");

    if (!roomId || !userIdToRemove) {
      return NextResponse.json({ error: "Room ID and User ID are required" }, { status: 400 });
    }

    // Verify current user is admin/creator of this room
    const { data: adminMember, error: adminError } = await supabase
      .from("community_members")
      .select("role")
      .eq("room_id", roomId)
      .eq("user_id", currentUser.id)
      .single();

    if (adminError || (adminMember.role !== "admin" && adminMember.role !== "creator")) {
      return NextResponse.json({ error: "Only admins can remove members" }, { status: 403 });
    }

    // Don't allow removing yourself if you are the creator? 
    // Or just check if the target is the creator.
    const { data: targetMember } = await supabase
      .from("community_members")
      .select("role")
      .eq("room_id", roomId)
      .eq("user_id", userIdToRemove)
      .single();

    if (targetMember?.role === "creator") {
      return NextResponse.json({ error: "Cannot remove the community creator" }, { status: 400 });
    }

    const { error: removeError } = await supabase
      .from("community_members")
      .delete()
      .eq("room_id", roomId)
      .eq("user_id", userIdToRemove);

    if (removeError) throw removeError;

    // Decrement member count
    const { data: community } = await supabase
      .from("communities")
      .select("member_count")
      .eq("id", roomId)
      .single();

    if (community) {
      await supabase
        .from("communities")
        .update({ member_count: Math.max(0, (community.member_count || 1) - 1) })
        .eq("id", roomId);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
