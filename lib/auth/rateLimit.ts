import type { SupabaseClient } from "@supabase/supabase-js";

export const PASSWORD_RESET_MAX_ATTEMPTS = 5;
export const PASSWORD_RESET_WINDOW_MS = 60 * 60 * 1000;

export function getRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded) return forwarded;
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  return "unknown";
}

export function passwordResetScopes(input: {
  ip: string;
  email?: string | null;
  phone?: string | null;
  userId?: string | null;
}): string[] {
  const scopes = [`ip:${input.ip}`];
  if (input.email) scopes.push(`email:${input.email.trim().toLowerCase()}`);
  if (input.phone) scopes.push(`phone:${input.phone}`);
  if (input.userId) scopes.push(`user:${input.userId}`);
  return scopes;
}

export async function isPasswordResetRateLimited(
  supabase: SupabaseClient,
  scopes: string[]
): Promise<boolean> {
  const since = new Date(Date.now() - PASSWORD_RESET_WINDOW_MS).toISOString();

  for (const scope of scopes) {
    const { count, error } = await supabase
      .from("password_reset_attempts")
      .select("id", { count: "exact", head: true })
      .eq("scope", scope)
      .gte("created_at", since);

    if (error) {
      if (error.message?.includes("password_reset_attempts")) {
        return false;
      }
      console.error("[rateLimit]", error.message);
      continue;
    }

    if ((count ?? 0) >= PASSWORD_RESET_MAX_ATTEMPTS) {
      return true;
    }
  }

  return false;
}

export async function recordPasswordResetAttempts(
  supabase: SupabaseClient,
  scopes: string[]
): Promise<void> {
  const rows = scopes.map((scope) => ({ scope }));
  const { error } = await supabase.from("password_reset_attempts").insert(rows);
  if (error && !error.message?.includes("password_reset_attempts")) {
    console.error("[rateLimit:record]", error.message);
  }
}
