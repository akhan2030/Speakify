/**
 * Apply unique one-orientation index only.
 * Run: node scripts/apply-one-orientation-index.js
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

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
  const sql = fs.readFileSync(
    path.join(__dirname, "..", "supabase", "live_classes_one_orientation.sql"),
    "utf8"
  );
  const candidates = getConnectionCandidates();
  if (!candidates.length) {
    console.error("Need SUPABASE_DB_PASSWORD or SUPABASE_DB_URL");
    process.exit(1);
  }
  const { Client } = require("pg");
  let lastError = null;
  for (const connectionString of candidates) {
    const client = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    try {
      await client.connect();
      await client.query(sql);
      const check = await client.query(
        `SELECT indexname FROM pg_indexes
         WHERE tablename = 'live_class_bookings'
           AND indexname = 'live_class_one_active_orientation_per_student'`
      );
      await client.end();
      if (check.rowCount) {
        console.log("OK  live_class_one_active_orientation_per_student exists");
        return;
      }
      lastError = new Error("Index SQL ran but index was not found");
    } catch (err) {
      lastError = err;
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }
  console.error(lastError);
  process.exit(1);
}

main();
