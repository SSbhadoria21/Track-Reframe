import { createClient } from "@/lib/supabase/server";
import resend from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    const supabase = await createClient();

    // 2. Save OTP to DB
    const { error: dbError } = await supabase.from("host_verifications").insert({
      email,
      otp,
      expires_at: expiresAt.toISOString(),
    });

    if (dbError) {
      console.error("OTP_SAVE_ERROR:", dbError);
      return NextResponse.json({ error: `DB Error: ${dbError.message}` }, { status: 500 });
    }


    // 3. Send Email via Resend
    const { data, error: emailError } = await resend.emails.send({
      from: 'Track Reframe <onboarding@resend.dev>', // Update this to your verified domain in production
      to: [email],
      subject: 'Your Track Reframe Verification Code',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h1 style="color: #F5A623; text-align: center;">Track Reframe</h1>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;">You are receiving this email to verify your professional contact information for a new competition on Track Reframe.</p>
          <div style="background-color: #F9F9F9; padding: 20px; text-align: center; border-radius: 10px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #666; text-align: center;">This code will expire in 5 minutes.</p>
          <p style="font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            If you did not request this code, please ignore this email.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("EMAIL_SEND_ERROR:", emailError);
      return NextResponse.json({ error: `Email Error: ${emailError.message}` }, { status: 500 });
    }


    return NextResponse.json({ success: true, message: "Verification code sent" });

  } catch (error: any) {
    console.error("SEND_OTP_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
