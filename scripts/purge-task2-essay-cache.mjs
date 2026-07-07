/**
 * Purge stale Task 2 rows from essay_cache.
 *
 * Task 2's first criterion was corrected from Task Achievement (TA) to Task
 * Response (TR). Evaluations cached before that fix were scored against the
 * wrong rubric. The app now version-tags the Task 2 cache hash so those rows
 * can never be read again, but this script removes them to reclaim space.
 *
 * Dry run (default): node scripts/purge-task2-essay-cache.mjs
 * Delete for real:   node scripts/purge-task2-essay-cache.mjs --apply
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");

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

const supabase = getSupabase();

const { count, error: countError } = await supabase
  .from("essay_cache")
  .select("id", { count: "exact", head: true })
  .eq("task_type", "task2");

if (countError) {
  console.error("Failed to count task2 rows:", countError.message);
  process.exit(1);
}

console.log(`Found ${count ?? 0} cached Task 2 evaluation(s).`);

if (!APPLY) {
  console.log("\nDry run — nothing deleted. Re-run with --apply to purge.");
  process.exit(0);
}

if (!count) {
  console.log("Nothing to delete.");
  process.exit(0);
}

const { error: deleteError } = await supabase
  .from("essay_cache")
  .delete()
  .eq("task_type", "task2");

if (deleteError) {
  console.error("Delete failed:", deleteError.message);
  process.exit(1);
}

console.log(`Deleted ${count} stale Task 2 cache row(s).`);
