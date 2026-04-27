import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function PUT(req: Request) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await req.json();

    // Extract allowed fields
    const { 
      display_name, 
      bio, 
      city, 
      country, 
      portfolio_url, 
      cover_url, 
      avatar_url,
      roles 
    } = body;

    const updates: any = {};
    if (display_name !== undefined) updates.display_name = display_name;
    if (bio !== undefined) updates.bio = bio;
    if (city !== undefined) updates.city = city;
    if (country !== undefined) updates.country = country;
    if (portfolio_url !== undefined) updates.portfolio_url = portfolio_url;
    if (cover_url !== undefined) updates.cover_url = cover_url;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;
    if (roles !== undefined) updates.roles = roles;

    // Optional: Also update user_metadata in auth.users if display_name or roles change
    const authUpdates: any = {};
    if (display_name !== undefined) authUpdates.display_name = display_name;
    if (roles !== undefined && roles.length > 0) authUpdates.role = roles[0]; // sync first role

    if (Object.keys(authUpdates).length > 0) {
      await supabase.auth.updateUser({
        data: authUpdates
      });
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Profile update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: data });
  } catch (error: any) {
    console.error("Profile API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
