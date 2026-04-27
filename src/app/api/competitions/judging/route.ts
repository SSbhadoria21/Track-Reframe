import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const supabase = await createClient();
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { 
      submission_id, 
      scores, 
      status, 
      feedback 
    } = await req.json();

    if (!submission_id) {
        return NextResponse.json({ error: "Submission ID is required" }, { status: 400 });
    }

    // Verify user is the creator of the competition this submission belongs to
    const { data: submission } = await supabase
        .from("competition_submissions")
        .select(`
            *,
            competition:competitions(creator_id)
        `)
        .eq("id", submission_id)
        .single();

    if (!submission || submission.competition.creator_id !== user.id) {
        return NextResponse.json({ error: "Unauthorized: Only the host can judge" }, { status: 403 });
    }

    // Update the submission with scores and status
    const { data, error } = await supabase
        .from("competition_submissions")
        .update({
            marks_cinematography: scores.cinematography || 0,
            marks_editing: scores.editing || 0,
            marks_direction: scores.direction || 0,
            marks_casting: scores.casting || 0,
            marks_storytelling: scores.storytelling || 0,
            marks_screenplay: scores.screenplay || 0,
            round2_status: status || 'pending',
            jury_feedback: feedback || ''
        })
        .eq("id", submission_id)
        .select()
        .single();

    if (error) throw error;

    return NextResponse.json({ submission: data });
  } catch (error: any) {
    console.error("JUDGING_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
