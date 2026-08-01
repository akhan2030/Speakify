/**
 * Applies founding_offer_claims + founding_testimonials migration.
 * Requires SUPABASE_DB_URL, DATABASE_URL, or SUPABASE_DB_PASSWORD in .env.local
 *
 * Run: node scripts/applyFoundingOfferMigration.js
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
  }
  if (ref && enc) {
    candidates.push(
      `postgresql://postgres.${ref}:${enc}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`
    );
  }

  return [...new Set(candidates)];
}

async function main() {
  const candidates = getConnectionCandidates();
  if (candidates.length === 0) {
    console.error("Set SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in .env.local");
    process.exit(1);
  }

  const sql = fs.readFileSync(
    path.join(__dirname, "..", "supabase", "founding_offer_claims_setup.sql"),
    "utf8"
  );

  const { default: pg } = await import("pg");

  let lastError = null;
  for (const connectionString of candidates) {
    const client = new pg.Client({
      connectionString,
      ssl: { rejectUnauthorized: false },
    });
    try {
      console.log("Connecting…", connectionString.replace(/:[^:@]+@/, ":****@"));
      await client.connect();
      await client.query(sql);
      const countRes = await client.query(
        `SELECT public.founding_active_claim_count() AS claimed`
      );
      const tables = await client.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name IN ('founding_offer_claims', 'founding_testimonials')
        ORDER BY table_name
      `);
      console.log("Migration applied.");
      console.log(
        "Tables:",
        tables.rows.map((r) => r.table_name).join(", ")
      );
      console.log("Active founding claims:", countRes.rows[0]?.claimed ?? 0);
      await client.end();
      return;
    } catch (err) {
      lastError = err;
      console.warn("Failed on candidate:", err.message);
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }

  console.error("All connection candidates failed.", lastError);
  process.exit(1);
}

main();
