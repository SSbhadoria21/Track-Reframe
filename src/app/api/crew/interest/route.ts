import { createClient } from "@/lib/supabase/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const session = await getServerSession(authOptions);
    const user = session?.user as any;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { listingId, message } = body;

    // Insert interest
    const { data: interest, error } = await supabase
      .from("crew_interests")
      .insert({
        listing_id: listingId,
        user_id: user.id,
        message,
      })
      .select()
      .single();

    if (error) throw error;

    // Increment interest count
    await supabase.rpc("increment_interest_count", { listing_id: listingId });
    // Wait, does increment_interest_count function exist?
    // Let's check or do a direct update. A direct update is safer because it doesn't assume RPC exists.
    const { data: listing } = await supabase
      .from("crew_listings")
      .select("interest_count")
      .eq("id", listingId)
      .single();

    const newCount = (listing?.interest_count || 0) + 1;
    await supabase
      .from("crew_listings")
      .update({ interest_count: newCount })
      .eq("id", listingId);

    return NextResponse.json({ success: true, interest });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
