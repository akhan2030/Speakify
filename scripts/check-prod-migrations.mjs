/**
 * Verify launch-critical Supabase tables/columns exist on the configured project.
 * Run: node scripts/check-prod-migrations.mjs
 *
 * If checks fail, run supabase/launch_migrations_patch.sql in the Supabase SQL editor,
 * then re-run this script.
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  if (!url || !process.env.SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local");
    process.exit(2);
  }
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function columnExists(supabase, table, column) {
  const { error } = await supabase.from(table).select(column).limit(0);
  return !error;
}

async function checkTable(supabase, { name, sql, probe }) {
  const ok = await probe(supabase);
  if (ok) {
    console.log(`PASS  ${name}`);
    return true;
  }
  console.log(`FAIL  ${name}`);
  console.log(`      → Run ${sql}`);
  return false;
}

const supabase = getSupabase();
const url = (process.env.SUPABASE_URL || "")
  .replace(/\/rest\/v1\/?$/i, "")
  .replace(/\/$/, "");
console.log(`Checking Supabase project: ${url}\n`);

const PATCH = "supabase/launch_migrations_patch.sql";

const results = await Promise.all([
  checkTable(supabase, {
    name: "writing_attempts",
    sql: "supabase/writing_attempts_setup.sql",
    probe: async (sb) =>
      (await columnExists(sb, "writing_attempts", "band_overall")) &&
      (await columnExists(sb, "writing_attempts", "band_ta")),
  }),
  checkTable(supabase, {
    name: "speaking_attempts (+ task_type)",
    sql: PATCH,
    probe: async (sb) =>
      (await columnExists(sb, "speaking_attempts", "band_overall")) &&
      (await columnExists(sb, "speaking_attempts", "task_type")),
  }),
  checkTable(supabase, {
    name: "grammar_progress (modern or legacy)",
    sql: `${PATCH} or supabase/grammar_progress_setup.sql`,
    probe: async (sb) => {
      const modern = await columnExists(sb, "grammar_progress", "lessons_completed");
      const legacy = await columnExists(sb, "grammar_progress", "lesson_id");
      return modern || legacy;
    },
  }),
  checkTable(supabase, {
    name: "speaking_sessions (+ Part 3 columns)",
    sql: "supabase/speaking_sessions_setup.sql + supabase/speaking_part3_columns.sql",
    probe: async (sb) =>
      (await columnExists(sb, "speaking_sessions", "programme")) &&
      (await columnExists(sb, "speaking_sessions", "part3_questions")),
  }),
  checkTable(supabase, {
    name: "speaking_progress",
    sql: "supabase/speaking_sessions_setup.sql",
    probe: async (sb) => columnExists(sb, "speaking_progress", "current_band"),
  }),
  checkTable(supabase, {
    name: "ielts_general_attempts (+ skill or task_type)",
    sql: "supabase/ielts_general_attempts_setup.sql + " + PATCH,
    probe: async (sb) => {
      const base = await columnExists(sb, "ielts_general_attempts", "band_score");
      const skill = await columnExists(sb, "ielts_general_attempts", "skill");
      const taskType = await columnExists(sb, "ielts_general_attempts", "task_type");
      return base && (skill || taskType);
    },
  }),
  checkTable(supabase, {
    name: "ielts_general_student_history",
    sql: "supabase/ielts_general_attempts_setup.sql + " + PATCH,
    probe: async (sb) => {
      const id = await columnExists(sb, "ielts_general_student_history", "student_id");
      const band =
        (await columnExists(sb, "ielts_general_student_history", "band_score")) ||
        (await columnExists(sb, "ielts_general_student_history", "overall_band"));
      const when =
        (await columnExists(sb, "ielts_general_student_history", "recorded_at")) ||
        (await columnExists(sb, "ielts_general_student_history", "completed_at"));
      return id && band && when;
    },
  }),
  checkTable(supabase, {
    name: "essay_cache",
    sql: "(created on first Academic writing eval)",
    probe: async (sb) =>
      (await columnExists(sb, "essay_cache", "essay_hash")) &&
      (await columnExists(sb, "essay_cache", "task_type")),
  }),
]);

const passed = results.filter(Boolean).length;
const total = results.length;

console.log(`\n${passed}/${total} checks passed.`);

if (passed < total) {
  console.log(
    "\nApply missing migrations in Supabase SQL editor. Start with:"
  );
  console.log("  supabase/launch_migrations_patch.sql");
  console.log("Then re-run: node scripts/check-prod-migrations.mjs");
  process.exit(1);
}

console.log("\nAll launch-critical migrations are present.");
