/**
 * Creates student_content_usage table for per-student content exclusion.
 *
 * Preferred: add your Postgres URI to .env.local as SUPABASE_DB_URL, then run:
 *   npm run setup:student-content-usage
 *
 * Without DB URI: paste supabase/student_content_usage_setup.sql into Supabase SQL Editor.
 *
 * Verify only (uses SUPABASE_URL + SUPABASE_SERVICE_KEY):
 *   npm run setup:student-content-usage:verify
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env.local"), quiet: true });

function getSupabaseRestUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getProjectRef() {
  return getSupabaseRestUrl().match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? null;
}

function getSqlPath() {
  return path.join(__dirname, "..", "supabase", "student_content_usage_setup.sql");
}

function buildPgConnectionString() {
  if (process.env.SUPABASE_DB_URL || process.env.DATABASE_URL) {
    return process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  }

  if (process.env.SUPABASE_DB_PASSWORD) {
    const ref = getProjectRef();
    if (ref) {
      const enc = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD);
      const host =
        process.env.SUPABASE_DB_HOST ||
        `aws-0-${process.env.SUPABASE_REGION || "us-east-1"}.pooler.supabase.com`;
      const port = process.env.SUPABASE_DB_PORT || "5432";
      const user = process.env.SUPABASE_DB_USER || `postgres.${ref}`;
      return `postgresql://${user}:${enc}@${host}:${port}/postgres`;
    }
  }

  return null;
}

function printManualInstructions(reason) {
  const ref = getProjectRef();
  const sqlPath = getSqlPath();

  console.error("\nCould not run migration automatically:", reason);
  console.error("\nYour .env.local has SUPABASE_URL + SUPABASE_SERVICE_KEY (REST API keys).");
  console.error("Creating tables requires a Postgres connection string OR manual SQL.\n");
  console.error("── Option A: Supabase SQL Editor (fastest, no .env changes) ──");
  console.error("1. Open https://supabase.com/dashboard");
  if (ref) {
    console.error(`2. Open project: ${ref}`);
  }
  console.error("3. Go to SQL Editor → New query");
  console.error(`4. Paste the full contents of:\n   ${sqlPath}`);
  console.error("5. Click Run\n");
  console.error("── Option B: Enable npm setup (one-time) ──");
  console.error("1. Supabase Dashboard → Project Settings → Database");
  console.error("2. Copy the URI under Connection string (Session pooler recommended)");
  console.error("3. Add to .env.local (percent-encode special chars in the password):");
  console.error('   SUPABASE_DB_URL="postgresql://postgres.[ref]:[password]@...:5432/postgres"');
  console.error("4. Re-run: npm run setup:student-content-usage\n");
  console.error("── Verify after either option ──");
  console.error("   npm run setup:student-content-usage:verify\n");
}

async function verifyTableExists() {
  const url = getSupabaseRestUrl();
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local");
    process.exit(1);
  }

  const { createClient } = require("@supabase/supabase-js");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("student_content_usage").select("id").limit(1);

  if (!error) {
    console.log("OK — public.student_content_usage exists and is reachable.");
    return true;
  }

  const msg = String(error.message ?? "").toLowerCase();
  if (
    msg.includes("schema cache") ||
    msg.includes("could not find the table") ||
    error.code === "PGRST205"
  ) {
    console.error("NOT FOUND — student_content_usage table is missing.");
    console.error("Run the SQL migration (see setup:student-content-usage output for steps).");
    return false;
  }

  console.error("Verify failed:", error.message);
  return false;
}

async function runPgMigration() {
  const connectionString = buildPgConnectionString();
  if (!connectionString) {
    printManualInstructions("no SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in .env.local");
    process.exit(1);
  }

  let pg;
  try {
    pg = require("pg");
  } catch {
    printManualInstructions("pg package not installed (run: npm install pg --save-dev)");
    process.exit(1);
  }

  const sql = fs.readFileSync(getSqlPath(), "utf8");
  const client = new pg.Client({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query(sql);
    console.log("student_content_usage table ready.");
  } finally {
    await client.end();
  }
}

async function main() {
  const mode = process.argv[2] ?? "migrate";

  if (mode === "verify") {
    const ok = await verifyTableExists();
    process.exit(ok ? 0 : 1);
  }

  // Skip pg if table already exists
  const url = getSupabaseRestUrl();
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (url && key) {
    const { createClient } = require("@supabase/supabase-js");
    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { error } = await supabase.from("student_content_usage").select("id").limit(1);
    if (!error) {
      console.log("student_content_usage already exists — nothing to do.");
      return;
    }
  }

  await runPgMigration();

  const ok = await verifyTableExists();
  if (!ok) {
    process.exit(1);
  }
}

main().catch((err) => {
  const msg = err.message || String(err);
  if (/password authentication failed|ENOTFOUND|ECONNREFUSED|timeout/i.test(msg)) {
    printManualInstructions(msg);
  } else {
    console.error(msg);
  }
  process.exit(1);
});
