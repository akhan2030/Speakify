/**
 * Creates accelerator_mock_tests, accelerator_test_history, accelerator_practice_attempts.
 * Requires SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in .env.local
 *
 * Run: node scripts/setupAcceleratorContent.js
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
      "Set SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in .env.local, or paste supabase/accelerator_content_setup.sql into the Supabase SQL Editor."
    );
    process.exit(1);
  }

  const pg = require("pg");
  const sqlPath = path.join(__dirname, "..", "supabase", "accelerator_content_setup.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Accelerator content tables ready.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
