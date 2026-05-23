import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("listingId");

    if (!listingId) {
      return NextResponse.json({ error: "Missing listingId" }, { status: 400 });
    }

    // Resolve actual UUID from DB
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("email", user.email)
      .maybeSingle();

    if (!profile?.id) {
      return NextResponse.json({ error: "Unauthorized: User not found in database" }, { status: 401 });
    }
    const userId = profile.id;

    // Verify ownership of the listing
    const { data: listing, error: listingError } = await supabase
      .from("crew_listings")
      .select("id, user_id")
      .eq("id", listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (listing.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden: You are not the owner of this listing" }, { status: 403 });
    }

    // Fetch applications
    const { data: applications, error: appsError } = await supabase
      .from("crew_interests")
      .select(`
        id,
        message,
        created_at,
        users (
          id,
          username,
          display_name,
          avatar_url,
          email
        )
      `)
      .eq("listing_id", listingId)
      .order("created_at", { ascending: false });

    if (appsError) throw appsError;

    return NextResponse.json({ applications: applications || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
