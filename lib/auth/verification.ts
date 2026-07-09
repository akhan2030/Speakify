import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeSaudiPhone } from "@/lib/auth/phone";
import { generateOtp, generateResetToken, otpExpiresAt } from "@/lib/auth/passwordReset";
import { resolveAppBaseUrl } from "@/lib/appUrl";
import { sendEmail } from "@/lib/email/sendEmail";
import { deliverOtp } from "@/lib/auth/sendOtpDelivery";

export type VerifiableUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
};

const EMAIL_VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export function isEmailVerified(user: VerifiableUser): boolean {
  return Boolean(user.email_verified_at);
}

export function isPhoneVerified(user: VerifiableUser): boolean {
  return Boolean(user.phone_verified_at);
}

export function getStoredVerifiedEmail(user: VerifiableUser): string | null {
  if (!isEmailVerified(user)) return null;
  const email = String(user.email ?? "").trim().toLowerCase();
  return email.includes("@") ? email : null;
}

export function getStoredVerifiedPhone(user: VerifiableUser): string | null {
  if (!isPhoneVerified(user)) return null;
  return normalizeSaudiPhone(String(user.phone ?? ""));
}

export function identifiersMatchStoredContacts(
  user: VerifiableUser,
  input: { email?: string; phone?: string }
): boolean {
  if (input.email) {
    const storedEmail = String(user.email ?? "").trim().toLowerCase();
    return storedEmail === input.email.trim().toLowerCase();
  }
  if (input.phone) {
    const storedPhone = normalizeSaudiPhone(String(user.phone ?? ""));
    return Boolean(storedPhone && storedPhone === input.phone);
  }
  return false;
}

export async function issueRegistrationVerifications(
  supabase: SupabaseClient,
  user: VerifiableUser,
  request?: Request
) {
  const email = String(user.email ?? "").trim().toLowerCase();
  const storedPhone = normalizeSaudiPhone(String(user.phone ?? ""));
  const baseUrl = resolveAppBaseUrl(request);
  const name = user.name?.trim() || "Student";

  if (email.includes("@")) {
    const emailToken = generateResetToken();
    await supabase.from("registration_verification_tokens").insert({
      user_id: user.id,
      channel: "email",
      token: emailToken,
      expires_at: new Date(Date.now() + EMAIL_VERIFY_TTL_MS).toISOString(),
      used: false,
    });

    const verifyUrl = `${baseUrl}/register/verify?token=${encodeURIComponent(emailToken)}&email=${encodeURIComponent(email)}`;
    await sendEmail({
      to: email,
      subject: "Verify your Speakify email",
      html: `
        <div style="font-family:sans-serif;max-width:500px;margin:0 auto;">
          <h2 style="color:#0d1b35;">Verify your email</h2>
          <p>Hello ${name},</p>
          <p>Confirm your email address to activate your Speakify account:</p>
          <a href="${verifyUrl}" style="display:inline-block;background:#c9972c;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Verify email</a>
          <p style="color:#888;font-size:13px;">This link expires in 24 hours.</p>
        </div>
      `,
      text: `Hello ${name},\n\nVerify your Speakify email:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    });
  }

  if (storedPhone) {
    const phoneOtp = generateOtp();
    await supabase.from("registration_verification_tokens").insert({
      user_id: user.id,
      channel: "phone",
      token: phoneOtp,
      expires_at: otpExpiresAt().toISOString(),
      used: false,
    });

    await deliverOtp({
      phone: storedPhone,
      otp: phoneOtp,
      channel: "whatsapp",
      userEmail: email,
      userName: name,
    });
  }
}

export async function verifyRegistrationEmailToken(
  supabase: SupabaseClient,
  token: string
): Promise<{ ok: boolean; error?: string }> {
  const { data: row } = await supabase
    .from("registration_verification_tokens")
    .select("id, user_id, used, expires_at")
    .eq("token", token)
    .eq("channel", "email")
    .eq("used", false)
    .gte("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!row) return { ok: false, error: "Invalid or expired verification link." };

  await supabase
    .from("users")
    .update({ email_verified_at: new Date().toISOString() })
    .eq("id", row.user_id);

  await supabase
    .from("registration_verification_tokens")
    .update({ used: true })
    .eq("id", row.id);

  return { ok: true };
}

export async function verifyRegistrationPhoneOtp(
  supabase: SupabaseClient,
  userId: string,
  otp: string
): Promise<{ ok: boolean; error?: string }> {
  const code = otp.replace(/\D/g, "");
  if (code.length !== 6) return { ok: false, error: "Enter the 6-digit code." };

  const { data: row } = await supabase
    .from("registration_verification_tokens")
    .select("id, used, expires_at")
    .eq("user_id", userId)
    .eq("channel", "phone")
    .eq("token", code)
    .eq("used", false)
    .gte("expires_at", new Date().toISOString())
    .maybeSingle();

  if (!row) return { ok: false, error: "Invalid or expired code." };

  await supabase
    .from("users")
    .update({ phone_verified_at: new Date().toISOString() })
    .eq("id", userId);

  await supabase
    .from("registration_verification_tokens")
    .update({ used: true })
    .eq("id", row.id);

  return { ok: true };
}
