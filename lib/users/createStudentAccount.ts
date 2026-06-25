import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendWelcomeEmail } from "@/lib/email/welcomeEmail";
import { hashPassword } from "@/lib/password";
import { getLoginUrl, getSupabaseAdmin } from "@/lib/supabaseServer";

export type CreateStudentAccountInput = {
  name: string;
  email: string;
  temporaryPassword: string;
  sendWelcomeEmail?: boolean;
};

export type CreateStudentAccountResult =
  | {
      ok: true;
      userId: string;
      name: string;
      email: string;
      message: string;
      emailSent: boolean;
      emailMode?: string;
    }
  | {
      ok: false;
      status: 409 | 400 | 500 | 503;
      error: string;
    };

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function validateInput(input: CreateStudentAccountInput): string | null {
  const name = input.name?.trim();
  const email = normalizeEmail(input.email || "");
  const password = input.temporaryPassword ?? "";

  if (!name) return "Student name is required.";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "A valid email address is required.";
  }
  if (!password || password.length < 8) {
    return "Temporary password must be at least 8 characters.";
  }
  return null;
}

async function insertUserRow(
  supabase: SupabaseClient,
  row: Record<string, unknown>
) {
  const { data, error } = await supabase
    .from("users")
    .insert(row)
    .select("id")
    .single();

  if (!error) return { data, error: null };

  if (!error.message?.includes("column")) {
    return { data: null, error };
  }

  const minimal = {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role,
  };
  return supabase.from("users").insert(minimal).select("id").single();
}

export async function createStudentAccount(
  input: CreateStudentAccountInput
): Promise<CreateStudentAccountResult> {
  const validationError = validateInput(input);
  if (validationError) {
    return { ok: false, status: 400, error: validationError };
  }

  let supabase: SupabaseClient;
  try {
    supabase = getSupabaseAdmin();
  } catch {
    return {
      ok: false,
      status: 503,
      error: "Database is not configured. Check SUPABASE env vars.",
    };
  }

  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const loginUrl = getLoginUrl();

  const { data: existing } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      status: 409,
      error: "An account with this email already exists.",
    };
  }

  const passwordHash = await hashPassword(input.temporaryPassword);
  const userId = randomUUID();

  const { data: newUser, error: userError } = await insertUserRow(supabase, {
    id: userId,
    name,
    email,
    password: passwordHash,
    role: "student",
    is_active: true,
    must_change_password: true,
  });

  if (userError) {
    if (
      userError.code === "23505" ||
      userError.message?.includes("duplicate")
    ) {
      return {
        ok: false,
        status: 409,
        error: "An account with this email already exists.",
      };
    }
    console.error("[createStudentAccount] users insert", userError);
    return {
      ok: false,
      status: 500,
      error: "Could not create student account.",
    };
  }

  const { error: streakError } = await supabase.from("vocab_streaks").insert({
    student_id: newUser.id,
    current_streak: 0,
    longest_streak: 0,
  });

  if (streakError) {
    console.error("[createStudentAccount] vocab_streaks insert", streakError);
    await supabase.from("users").delete().eq("id", newUser.id);
    return {
      ok: false,
      status: 500,
      error: streakError.message?.includes("vocab_streaks")
        ? "Registration setup incomplete. Run supabase/vocab_streaks_setup.sql."
        : "Could not finish student account setup.",
    };
  }

  let emailSent = false;
  let emailMode: string | undefined;

  if (input.sendWelcomeEmail !== false) {
    const emailResult = await sendWelcomeEmail({
      name,
      email,
      temporaryPassword: input.temporaryPassword,
      loginUrl,
    });
    emailSent = emailResult.ok;
    emailMode = emailResult.mode;
    if (!emailResult.ok) {
      console.warn(
        "[createStudentAccount] welcome email failed:",
        emailResult.error
      );
    }
  }

  return {
    ok: true,
    userId: newUser.id,
    name,
    email,
    message: `Student account created successfully for ${name}.`,
    emailSent,
    emailMode,
  };
}
