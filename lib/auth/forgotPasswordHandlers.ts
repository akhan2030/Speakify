import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeSaudiPhone } from "@/lib/auth/phone";
import {
  emailExpiresAt,
  findUserByEmail,
  findUserByPhone,
  generateOtp,
  generateResetToken,
  otpExpiresAt,
  upsertPasswordResetToken,
} from "@/lib/auth/passwordReset";
import {
  getRequestIp,
  isPasswordResetRateLimited,
  passwordResetScopes,
  recordPasswordResetAttempts,
} from "@/lib/auth/rateLimit";
import { deliverOtp } from "@/lib/auth/sendOtpDelivery";
import { resolveAppBaseUrl } from "@/lib/appUrl";
import { sendEmail } from "@/lib/email/sendEmail";
import { isResendConfigured } from "@/lib/auth/messagingConfig";
import {
  getStoredVerifiedEmail,
  getStoredVerifiedPhone,
  identifiersMatchStoredContacts,
  type VerifiableUser,
} from "@/lib/auth/verification";
import { getSupabaseAdmin } from "@/lib/supabaseServer";

export const GENERIC_RESET_MESSAGE =
  "If an account exists with a verified contact method on file, we have sent reset instructions.";

export function genericResetResponse() {
  return NextResponse.json({ success: true, message: GENERIC_RESET_MESSAGE });
}

async function guardResetAttempt(
  supabase: SupabaseClient,
  scopes: string[]
): Promise<boolean> {
  const uniqueScopes = Array.from(new Set(scopes));
  if (await isPasswordResetRateLimited(supabase, uniqueScopes)) {
    return true;
  }
  await recordPasswordResetAttempts(supabase, uniqueScopes);
  return false;
}

async function tryDeliverPhoneOtp(
  supabase: SupabaseClient,
  user: VerifiableUser,
  storedPhone: string,
  channel: "whatsapp" | "sms"
) {
  const otp = generateOtp();
  await upsertPasswordResetToken(supabase, {
    userId: user.id,
    token: otp,
    method: channel,
    phone: storedPhone,
    expiresAt: otpExpiresAt(),
  });

  await deliverOtp({
    phone: storedPhone,
    otp,
    channel,
    userEmail: getStoredVerifiedEmail(user),
    userName: user.name,
  });
}

export async function handlePhonePasswordResetRequest(
  request: Request,
  channel: "whatsapp" | "sms"
) {
  try {
    const body = await request.json().catch(() => ({}));
    const inputPhone = normalizeSaudiPhone(String(body.phone ?? ""));

    if (!inputPhone) {
      return NextResponse.json(
        { error: "Please enter a valid Saudi mobile number." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const ip = getRequestIp(request);
    const user = (await findUserByPhone(supabase, inputPhone)) as VerifiableUser | null;
    const storedPhone = user ? getStoredVerifiedPhone(user) : null;
    const scopes = passwordResetScopes({
      ip,
      phone: inputPhone,
      userId: user?.id,
    });

    if (await guardResetAttempt(supabase, scopes)) {
      return genericResetResponse();
    }

    if (
      !user ||
      !storedPhone ||
      !identifiersMatchStoredContacts(user, { phone: inputPhone })
    ) {
      return genericResetResponse();
    }

    await tryDeliverPhoneOtp(supabase, user, storedPhone, channel);
    return genericResetResponse();
  } catch (err) {
    console.error(`[forgot-password/${channel}]`, err);
    return genericResetResponse();
  }
}

export async function handleEmailPasswordResetRequest(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const inputEmail = String(body.email ?? "").trim().toLowerCase();

    if (!inputEmail || !inputEmail.includes("@")) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    const ip = getRequestIp(request);
    const user = (await findUserByEmail(supabase, inputEmail)) as VerifiableUser | null;
    const storedEmail = user ? getStoredVerifiedEmail(user) : null;
    const scopes = passwordResetScopes({
      ip,
      email: inputEmail,
      userId: user?.id,
    });

    if (await guardResetAttempt(supabase, scopes)) {
      return genericResetResponse();
    }

    if (
      !isResendConfigured() ||
      !user ||
      !storedEmail ||
      !identifiersMatchStoredContacts(user, { email: inputEmail })
    ) {
      return genericResetResponse();
    }

    const token = generateResetToken();
    await upsertPasswordResetToken(supabase, {
      userId: user.id,
      token,
      method: "email",
      email: storedEmail,
      expiresAt: emailExpiresAt(),
    });

    const baseUrl = resolveAppBaseUrl(request);
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    const name = user.name || "Student";

    await sendEmail({
      to: storedEmail,
      subject: "Reset your Speakify password",
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #0d1b35;">Reset your password</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your Speakify password.</p>
          <p><a href="${resetUrl}" style="display:inline-block;background:#c9972c;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reset my password</a></p>
          <p style="color:#888;font-size:13px;">This link expires in 15 minutes.</p>
        </div>
      `,
      text: `Hello ${name},\n\nReset your Speakify password:\n${resetUrl}\n\nThis link expires in 15 minutes.`,
    });

    return genericResetResponse();
  } catch (err) {
    console.error("[forgot-password/email]", err);
    return genericResetResponse();
  }
}
