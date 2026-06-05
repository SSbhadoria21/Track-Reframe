import resend from "@/lib/email";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, inviterName, scriptTitle, link } = await req.json();

    if (!email || !link) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data, error: emailError } = await resend.emails.send({
      from: 'Track Reframe <onboarding@resend.dev>', // Use verified domain in production
      to: [email],
      subject: `Invitation to collaborate on "${scriptTitle}"`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h1 style="color: #6C63FF; text-align: center;">Track Reframe</h1>
          <p style="font-size: 16px; color: #333;">Hello,</p>
          <p style="font-size: 16px; color: #333;"><b>${inviterName || 'A colleague'}</b> has invited you to collaborate on their screenplay titled <b>"${scriptTitle}"</b>.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${link}" style="background-color: #6C63FF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px;">Open Script</a>
          </div>
          
          <p style="font-size: 14px; color: #666;">If you don't have an account, you will be prompted to create one before accessing the script.</p>
          <p style="font-size: 12px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
            If you did not expect this invitation, please ignore this email.
          </p>
        </div>
      `,
    });

    if (emailError) {
      console.error("EMAIL_SEND_ERROR:", emailError);
      return NextResponse.json({ error: `Email Error: ${emailError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Invitation sent successfully" });

  } catch (error: any) {
    console.error("INVITE_EMAIL_ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
