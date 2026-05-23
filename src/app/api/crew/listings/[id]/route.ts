import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (!profile?.id) {
      return NextResponse.json({ error: "Unauthorized: User not found in database" }, { status: 401 });
    }

    const userId = profile.id;

    // Verify ownership
    const { data: listing } = await supabase
      .from("crew_listings")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!listing || listing.user_id !== userId) {
      return NextResponse.json({ error: "Unauthorized to modify this listing" }, { status: 403 });
    }

    const body = await req.json();
    const { 
      projectTitle, projectType, rolesNeeded, description, experienceLevel, 
      city, country, shootStartDate, shootEndDate, compensationType, 
      compensationDetails, contactMethod, contactValue, isActive 
    } = body;

    const updates: any = {};
    if (projectTitle !== undefined) updates.project_title = projectTitle;
    if (projectType !== undefined) updates.project_type = projectType;
    if (rolesNeeded !== undefined) updates.roles_needed = rolesNeeded;
    if (description !== undefined) updates.description = description;
    if (experienceLevel !== undefined) updates.experience_level = experienceLevel;
    if (city !== undefined) updates.city = city;
    if (country !== undefined) updates.country = country;
    if (shootStartDate !== undefined) updates.shoot_start_date = shootStartDate || null;
    if (shootEndDate !== undefined) updates.shoot_end_date = shootEndDate || null;
    if (compensationType !== undefined) updates.compensation_type = compensationType;
    if (compensationDetails !== undefined) updates.compensation_details = compensationDetails;
    if (contactMethod !== undefined) updates.contact_method = contactMethod;
    if (contactValue !== undefined) updates.contact_value = contactValue;
    if (isActive !== undefined) updates.is_active = isActive;

    const { data, error } = await supabase
      .from("crew_listings")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ success: true, listing: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
