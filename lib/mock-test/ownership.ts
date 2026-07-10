import type { SupabaseClient } from "@supabase/supabase-js";

type OwnershipResult =
  | { ok: true; attempt: Record<string, unknown> }
  | { ok: false; status: number; error: string };

export async function verifyMockAttemptOwnership(
  supabase: SupabaseClient,
  attemptId: string,
  userId: string,
  select = "student_id, status, report"
): Promise<OwnershipResult> {
  const { data: attempt, error } = await supabase
    .from("mock_test_attempts")
    .select(select)
    .eq("id", attemptId)
    .maybeSingle();

  if (error) throw error;
  if (!attempt || typeof attempt !== "object" || !("student_id" in attempt)) {
    return { ok: false, status: 404, error: "Attempt not found" };
  }

  const row = attempt as { student_id: string };
  if (String(row.student_id) !== String(userId)) {
    return { ok: false, status: 403, error: "Forbidden" };
  }

  return { ok: true, attempt: attempt as Record<string, unknown> };
}
