/**
 * Delete test / smoke accounts from production Supabase.
 * Run: node scripts/purge-test-users.mjs
 * Dry run: node scripts/purge-test-users.mjs --dry-run
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const PROTECTED_EMAILS = new Set(["fatima.emad.almethkal@gmail.com"]);

const EXPLICIT_DELETE_EMAILS = new Set([
  "amankhan@cmail.carleton.ca",
  "amankhan847@hotmail.com",
  "amankhan847@yahoo.com",
  "amankhan847@gmail.com",
  "faryalshah077@gmail.com",
  "amanthegreat074@gmail.com",
  "student@speakify.com",
  "testielts999@test.com",
  "abdurehman.khan@speakify.test",
]);

/** Tables with a student_id column — cleared before users row delete. */
const STUDENT_ID_TABLES = [
  "vocab_streaks",
  "course_enrollments",
  "student_progress",
  "level_scores",
  "certificates",
  "mock_test_attempts",
  "assessment_attempts",
  "writing_attempts",
  "listening_attempts",
  "student_mock_history",
  "speaking_sessions",
  "speaking_progress",
  "speaking_daily_scores",
  "student_content_usage",
  "student_passage_history",
  "student_level_progress",
  "student_vocab_progress",
  "student_vocab_level_status",
  "pathway_graduation_attempts",
  "pathway_lesson_readiness",
  "lesson_completions",
  "grammar_progress",
  "daily_test_limits",
  "daily_task_completions",
  "band_score_history",
  "ielts_self_study_streaks",
  "ielts_self_study_achievements",
  "accelerator_test_history",
  "step_progress_history",
  "step_exit_tests",
  "step_mini_mock_results",
  "step_mock_attempts",
  "step_accelerator_progress",
  "step_accelerator_phase_progress",
  "step_accelerator_daily_sessions",
  "step_accelerator_mock_history",
  "step_accelerator_vocab",
  "homework",
  "teacher_notes",
  "vocabulary_bank",
  "vocabulary_words",
  "ielts_general_student_history",
  "ielts_general_attempts",
];

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function shouldDeleteTestUser(email) {
  const normalized = String(email ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return false;
  if (PROTECTED_EMAILS.has(normalized)) return false;
  if (EXPLICIT_DELETE_EMAILS.has(normalized)) return true;
  if (normalized.endsWith("@speakify-smoke.test")) return true;
  if (normalized.endsWith("@speakify.test")) return true;
  if (normalized.endsWith("@test.com")) return true;
  return false;
}

export function isSmokeTestEmail(email) {
  return String(email ?? "")
    .trim()
    .toLowerCase()
    .endsWith("@speakify-smoke.test");
}

async function deletePlacementData(supabase, studentId) {
  const { data: attempts } = await supabase
    .from("placement_attempts")
    .select("id")
    .eq("student_id", studentId);
  const attemptIds = (attempts ?? []).map((a) => a.id);
  if (!attemptIds.length) return;

  const { error: answersError } = await supabase
    .from("placement_answers")
    .delete()
    .in("attempt_id", attemptIds);
  if (answersError && !/does not exist|Could not find/i.test(answersError.message)) {
    console.warn(`  [warn] placement_answers: ${answersError.message}`);
  }

  const { error: attemptsError } = await supabase
    .from("placement_attempts")
    .delete()
    .in("id", attemptIds);
  if (attemptsError && !/does not exist|Could not find/i.test(attemptsError.message)) {
    console.warn(`  [warn] placement_attempts: ${attemptsError.message}`);
  }
}

async function deleteStudentRows(supabase, studentId, dryRun) {
  if (dryRun) return;

  await Promise.all(
    STUDENT_ID_TABLES.map(async (table) => {
      const { error } = await supabase.from(table).delete().eq("student_id", studentId);
      if (error && !/does not exist|Could not find/i.test(error.message)) {
        console.warn(`  [warn] ${table}: ${error.message}`);
      }
    })
  );

  await deletePlacementData(supabase, studentId);
}

export async function deleteUsersByIds(supabase, userIds, { dryRun = false } = {}) {
  let deleted = 0;
  for (const id of userIds) {
    if (dryRun) {
      deleted += 1;
      continue;
    }
    await deleteStudentRows(supabase, id, dryRun);
    const { error } = await supabase.from("users").delete().eq("id", id);
    if (error) {
      console.warn(`  [warn] users delete ${id}: ${error.message}`);
    } else {
      deleted += 1;
    }
  }
  return deleted;
}

export async function deleteSmokeTestUsers(supabase, { dryRun = false } = {}) {
  const { data: users, error } = await supabase.from("users").select("id, email");
  if (error) throw error;
  const targets = (users ?? []).filter((u) => isSmokeTestEmail(u.email));
  return {
    deleted: await deleteUsersByIds(
      supabase,
      targets.map((u) => u.id),
      { dryRun }
    ),
    emails: targets.map((u) => u.email),
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (!process.env.SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE_SERVICE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = getSupabase();
  const { data: users, error } = await supabase
    .from("users")
    .select("id, email, name, role, created_at")
    .order("email");

  if (error) {
    console.error("Failed to list users:", error.message);
    process.exit(1);
  }

  const toDelete = (users ?? []).filter((u) => shouldDeleteTestUser(u.email));
  const remaining = (users ?? []).filter((u) => !shouldDeleteTestUser(u.email));

  console.log(dryRun ? "--- DRY RUN ---" : "--- DELETING TEST ACCOUNTS ---");
  console.log(`Matched for deletion: ${toDelete.length}`);
  for (const u of toDelete) {
    console.log(`  - ${u.email} (${u.name ?? "no name"})`);
  }

  if (!dryRun && toDelete.length) {
    const deleted = await deleteUsersByIds(
      supabase,
      toDelete.map((u) => u.id),
      { dryRun: false }
    );
    console.log(`\nDeleted ${deleted} account(s).`);
  } else if (dryRun) {
    console.log(`\nWould delete ${toDelete.length} account(s).`);
  } else {
    console.log("\nNo accounts to delete.");
  }

  const { data: afterUsers, error: afterError } = await supabase
    .from("users")
    .select("id, email, name, role")
    .order("email");

  if (afterError) {
    console.error("Failed to list remaining users:", afterError.message);
    process.exit(1);
  }

  console.log(`\n--- Remaining users (${(afterUsers ?? []).length}) ---`);
  for (const u of afterUsers ?? []) {
    console.log(`  ${u.email} — ${u.name ?? "(no name)"} [${u.role}]`);
  }

  process.exit(0);
}

const isDirectRun =
  process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/purge-test-users.mjs") ||
  process.argv[1]?.replace(/\\/g, "/").endsWith("purge-test-users.mjs");

if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
