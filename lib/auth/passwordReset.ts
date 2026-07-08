import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hashPassword } from "@/lib/password";
import { phoneLookupVariants } from "@/lib/auth/phone";

export type ResetMethod = "whatsapp" | "sms" | "email" | "verified";

export type PasswordResetRow = {
  id: string;
  user_id: string;
  token: string;
  method: ResetMethod | string;
  phone: string | null;
  email: string | null;
  expires_at: string;
  used: boolean;
};

const OTP_TTL_MS = 10 * 60 * 1000;
const EMAIL_TTL_MS = 60 * 60 * 1000;

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function generateResetToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function findUserByEmail(supabase: SupabaseClient, email: string) {
  const normalized = email.trim().toLowerCase();
  const { data } = await supabase
    .from("users")
    .select("id, name, email, phone")
    .eq("email", normalized)
    .maybeSingle();
  return data;
}

export async function findUserByPhone(supabase: SupabaseClient, e164Phone: string) {
  const variants = phoneLookupVariants(e164Phone);
  for (const variant of variants) {
    const { data } = await supabase
      .from("users")
      .select("id, name, email, phone")
      .eq("phone", variant)
      .maybeSingle();
    if (data) return data;
  }

  const digitsOnly = e164Phone.replace(/\D/g, "");
  const { data: rows } = await supabase
    .from("users")
    .select("id, name, email, phone")
    .not("phone", "is", null)
    .limit(500);

  const match = (rows ?? []).find((row) => {
    const stored = String(row.phone ?? "").replace(/\D/g, "");
    return stored === digitsOnly || stored.endsWith(digitsOnly.slice(-9));
  });

  return match ?? null;
}

export async function upsertPasswordResetToken(
  supabase: SupabaseClient,
  input: {
    userId: string;
    token: string;
    method: ResetMethod;
    phone?: string | null;
    email?: string | null;
    expiresAt: Date;
  }
) {
  const { error } = await supabase.from("password_reset_tokens").upsert(
    {
      user_id: input.userId,
      token: input.token,
      method: input.method,
      phone: input.phone ?? null,
      email: input.email ?? null,
      expires_at: input.expiresAt.toISOString(),
      used: false,
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}

export async function verifyOtpToken(
  supabase: SupabaseClient,
  phone: string,
  otp: string
): Promise<PasswordResetRow | null> {
  const variants = phoneLookupVariants(phone);
  const { data: rows } = await supabase
    .from("password_reset_tokens")
    .select("*")
    .in("phone", variants)
    .eq("token", otp)
    .in("method", ["whatsapp", "sms"])
    .eq("used", false)
    .gte("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1);

  return rows?.[0] ?? null;
}

export async function findValidResetToken(
  supabase: SupabaseClient,
  token: string
): Promise<PasswordResetRow | null> {
  const { data } = await supabase
    .from("password_reset_tokens")
    .select("*")
    .eq("token", token)
    .eq("used", false)
    .gte("expires_at", new Date().toISOString())
    .maybeSingle();

  return data;
}

export async function promoteOtpToResetToken(
  supabase: SupabaseClient,
  rowId: string,
  resetToken: string
) {
  const { error } = await supabase
    .from("password_reset_tokens")
    .update({ token: resetToken, method: "verified" })
    .eq("id", rowId);

  if (error) throw error;
  return resetToken;
}

export async function resetUserPassword(
  supabase: SupabaseClient,
  userId: string,
  newPassword: string,
  tokenRowId: string
) {
  const passwordHash = await hashPassword(newPassword);
  const { error: userError } = await supabase
    .from("users")
    .update({
      password: passwordHash,
      must_change_password: false,
    })
    .eq("id", userId);

  if (userError) {
    if (userError.message?.includes("must_change_password")) {
      const { error: fallback } = await supabase
        .from("users")
        .update({ password: passwordHash })
        .eq("id", userId);
      if (fallback) throw fallback;
    } else {
      throw userError;
    }
  }

  const { error: tokenError } = await supabase
    .from("password_reset_tokens")
    .update({ used: true })
    .eq("id", tokenRowId);

  if (tokenError) throw tokenError;
}

export function otpExpiresAt(): Date {
  return new Date(Date.now() + OTP_TTL_MS);
}

export function emailExpiresAt(): Date {
  return new Date(Date.now() + EMAIL_TTL_MS);
}
