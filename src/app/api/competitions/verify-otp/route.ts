import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  const supabase = await createClient();
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { action, code } = await req.json();

    if (action === "send") {
      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const { error } = await supabase.from("otps").insert({
        user_id: user.id,
        code: otpCode,
        purpose: "create_competition",
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      // In a real app, send email/SMS here. For now, we'll return it or log it.
      // OTP logic removed from logs
      
      return NextResponse.json({ message: "OTP sent successfully" });
    }

    if (action === "verify") {
      const { data, error } = await supabase
        .from("otps")
        .select("*")
        .eq("user_id", user.id)
        .eq("code", code)
        .eq("purpose", "create_competition")
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error || !data) {
        return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
      }

      // Cleanup OTP after verification
      await supabase.from("otps").delete().eq("id", data.id);

      return NextResponse.json({ message: "OTP verified", token: data.id });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
