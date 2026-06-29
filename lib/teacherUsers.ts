import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { hashPassword } from "@/lib/password";

async function insertTeacherRow(
  supabase: SupabaseClient,
  row: Record<string, unknown>
): Promise<{ userId: string | null; error: string | null }> {
  const { data, error } = await supabase.from("users").insert(row).select("id").single();

  if (!error) return { userId: data.id, error: null };

  if (!error.message?.includes("column")) {
    return { userId: null, error: error.message };
  }

  const minimal = {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role,
  };

  const retry = await supabase.from("users").insert(minimal).select("id").single();
  if (retry.error) return { userId: null, error: retry.error.message };
  return { userId: retry.data.id, error: null };
}

export async function createTeacherUser(
  supabase: SupabaseClient,
  input: { fullName: string; email: string; password: string }
): Promise<{ userId: string | null; error: string | null; status: number }> {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();

  if (!fullName) {
    return { userId: null, error: "Full name is required.", status: 400 };
  }
  if (!email) {
    return { userId: null, error: "Email is required.", status: 400 };
  }
  if (input.password.length < 6) {
    return { userId: null, error: "Password must be at least 6 characters.", status: 400 };
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existing) {
    return {
      userId: null,
      error: "An account with this email already exists.",
      status: 409,
    };
  }

  const passwordHash = await hashPassword(input.password);
  const userId = randomUUID();

  const row = {
    id: userId,
    name: fullName,
    email,
    password: passwordHash,
    role: "teacher",
    is_active: true,
    must_change_password: false,
    student_access: false,
  };

  const { userId: insertedId, error: insertError } = await insertTeacherRow(supabase, row);

  if (!insertedId) {
    if (insertError?.includes("duplicate") || insertError?.includes("23505")) {
      return {
        userId: null,
        error: "An account with this email already exists.",
        status: 409,
      };
    }
    console.error("[teacherUsers] insert", insertError);
    return {
      userId: null,
      error: insertError
        ? `Could not create teacher account: ${insertError}`
        : "Could not create teacher account.",
      status: 500,
    };
  }

  return { userId: insertedId, error: null, status: 200 };
}
