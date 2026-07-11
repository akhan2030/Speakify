/**
 * Apply Action 5 launch SQL + verify tables/columns.
 * Run: node scripts/apply-action5-migrations.mjs
 */
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config({ path: ".env.local" });

const SQL_PATH = path.join(process.cwd(), "supabase", "action5_launch_setup.sql");

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getConnectionString() {
  let connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (!connectionString && process.env.SUPABASE_DB_PASSWORD) {
    const ref = getSupabaseUrl().match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (ref) {
      const enc = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD);
      connectionString = `postgresql://postgres.${ref}:${enc}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;
    }
  }
  return connectionString || null;
}

async function columnExists(supabase, table, column) {
  const { error } = await supabase.from(table).select(column).limit(0);
  return !error;
}

async function tableExists(supabase, table) {
  const { error } = await supabase.from(table).select("*").limit(0);
  return !error;
}

async function verify(supabase) {
  const checks = [
    { label: "api_rate_limits table", ok: await tableExists(supabase, "api_rate_limits") },
    {
      label: "password_reset_tokens table",
      ok: await tableExists(supabase, "password_reset_tokens"),
    },
    {
      label: "ielts_general_attempts.ta_score",
      ok: await columnExists(supabase, "ielts_general_attempts", "ta_score"),
    },
    {
      label: "ielts_general_attempts.opening_correct",
      ok: await columnExists(supabase, "ielts_general_attempts", "opening_correct"),
    },
    {
      label: "speaking_sessions.speaking_time_seconds",
      ok: await columnExists(supabase, "speaking_sessions", "speaking_time_seconds"),
    },
  ];

  let allOk = true;
  for (const c of checks) {
    console.log(`${c.ok ? "PASS" : "FAIL"}  ${c.label}`);
    if (!c.ok) allOk = false;
  }
  return allOk;
}

async function applyViaPg() {
  const connectionString = getConnectionString();
  if (!connectionString) return false;

  const sql = fs.readFileSync(SQL_PATH, "utf8");
  const pg = await import("pg");
  const client = new pg.default.Client({ connectionString });
  await client.connect();
  try {
    await client.query(sql);
    console.log("OK  SQL applied via Postgres connection");
    return true;
  } finally {
    await client.end();
  }
}

async function main() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
  }

  console.log(`Supabase project: ${url}\n`);

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const before = await verify(supabase);
  if (before) {
    console.log("\nAll Action 5 migrations already present.");
    return;
  }

  console.log("\nApplying migrations…");
  const applied = await applyViaPg();
  if (!applied) {
    console.error(
      "\nCannot run DDL without SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in .env.local."
    );
    console.error("Paste this file in Supabase SQL Editor and run it:");
    console.error("  supabase/action5_launch_setup.sql");
    process.exit(1);
  }

  console.log("\nVerifying…\n");
  const after = await verify(supabase);
  if (!after) {
    console.error("\nSome checks still failing after migration.");
    process.exit(1);
  }
  console.log("\nSuccess — all Action 5 migrations verified.");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
