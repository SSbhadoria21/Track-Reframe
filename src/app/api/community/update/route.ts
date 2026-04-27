import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomId, name, description } = await request.json();

    // Verify ownership/admin role
    const { data: member, error: memberError } = await supabase
      .from("community_members")
      .select("role")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .single();

    if (memberError || (member.role !== "admin" && member.role !== "creator")) {
      return NextResponse.json({ error: "Only admins can update community settings" }, { status: 403 });
    }

    const { data: updated, error: updateError } = await supabase
      .from("communities")
      .update({ 
        name, 
        description
      })
      .eq("id", roomId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, community: updated });
  } catch (error: any) {
    console.error("Error updating community:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
