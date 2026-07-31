import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Progressive selects: never drop programme fields because one optional column is missing. */
const USER_SELECT_ATTEMPTS = [
  "id, name, email, role, program_type, enrolled_programs, step_enrolled, onboarding_completed, payment_status, payment_comped_until, program_selected",
  "id, name, email, role, program_type, enrolled_programs, step_enrolled, onboarding_completed, payment_status, program_selected",
  "id, name, email, role, program_type, enrolled_programs, step_enrolled, onboarding_completed",
  "id, name, email, role, program_type, enrolled_programs, step_enrolled",
  "id, name, email, role, program_type, enrolled_programs",
  "id, name, email, role, program_type",
  "id, name, email, role",
] as const;

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  program_type?: string | null;
  enrolled_programs?: unknown;
  step_enrolled?: boolean | null;
  onboarding_completed?: boolean | null;
  payment_status?: string | null;
  payment_comped_until?: string | null;
  program_selected?: string | null;
  password?: string;
  is_active?: boolean | null;
  must_change_password?: boolean | null;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  phone?: string | null;
};

export async function fetchUserRowByEmail(
  supabase: SupabaseClient,
  email: string,
  extraColumns = ""
): Promise<{ data: UserRow | null; error: { message?: string } | null }> {
  const normalizedEmail = email.trim().toLowerCase();
  let lastError: { message?: string } | null = null;

  for (const baseSelect of USER_SELECT_ATTEMPTS) {
    const select = extraColumns ? `${baseSelect}, ${extraColumns}` : baseSelect;
    const result = await supabase
      .from("users")
      .select(select)
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (!result.error) {
      return { data: result.data as UserRow | null, error: null };
    }

    lastError = result.error;
    if (!result.error.message?.includes("column")) {
      break;
    }
  }

  return { data: null, error: lastError };
}

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY?.trim();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
