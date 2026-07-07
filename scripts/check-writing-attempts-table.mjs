/**
 * Read-only check that writing_attempts / speaking_attempts exist with the
 * expected band_overall column on the configured Supabase project.
 * Run: node scripts/check-writing-attempts-table.mjs
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

async function checkTable(supabase, table, columns) {
  const { error } = await supabase.from(table).select(columns).limit(1);
  if (error) {
    console.log(`FAIL  ${table} (${columns}) — ${error.message}`);
    return false;
  }
  console.log(`PASS  ${table} exists with columns: ${columns}`);
  return true;
}

const supabase = getSupabase();
const ok = [
  await checkTable(
    supabase,
    "writing_attempts",
    "id, student_id, task_type, band_overall, band_ta, band_cc, band_lr, band_gra, created_at"
  ),
  await checkTable(
    supabase,
    "speaking_attempts",
    "id, student_id, band_overall, created_at"
  ),
].every(Boolean);

if (!ok) {
  console.log(
    "\nOne or more tables/columns are missing. Run supabase/writing_attempts_setup.sql (and supabase/speaking_tables.sql) in the Supabase SQL editor."
  );
  process.exit(1);
}
console.log("\nAll required writing/speaking attempt tables are present.");
