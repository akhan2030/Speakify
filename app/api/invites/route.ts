import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/adminAuth";
import { resolveAppBaseUrl } from "@/lib/appUrl";
import { buildMailtoUrl } from "@/lib/email/buildMailtoUrl";
import { sendEmail } from "@/lib/email/sendEmail";
import {
  generateInviteToken,
  inviteExpiresAt,
  isValidEmail,
} from "@/lib/invites";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const auth = await requireAdminSession();
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json().catch(() => ({}));
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();

    if (!email || !isValidEmail(email)) {
      return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    }

    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch {
      return NextResponse.json(
        { error: "Invites are not available. Please try again later." },
        { status: 503 }
      );
    }

    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const token = generateInviteToken();
    const expiresAt = inviteExpiresAt();

    const { error: insertError } = await supabase.from("invite_tokens").insert({
      token,
      email,
      expires_at: expiresAt,
      used: false,
    });

    if (insertError) {
      console.error("[api/invites] insert", insertError);
      const missingTable = insertError.message?.includes("invite_tokens");
      return NextResponse.json(
        {
          error: missingTable
            ? "Invite setup incomplete. Run supabase/invite_tokens_setup.sql."
            : "Could not create invite. Please try again.",
        },
        { status: missingTable ? 503 : 500 }
      );
    }

    const registerUrl = `${resolveAppBaseUrl(request)}/register?token=${token}`;
    const subject = "You're invited to join Speakify as a teacher";
    const text = [
      "You've been invited to create a teacher account on Speakify.",
      "",
      "Open this link to complete registration (expires in 7 days):",
      registerUrl,
      "",
      "If you did not expect this email, you can ignore it.",
    ].join("\n");
    const html = `
        <p>You've been invited to create a <strong>teacher account</strong> on Speakify.</p>
        <p><a href="${registerUrl}">Complete your registration</a></p>
        <p style="color:#64748b;font-size:14px;">This link expires in 7 days. If you did not expect this email, you can ignore it.</p>
      `;

    const resendConfigured = Boolean(process.env.RESEND_API_KEY?.trim());
    if (!resendConfigured) {
      const mailtoUrl = buildMailtoUrl({ to: email, subject, body: text });
      return NextResponse.json({
        success: true,
        email,
        mode: "mailto",
        registerUrl,
        mailtoUrl,
        emailed: false,
      });
    }

    const emailResult = await sendEmail({
      to: email,
      subject,
      text,
      html,
    });

    if (!emailResult.ok) {
      await supabase.from("invite_tokens").delete().eq("token", token);
      return NextResponse.json(
        { error: emailResult.error ?? "Could not send invite email." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      email,
      mode: emailResult.mode,
      registerUrl,
      emailed: emailResult.mode === "resend",
    });
  } catch (err) {
    console.error("[api/invites]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send invite." },
      { status: 500 }
    );
  }
}
