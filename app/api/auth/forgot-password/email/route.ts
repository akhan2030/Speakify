import { NextResponse } from "next/server";
import { resolveAppBaseUrl } from "@/lib/appUrl";
import {
  emailExpiresAt,
  findUserByEmail,
  generateResetToken,
  upsertPasswordResetToken,
} from "@/lib/auth/passwordReset";
import { sendEmail } from "@/lib/email/sendEmail";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email ?? "").trim().toLowerCase();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const user = await findUserByEmail(supabase, email);

    if (user) {
      const token = generateResetToken();
      await upsertPasswordResetToken(supabase, {
        userId: user.id,
        token,
        method: "email",
        email,
        expiresAt: emailExpiresAt(),
      });

      const baseUrl = resolveAppBaseUrl(request);
      const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
      const name = user.name || "Student";

      const html = `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #0d1b35;">Reset your password</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your Speakify password.</p>
          <p>Click the button below to set a new password:</p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #c9972c; color: white;
                    padding: 12px 24px; border-radius: 8px; text-decoration: none;
                    font-weight: bold; margin: 16px 0;">
            Reset my password
          </a>
          <p style="color: #888; font-size: 13px;">
            This link expires in 1 hour.<br>
            If you did not request a password reset, ignore this email.
          </p>
          <p style="color: #888; font-size: 12px;">
            If the button does not work, copy this link:<br>
            ${resetUrl}
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #888; font-size: 12px;">
            Speakify Global Language Center<br>
            Kingdom of Saudi Arabia
          </p>
        </div>
      `;

      const emailResult = await sendEmail({
        to: email,
        subject: "Reset your Speakify password",
        html,
        text: `Hello ${name},\n\nReset your Speakify password:\n${resetUrl}\n\nThis link expires in 1 hour.`,
      });

      if (!emailResult.ok) {
        console.error("[forgot-password/email]", emailResult.error);
      } else if (emailResult.mode === "console") {
        console.log(`[forgot-password/email] Reset link for ${email}: ${resetUrl}`);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password/email]", err);
    return NextResponse.json({ error: "Could not send reset email." }, { status: 500 });
  }
}
