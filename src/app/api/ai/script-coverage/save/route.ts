import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { scriptTitle, scriptType, coverageDepth, overallGrade, reportJson, userNote } = body;

    const { data, error } = await supabase
      .from("script_coverage_reports")
      .insert({
        user_id: user.id,
        script_title: scriptTitle || "Untitled Script",
        script_type: scriptType,
        coverage_depth: coverageDepth,
        overall_grade: overallGrade,
        report_json: reportJson,
        user_note: userNote || "",
      })
      .select()
      .single();

    if (error) {
      console.error("Save coverage report error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, report: data });
  } catch (error: any) {
    console.error("Save coverage report critical error:", error);
    return NextResponse.json({ error: error.message || "Failed to save report" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("script_coverage_reports")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ reports: data || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
