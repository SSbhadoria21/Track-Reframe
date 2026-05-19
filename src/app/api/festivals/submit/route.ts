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

    const { data, error } = await supabase
      .from("festival_submissions")
      .select(`
        *,
        festivals (name, city, country)
      `)
      .eq("user_id", user.id)
      .order("submission_date", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ submissions: data || [] });
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
    const { festivalId, filmTitle, category, submissionDate, feePaidInr, submissionReference, notes, notificationDate } = body;

    const { data, error } = await supabase
      .from("festival_submissions")
      .upsert({
        user_id: user.id,
        festival_id: festivalId,
        film_title: filmTitle || "My Film",
        category,
        submission_date: submissionDate || new Date().toISOString().split("T")[0],
        fee_paid_inr: feePaidInr || 0,
        submission_reference: submissionReference || "",
        status: "submitted",
        notes: notes || "",
        notification_date: notificationDate || null,
      }, {
        onConflict: "user_id,festival_id,film_title",
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, submission: data });
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
    const { submissionId, status, resultDate, notes } = body;

    const updateFields: any = { status };
    if (resultDate) updateFields.result_date = resultDate;
    if (notes !== undefined) updateFields.notes = notes;

    const { data, error } = await supabase
      .from("festival_submissions")
      .update(updateFields)
      .eq("id", submissionId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, submission: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
