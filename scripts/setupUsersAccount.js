/**
 * Adds is_active + must_change_password columns to public.users.
 * Requires SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in .env.local
 *
 * Run: npm run setup:users
 * Or paste supabase/users_account_setup.sql into the Supabase SQL Editor.
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
      "Set SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in .env.local, then re-run."
    );
    console.error(
      "Alternatively, paste supabase/users_account_setup.sql into the Supabase SQL Editor."
    );
    process.exit(1);
  }

  let pg;
  try {
    pg = require("pg");
  } catch {
    console.error("Install pg: npm install pg");
    process.exit(1);
  }

  const sqlPath = path.join(__dirname, "..", "supabase", "users_account_setup.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query(sql);
    console.log("users_account_setup.sql applied successfully.");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
