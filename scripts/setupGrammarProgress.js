/**
 * Recreates public.grammar_progress with the schema expected by the Grammar module.
 * Requires SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in .env.local
 *
 * Get the connection string from Supabase → Project Settings → Database → URI
 * (use the "Session pooler" or direct connection; percent-encode the password).
 *
 * Run: npm run setup:grammar
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env.local"), quiet: true });

async function main() {
  let connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

  if (!connectionString && process.env.SUPABASE_DB_PASSWORD) {
    const ref = (process.env.SUPABASE_URL || "")
      .replace(/\/rest\/v1\/?$/i, "")
      .replace(/\/$/, "")
      .match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (ref) {
      const enc = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD);
      connectionString = `postgresql://postgres.${ref}:${enc}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;
    }
  }

  if (!connectionString) {
    console.error(
      "Set SUPABASE_DB_URL (full postgres URI) or SUPABASE_DB_PASSWORD in .env.local, then re-run."
    );
    console.error("Alternatively, paste supabase/grammar_progress_setup.sql into the Supabase SQL Editor.");
    process.exit(1);
  }

  let pg;
  try {
    pg = require("pg");
  } catch {
    console.error("Install pg first: npm install pg --save-dev");
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, "..", "supabase", "grammar_progress_setup.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("grammar_progress table ready.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
