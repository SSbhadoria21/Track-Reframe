import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const role = searchParams.get("role") || "";
    const city = searchParams.get("city") || "";
    const compensation = searchParams.get("compensation") || "";
    const search = searchParams.get("search") || "";

    let query = supabase
      .from("crew_listings")
      .select(`
        *,
        users (id, username, display_name, avatar_url)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (city) {
      query = query.ilike("city", `%${city}%`);
    }

    if (compensation) {
      query = query.eq("compensation_type", compensation);
    }

    const { data: listings, error } = await query;

    if (error) throw error;

    let filtered = listings || [];

    // Filter by role accepted or list
    if (role) {
      filtered = filtered.filter((l) =>
        l.roles_needed?.some((r: string) => r.toLowerCase().includes(role.toLowerCase()))
      );
    }

    if (search) {
      filtered = filtered.filter((l) =>
        l.project_title.toLowerCase().includes(search.toLowerCase()) ||
        l.description?.toLowerCase().includes(search.toLowerCase())
      );
    }

    return NextResponse.json({ listings: filtered });
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
    const { projectTitle, projectType, rolesNeeded, description, experienceLevel, city, country, shootStartDate, shootEndDate, compensationType, compensationDetails, contactMethod, contactValue } = body;

    const { data, error } = await supabase
      .from("crew_listings")
      .insert({
        user_id: user.id,
        project_title: projectTitle,
        project_type: projectType,
        roles_needed: rolesNeeded || [],
        description,
        experience_level: experienceLevel,
        city,
        country,
        shoot_start_date: shootStartDate || null,
        shoot_end_date: shootEndDate || null,
        compensation_type: compensationType,
        compensation_details: compensationDetails,
        contact_method: contactMethod,
        contact_value: contactValue,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, listing: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
