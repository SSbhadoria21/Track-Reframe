import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json({ error: "Missing user_id parameter" }, { status: 400 });
    }

    const { data: skills, error } = await supabase
      .from("crew_skills")
      .select(`
        *,
        skill_verifications (id, verifier_id)
      `)
      .eq("user_id", userId);

    if (error) throw error;
    return NextResponse.json({ skills: skills || [] });
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
    const { skillName, action, skillId } = body; // action: 'add' | 'verify'

    if (action === "verify") {
      if (!skillId) {
        return NextResponse.json({ error: "skillId is required to verify" }, { status: 400 });
      }

      // Check if already verified
      const { data: existing } = await supabase
        .from("skill_verifications")
        .select("id")
        .eq("skill_id", skillId)
        .eq("verifier_id", user.id)
        .single();

      if (existing) {
        return NextResponse.json({ error: "Already verified this skill" }, { status: 400 });
      }

      // Insert verification
      const { error: insertError } = await supabase
        .from("skill_verifications")
        .insert({
          skill_id: skillId,
          verifier_id: user.id,
        });

      if (insertError) throw insertError;

      // Increment verification_count on crew_skills
      const { data: skill } = await supabase
        .from("crew_skills")
        .select("verification_count")
        .eq("id", skillId)
        .single();

      const newCount = (skill?.verification_count || 0) + 1;
      await supabase
        .from("crew_skills")
        .update({ verification_count: newCount })
        .eq("id", skillId);

      return NextResponse.json({ success: true, verified: true });
    } else {
      // Add a skill
      if (!skillName) {
        return NextResponse.json({ error: "skillName is required to add" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("crew_skills")
        .insert({
          user_id: user.id,
          skill_name: skillName,
          verification_count: 0,
        })
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json({ success: true, skill: data });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
