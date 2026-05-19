import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    const { id } = params;

    // Fetch festival details
    const { data: festival, error } = await supabase
      .from("festivals")
      .select(`
        *,
        festival_deadlines (*),
        festival_winners (*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      console.error("Fetch single festival error:", error);
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    let isSaved = false;
    let submission = null;

    if (user) {
      // Check if user saved this festival
      const { data: saved } = await supabase
        .from("saved_festivals")
        .select("id")
        .eq("user_id", user.id)
        .eq("festival_id", id)
        .single();
      isSaved = !!saved;

      // Check if user submitted to this festival
      const { data: sub } = await supabase
        .from("festival_submissions")
        .select("*")
        .eq("user_id", user.id)
        .eq("festival_id", id)
        .single();
      submission = sub || null;
    }

    return NextResponse.json({
      festival,
      isSaved,
      submission,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to load festival detail" }, { status: 500 });
  }
}
