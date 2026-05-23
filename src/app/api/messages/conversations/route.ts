import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (!profile?.id) {
      return NextResponse.json({ error: "Unauthorized: User not found in database" }, { status: 401 });
    }
    const userId = profile.id;

    // Fetch conversations where user is user1 or user2
    const { data: convos, error } = await supabase
      .from("conversations")
      .select(`
        id,
        user1_id,
        user2_id,
        last_message_at,
        created_at
      `)
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    if (error) throw error;

    if (!convos || convos.length === 0) {
      return NextResponse.json({ conversations: [] });
    }

    // Now we need to fetch the profiles of the other users
    // Extract the "other" user ids
    const otherUserIds = convos.map(c => c.user1_id === userId ? c.user2_id : c.user1_id);

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, username, display_name, avatar_url")
      .in("id", otherUserIds);

    if (usersError) throw usersError;

    // We also want to fetch the latest message for each conversation
    const convoIds = convos.map(c => c.id);
    // In supabase we can't easily fetch latest message per group via standard REST without a view.
    // Let's do a fast query for recent messages in these conversations.
    // For simplicity, we can fetch all messages for these convos and group them, or 
    // fetch the latest message individually. Since it's a small app, let's fetch all messages
    // ordered by created_at desc limit 1 per conversation.
    
    // Instead of complex SQL, we'll map the users. We can fetch the latest message later if needed,
    // or just rely on the conversation data. For a complete UI, the latest message is good.
    // Let's just fetch messages for these convos and sort in JS for now, or just leave it out 
    // if it's too heavy. We'll fetch the last 50 messages total and map them.
    const { data: recentMessages } = await supabase
      .from("direct_messages")
      .select("conversation_id, content, sender_id, is_read, created_at")
      .in("conversation_id", convoIds)
      .order("created_at", { ascending: false });

    const formattedConvos = convos.map(c => {
      const otherId = c.user1_id === userId ? c.user2_id : c.user1_id;
      const otherUser = users?.find(u => u.id === otherId);
      const latestMsg = recentMessages?.find(m => m.conversation_id === c.id);

      return {
        id: c.id,
        otherUser,
        lastMessage: latestMsg || null,
        updatedAt: c.last_message_at || c.created_at
      };
    });

    return NextResponse.json({ conversations: formattedConvos });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
