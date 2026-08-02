/**
 * Applies supabase/mock_exam_purchases_programme.sql and prints proof.
 * Run: node scripts/apply-mock-purchases-programme.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), quiet: true });

function getSupabaseRef() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "")
    .match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
}

function getConnectionCandidates() {
  const ref = getSupabaseRef();
  const password = process.env.SUPABASE_DB_PASSWORD;
  const enc = password ? encodeURIComponent(password) : null;
  const candidates = [];
  const explicit = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (explicit) candidates.push(explicit);
  if (ref && enc) {
    candidates.push(`postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`);
    candidates.push(
      `postgresql://postgres.${ref}:${enc}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
    );
  }
  return [...new Set(candidates)];
}

async function main() {
  const candidates = getConnectionCandidates();
  if (!candidates.length) {
    console.error("Set SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in .env.local");
    process.exit(1);
  }

  const sql = fs.readFileSync(
    path.join(__dirname, "..", "supabase", "mock_exam_purchases_programme.sql"),
    "utf8"
  );

  let lastErr;
  for (const connectionString of candidates) {
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    try {
      await client.connect();
      console.log("Connected.");
      await client.query(sql);
      console.log("Migration applied.");

      const cols = await client.query(`
        SELECT column_name, data_type, column_default, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'mock_exam_purchases'
        ORDER BY ordinal_position
      `);
      console.log("\nColumns:");
      for (const row of cols.rows) {
        console.log(
          `  ${row.column_name} ${row.data_type} nullable=${row.is_nullable} default=${row.column_default}`
        );
      }

      const uniq = await client.query(`
        SELECT conname, pg_get_constraintdef(oid) AS def
        FROM pg_constraint
        WHERE conrelid = 'public.mock_exam_purchases'::regclass
          AND contype = 'u'
      `);
      console.log("\nUnique constraints:");
      for (const row of uniq.rows) {
        console.log(`  ${row.conname}: ${row.def}`);
      }

      const check = await client.query(`
        SELECT conname, pg_get_constraintdef(oid) AS def
        FROM pg_constraint
        WHERE conrelid = 'public.mock_exam_purchases'::regclass
          AND contype = 'c'
      `);
      console.log("\nCheck constraints:");
      for (const row of check.rows) {
        console.log(`  ${row.conname}: ${row.def}`);
      }

      const sample = await client.query(`
        SELECT programme, COUNT(*)::int AS rows
        FROM mock_exam_purchases
        GROUP BY programme
        ORDER BY programme
      `);
      console.log("\nRow counts by programme:");
      for (const row of sample.rows) {
        console.log(`  ${row.programme}: ${row.rows}`);
      }
      if (sample.rows.length === 0) {
        console.log("  (table empty)");
      }

      // Prove both programmes can own mock #1 for the same student conceptually
      // (constraint existence check only — no insert of fake users).
      const hasProgramme = cols.rows.some((r) => r.column_name === "programme");
      const hasNewUniq = uniq.rows.some(
        (r) => r.conname === "mock_exam_purchases_student_programme_mock_key"
      );
      console.log("\nallPassed:", hasProgramme && hasNewUniq);
      if (!hasProgramme || !hasNewUniq) process.exit(1);

      await client.end();
      return;
    } catch (err) {
      lastErr = err;
      try {
        await client.end();
      } catch {
        /* ignore */
      }
      console.warn("Candidate failed:", err.message);
    }
  }

  console.error("All connection candidates failed:", lastErr?.message);
  process.exit(1);
}

main();
