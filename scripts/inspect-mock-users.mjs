import path from "path";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), quiet: true });

const ref = (process.env.SUPABASE_URL || "")
  .replace(/\/rest\/v1\/?$/i, "")
  .replace(/\/$/, "")
  .match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
const password = process.env.SUPABASE_DB_PASSWORD;
const client = new pg.Client({
  connectionString: `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const users = await client.query(`
  SELECT id, email, payment_status, purchase_intent, enrolled_programs, program_selected, created_at
  FROM users
  WHERE purchase_intent = 'mock_only'
     OR email ILIKE '%mock%'
     OR email ILIKE '%founding%'
  ORDER BY created_at DESC NULLS LAST
  LIMIT 40
`);
console.log("=== mock_only / mock-ish users ===");
console.log(JSON.stringify(users.rows, null, 2));

await client.end();
