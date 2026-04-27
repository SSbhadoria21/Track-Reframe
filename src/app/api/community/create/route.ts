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

    const body = await request.json();
    const { name, description, cover_url, tags, is_private, require_approval } = body;

    if (!name) {
      return NextResponse.json({ error: "Room name is required" }, { status: 400 });
    }

    // Use provided invite code or generate a random one starting with TR-
    const inviteCode = body.inviteCode || ("TR-" + Math.random().toString(36).substring(2, 8).toUpperCase());

    // 1. Create the community
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .insert({
        name,
        description,
        cover_url,
        creator_id: user.id,
        tags: tags || [],
        is_private: !!is_private,
        require_approval: !!require_approval,
        invite_code: inviteCode,
        member_count: 1, // Creator is the first member
      })
      .select()
      .single();

    if (communityError) throw communityError;

    // 2. Add the creator as an admin member
    const { error: memberError } = await supabase
      .from("community_members")
      .insert({
        room_id: community.id,
        user_id: user.id,
        role: "admin",
      });

    if (memberError) throw memberError;

    return NextResponse.json({ community });
  } catch (error: any) {
    console.error("Error creating community:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
