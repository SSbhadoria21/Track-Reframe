import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { targetUserId, content } = await req.json();

    if (!targetUserId || !content || !content.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (!profile?.id) {
      return NextResponse.json({ error: "Unauthorized: User not found in database" }, { status: 401 });
    }
    const userId = profile.id;

    if (userId === targetUserId) {
      return NextResponse.json({ error: "Cannot send message to yourself" }, { status: 400 });
    }

    // Determine user1_id and user2_id
    const user1_id = userId < targetUserId ? userId : targetUserId;
    const user2_id = userId < targetUserId ? targetUserId : userId;

    // Check if conversation exists
    let { data: conversation } = await supabase
      .from("conversations")
      .select("id")
      .eq("user1_id", user1_id)
      .eq("user2_id", user2_id)
      .maybeSingle();

    if (!conversation) {
      // Create new conversation
      const { data: newConvo, error: convoError } = await supabase
        .from("conversations")
        .insert({ user1_id, user2_id })
        .select()
        .single();
      
      if (convoError) throw convoError;
      conversation = newConvo;
    } else {
      // Update last_message_at
      await supabase
        .from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversation.id);
    }

    // Insert message
    const { data: message, error: msgError } = await supabase
      .from("direct_messages")
      .insert({
        conversation_id: conversation!.id,
        sender_id: userId,
        content: content.trim(),
      })
      .select()
      .single();

    if (msgError) throw msgError;

    return NextResponse.json({ message });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
