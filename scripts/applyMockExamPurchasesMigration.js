/**
 * Adds mock_exam_purchases + related payment/user columns.
 * Requires SUPABASE_DB_URL, DATABASE_URL, or SUPABASE_DB_PASSWORD in .env.local
 *
 * Run: node scripts/applyMockExamPurchasesMigration.js
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

  // Direct connection — preferred (pooler often ENOTFOUND on this project)
  if (ref && enc) {
    candidates.push(`postgresql://postgres:${enc}@db.${ref}.supabase.co:5432/postgres`);
  }

  // Session pooler fallback
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
    console.error(
      "Set SUPABASE_DB_URL or SUPABASE_DB_PASSWORD in .env.local, then re-run."
    );
    console.error(
      "Alternatively, paste supabase/mock_exam_purchases_setup.sql into the Supabase SQL Editor."
    );
    process.exit(1);
  }

  const sql = fs.readFileSync(
    path.join(__dirname, "..", "supabase", "mock_exam_purchases_setup.sql"),
    "utf8"
  );

  const checks = [
    {
      label: "mock_exam_purchases table",
      query: `SELECT 1 FROM information_schema.tables
              WHERE table_schema = 'public' AND table_name = 'mock_exam_purchases'`,
    },
    {
      label: "users.purchase_intent column",
      query: `SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'purchase_intent'`,
    },
    {
      label: "payment_transactions.product_type column",
      query: `SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'payment_transactions'
                AND column_name = 'product_type'`,
    },
    {
      label: "payment_transactions.mock_numbers column",
      query: `SELECT 1 FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'payment_transactions'
                AND column_name = 'mock_numbers'`,
    },
  ];

  const { Client } = require("pg");
  let lastError = null;

  for (const connectionString of candidates) {
    const label = connectionString.includes("@db.")
      ? "direct"
      : connectionString.includes("pooler")
        ? "pooler"
        : "configured URL";
    const client = new Client({ connectionString });

    try {
      console.log(`Connecting via ${label}…`);
      await client.connect();
      await client.query(sql);

      for (const check of checks) {
        const { rows } = await client.query(check.query);
        if (rows.length) {
          console.log(`OK  ${check.label}`);
        } else {
          console.error(`FAIL  ${check.label}`);
          process.exit(1);
        }
      }

      await client.end();
      console.log(`OK  Migration applied via ${label}`);
      return;
    } catch (err) {
      lastError = err;
      console.warn(`${label} failed:`, err.message || err);
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }

  console.error(
    lastError?.message ||
      "All connection attempts failed. Paste supabase/mock_exam_purchases_setup.sql into Supabase SQL Editor."
  );
  process.exit(1);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
