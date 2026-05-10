import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username, selectedCraft, tagline } = body;

    let userId = (session.user as any).id;
    const userEmail = session.user.email;

    // Resolve UUID if needed
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId || "");
    
    if (!isUuid && userEmail) {
      const { data: profile } = await supabaseAdmin
        .from("users")
        .select("id")
        .eq("email", userEmail)
        .maybeSingle();
      
      if (profile) userId = profile.id;
    }

    if (!userId) {
      return NextResponse.json({ error: "Could not find your user ID. Please sign in again." }, { status: 400 });
    }

    const { error: updateErr } = await supabaseAdmin
      .from("users")
      .upsert({
        id: userId,
        username: username.toLowerCase().replace(/\s+/g, "_"),
        display_name: session.user.name || username,
        email: session.user.email,
        roles: [selectedCraft],
        bio: tagline,
        onboarding_complete: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (updateErr) {
      if (updateErr.code === '23505') {
        return NextResponse.json({ error: "This username is already taken. Please try another one." }, { status: 400 });
      }
      throw updateErr;
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Onboarding API error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
