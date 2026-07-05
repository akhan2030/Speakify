/**
 * Adds users.accelerator_track on production Postgres.
 * Requires SUPABASE_DB_URL, DATABASE_URL, or SUPABASE_DB_PASSWORD in .env.local
 *
 * Run: node scripts/applyAcceleratorTrackMigration.js
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env.local"), quiet: true });

function getConnectionString() {
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

  return connectionString;
}

async function main() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    console.error(
      "Set SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in .env.local, then re-run."
    );
    console.error(
      "Alternatively, paste supabase/accelerator_track_setup.sql into the Supabase SQL Editor."
    );
    process.exit(1);
  }

  const sql = fs.readFileSync(
    path.join(__dirname, "..", "supabase", "accelerator_track_setup.sql"),
    "utf8"
  );

  const { Client } = require("pg");
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await client.query(sql);
    const { rows } = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'accelerator_track'`
    );
    if (rows.length) {
      console.log("OK  users.accelerator_track column exists on production");
    } else {
      console.error("FAIL  column not found after migration");
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
