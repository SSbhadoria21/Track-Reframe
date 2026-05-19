import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("user_id") || user.id;

    // Fetch collaborations where user is sender OR receiver
    const { data, error } = await supabase
      .from("collaborations")
      .select(`
        *,
        sender:users!collaborations_sender_id_fkey (id, username, display_name, avatar_url),
        receiver:users!collaborations_receiver_id_fkey (id, username, display_name, avatar_url)
      `)
      .or(`sender_id.eq.${targetUserId},receiver_id.eq.${targetUserId}`)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ collaborations: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { projectName, projectType, roleSender, roleReceiver, receiverId } = body;

    const { data, error } = await supabase
      .from("collaborations")
      .insert({
        sender_id: user.id,
        receiver_id: receiverId,
        project_name: projectName,
        project_type: projectType,
        role_sender: roleSender,
        role_receiver: roleReceiver,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, collaboration: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { collaborationId, status } = body; // status: 'accepted' | 'declined' | 'completed'

    const { data, error } = await supabase
      .from("collaborations")
      .update({ status })
      .eq("id", collaborationId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, collaboration: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
