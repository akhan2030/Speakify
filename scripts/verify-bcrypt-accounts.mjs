/**
 * Read-only: list users whose stored password is not a bcrypt hash.
 * Run: node scripts/verify-bcrypt-accounts.mjs
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const BCRYPT_RE = /^\$2[aby]\$/;

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  if (!url || !process.env.SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(2);
  }
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function passwordKind(stored) {
  if (!stored) return "EMPTY";
  if (BCRYPT_RE.test(stored)) return "bcrypt";
  return "NON_BCRYPT";
}

async function main() {
  const supabase = getSupabase();
  const priority = [
    "admin@speakify.com",
    "student@speakify.com",
    "demo.onboarding@speakify.com",
  ];

  const { data: priorityRows, error: priorityError } = await supabase
    .from("users")
    .select("email, role, password")
    .in("email", priority);

  if (priorityError) throw priorityError;

  console.log("Priority accounts:");
  for (const email of priority) {
    const row = (priorityRows ?? []).find((r) => r.email === email);
    if (!row) {
      console.log(`  ${email}: NOT_FOUND`);
      continue;
    }
    const kind = passwordKind(row.password);
    const prefix = row.password?.slice(0, 7) ?? "";
    console.log(`  ${row.email} (${row.role}): ${kind}${prefix ? ` [${prefix}…]` : ""}`);
  }

  const { data: all, error } = await supabase
    .from("users")
    .select("email, role, password")
    .not("password", "is", null)
    .limit(500);

  if (error) throw error;

  const nonBcrypt = (all ?? []).filter(
    (r) => r.password && !BCRYPT_RE.test(r.password)
  );

  console.log(`\nNon-bcrypt passwords in sample (max 500 rows): ${nonBcrypt.length}`);
  for (const row of nonBcrypt.slice(0, 15)) {
    console.log(`  ${row.email} (${row.role})`);
  }
  if (nonBcrypt.length > 15) {
    console.log(`  … and ${nonBcrypt.length - 15} more`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
