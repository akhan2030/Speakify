/**
 * Applies users_role_setup.sql + seed_admin_user.sql to Postgres.
 * Requires SUPABASE_DB_URL, DATABASE_URL, or SUPABASE_DB_PASSWORD in .env.local
 *
 * Run: node scripts/applyUsersRoleSetup.js
 * Or paste both SQL files into the Supabase SQL Editor.
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
      "Alternatively, paste supabase/users_role_setup.sql and supabase/seed_admin_user.sql into the Supabase SQL Editor."
    );
    process.exit(1);
  }

  const { Client } = require("pg");
  const client = new Client({ connectionString });
  await client.connect();

  try {
    for (const file of ["users_role_setup.sql", "seed_admin_user.sql"]) {
      const sql = fs.readFileSync(path.join(__dirname, "..", "supabase", file), "utf8");
      await client.query(sql);
      console.log(`Applied supabase/${file}`);
    }

    const { rows } = await client.query(
      "SELECT email, role FROM public.users WHERE lower(email) = lower($1)",
      ["admin@speakify.com"]
    );
    console.log("Admin user:", rows[0] ?? "(not found)");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
