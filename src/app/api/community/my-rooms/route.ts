import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch communities where user is a member
    const { data: memberships, error } = await supabase
      .from("community_members")
      .select(`
        room_id,
        communities (
          id,
          name,
          description,
          cover_url,
          member_count,
          online_count,
          last_message_at,
          invite_code
        )
      `)
      .eq("user_id", user.id)
      .order("joined_at", { ascending: false });

    if (error) throw error;

    const rooms = memberships.map((m: any) => m.communities);

    return NextResponse.json({ rooms });
  } catch (error: any) {
    console.error("Error fetching my rooms:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
