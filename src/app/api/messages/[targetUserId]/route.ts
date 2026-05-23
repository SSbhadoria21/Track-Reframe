import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ targetUserId: string }> }) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { targetUserId } = await params;

    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (!profile?.id) {
      return NextResponse.json({ error: "Unauthorized: User not found in database" }, { status: 401 });
    }
    const userId = profile.id;

    // Fetch the target user's details
    const { data: targetUser, error: targetError } = await supabase
      .from("users")
      .select("id, username, display_name, avatar_url")
      .eq("id", targetUserId)
      .single();

    if (targetError || !targetUser) {
      return NextResponse.json({ error: "Target user not found" }, { status: 404 });
    }

    // Determine user1_id and user2_id (user1 is always the smaller UUID)
    const user1_id = userId < targetUserId ? userId : targetUserId;
    const user2_id = userId < targetUserId ? targetUserId : userId;

    // Fetch conversation
    const { data: conversation } = await supabase
      .from("conversations")
      .select("*")
      .eq("user1_id", user1_id)
      .eq("user2_id", user2_id)
      .maybeSingle();

    if (!conversation) {
      // No conversation yet, return empty messages
      return NextResponse.json({ messages: [], targetUser, conversationId: null });
    }

    // Fetch messages
    const { data: messages, error: msgError } = await supabase
      .from("direct_messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    if (msgError) throw msgError;

    // Mark unread messages as read if they were sent by the other user
    const unreadMessages = messages?.filter(m => !m.is_read && m.sender_id === targetUserId) || [];
    if (unreadMessages.length > 0) {
      await supabase
        .from("direct_messages")
        .update({ is_read: true })
        .in("id", unreadMessages.map(m => m.id));
    }

    return NextResponse.json({ 
      messages: messages || [], 
      targetUser, 
      conversationId: conversation.id 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
