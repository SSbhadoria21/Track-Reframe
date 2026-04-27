import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { competition_id, host_feedback } = await req.json();

    // Verify ownership
    const { data: comp } = await supabase
        .from("competitions")
        .select("creator_id")
        .eq("id", competition_id)
        .single();

    if (!comp || comp.creator_id !== user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update status to archived
    const { error } = await supabase
        .from("competitions")
        .update({ 
            status: "archived",
            host_feedback: host_feedback 
        })
        .eq("id", competition_id);

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("ARCHIVE_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
