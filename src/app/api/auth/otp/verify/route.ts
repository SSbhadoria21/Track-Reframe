import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ error: "Email and OTP are required" }, { status: 400 });
    }

    const supabase = await createClient();

    // 1. Find the latest OTP for this email
    const { data, error } = await supabase
      .from("host_verifications")
      .select("*")
      .eq("email", email)
      .eq("otp", otp)
      .is("verified_at", null) // Only unused OTPs
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
    }

    // 2. Check expiry
    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      return NextResponse.json({ error: "Verification code has expired" }, { status: 400 });
    }

    // 3. Mark as verified
    await supabase.from("host_verifications").update({
      verified_at: new Date().toISOString()
    }).eq("id", data.id);

    return NextResponse.json({ success: true, message: "Email verified successfully" });

  } catch (error: any) {
    console.error("VERIFY_OTP_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
