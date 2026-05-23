import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized: No email found in session" }, { status: 401 });
    }

    // ALWAYS resolve the UUID from the database to guarantee foreign key match
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();
      
    if (!profile?.id) {
      return NextResponse.json({ error: "Unauthorized: User not found in database" }, { status: 401 });
    }
    
    const userId = profile.id;

    const { inviteCode } = await request.json();

    if (!inviteCode) {
      return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
    }

    // 1. Find the community by invite code
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("id, member_count")
      .eq("invite_code", inviteCode.toUpperCase())
      .single();

    if (communityError || !community) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
    }

    // 2. Check if user is already a member
    const { data: existingMember } = await supabase
      .from("community_members")
      .select("id")
      .eq("room_id", community.id)
      .eq("user_id", userId)
      .single();

    if (existingMember) {
      return NextResponse.json({ message: "Already a member", communityId: community.id });
    }

    // 3. Join the community
    const { error: joinError } = await supabase
      .from("community_members")
      .insert({
        room_id: community.id,
        user_id: userId,
        role: "member",
      });

    if (joinError) throw joinError;

    // 4. Update member count
    await supabase
      .from("communities")
      .update({ member_count: (community.member_count || 0) + 1 })
      .eq("id", community.id);

    return NextResponse.json({ success: true, communityId: community.id });
  } catch (error: any) {
    console.error("Error joining community:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
