import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();


  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { submission_id, rating, comment } = await req.json();

    const { data, error } = await supabase
      .from("submission_ratings")
      .upsert({
        submission_id,
        user_id: user.id,
        rating,
        comment
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger average rating update (via RPC or manual)
    await supabase.rpc("update_submission_avg_rating", { sub_id: submission_id });

    return NextResponse.json({ rating: data });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
