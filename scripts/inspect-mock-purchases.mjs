/**
 * Inspect recent mock_exam_purchases + related user access fields.
 */
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: path.join(process.cwd(), ".env.local"), quiet: true });

function connectionString() {
  const explicit = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  if (explicit) return explicit;
  const ref = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "")
    .match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!ref || !password) {
    throw new Error("Need SUPABASE_DB_URL or SUPABASE_DB_PASSWORD + SUPABASE_URL");
  }
  return `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
}

const client = new pg.Client({
  connectionString: connectionString(),
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const purchases = await client.query(`
  SELECT
    p.student_id,
    u.email,
    u.role,
    u.payment_status,
    u.purchase_intent,
    u.enrolled_programs,
    u.program_selected,
    p.mock_number,
    p.product_type,
    p.moyasar_payment_id,
    p.purchased_at
  FROM mock_exam_purchases p
  LEFT JOIN users u ON u.id = p.student_id
  ORDER BY p.purchased_at DESC NULLS LAST
  LIMIT 50
`);

console.log("=== mock_exam_purchases (latest) ===");
console.log(JSON.stringify(purchases.rows, null, 2));

const byStudent = new Map();
for (const row of purchases.rows) {
  const key = row.student_id;
  if (!byStudent.has(key)) {
    byStudent.set(key, {
      email: row.email,
      payment_status: row.payment_status,
      purchase_intent: row.purchase_intent,
      enrolled_programs: row.enrolled_programs,
      program_selected: row.program_selected,
      role: row.role,
      mocks: [],
      product_types: new Set(),
    });
  }
  const entry = byStudent.get(key);
  entry.mocks.push(row.mock_number);
  entry.product_types.add(row.product_type);
}

console.log("\n=== per-student summary ===");
for (const [id, s] of byStudent) {
  console.log(
    JSON.stringify(
      {
        student_id: id,
        email: s.email,
        role: s.role,
        payment_status: s.payment_status,
        purchase_intent: s.purchase_intent,
        enrolled_programs: s.enrolled_programs,
        program_selected: s.program_selected,
        product_types: [...s.product_types],
        mock_numbers: s.mocks.sort((a, b) => a - b),
        mock_count: s.mocks.length,
      },
      null,
      2
    )
  );
}

const tx = await client.query(`
  SELECT student_id, product_type, mock_numbers, status, amount_halalas, moyasar_payment_id, created_at
  FROM payment_transactions
  WHERE product_type LIKE 'mock_%'
  ORDER BY created_at DESC NULLS LAST
  LIMIT 20
`);
console.log("\n=== payment_transactions (mock_*) ===");
console.log(JSON.stringify(tx.rows, null, 2));

await client.end();
