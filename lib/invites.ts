import { randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const INVITE_EXPIRY_DAYS = 7;

export function generateInviteToken(): string {
  return randomBytes(32).toString("hex");
}

export function inviteExpiresAt(): string {
  const expires = new Date();
  expires.setDate(expires.getDate() + INVITE_EXPIRY_DAYS);
  return expires.toISOString();
}

export type InviteRow = {
  token: string;
  email: string;
  expires_at: string;
  used: boolean;
};

export async function findValidInvite(
  supabase: SupabaseClient,
  token: string
): Promise<{ invite: InviteRow | null; error: string | null }> {
  const trimmed = token.trim();
  if (!trimmed) {
    return { invite: null, error: "Invalid invite link." };
  }

  const { data, error } = await supabase
    .from("invite_tokens")
    .select("token, email, expires_at, used")
    .eq("token", trimmed)
    .maybeSingle();

  if (error) {
    console.error("[invites] lookup", error);
    return { invite: null, error: "Could not validate invite." };
  }

  if (!data) {
    return { invite: null, error: "This invite link is invalid or has already been used." };
  }

  if (data.used) {
    return { invite: null, error: "This invite has already been used." };
  }

  if (new Date(data.expires_at).getTime() < Date.now()) {
    return { invite: null, error: "This invite link has expired." };
  }

  return { invite: data as InviteRow, error: null };
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}
