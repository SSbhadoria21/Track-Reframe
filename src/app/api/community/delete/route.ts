import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const roomId = searchParams.get("id");

    if (!roomId) {
      return NextResponse.json({ error: "Room ID is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify ownership/creator role
    const { data: member, error: memberError } = await supabase
      .from("community_members")
      .select("role")
      .eq("room_id", roomId)
      .eq("user_id", user.id)
      .single();

    if (memberError || (member.role !== "admin" && member.role !== "creator")) {
      return NextResponse.json({ error: "Only creators can delete the community" }, { status: 403 });
    }

    // Delete community (cascades should handle members and messages if configured, 
    // but we can delete explicitly to be safe)
    
    // 1. Delete messages
    await supabase.from("messages").delete().eq("room_id", roomId);
    
    // 2. Delete members
    await supabase.from("community_members").delete().eq("room_id", roomId);
    
    // 3. Delete community
    const { error: deleteError } = await supabase
      .from("communities")
      .delete()
      .eq("id", roomId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting community:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
