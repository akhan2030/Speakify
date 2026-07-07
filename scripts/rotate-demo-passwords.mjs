/**
 * Rotate passwords for demo/admin accounts that live in production.
 *
 * For each target account this generates a strong random password (unless one
 * is supplied), stores a bcrypt hash in public.users, and prints the new
 * credentials ONCE. Nothing is written to the repo — copy the output into your
 * password manager immediately.
 *
 * Usage:
 *   node scripts/rotate-demo-passwords.mjs                 # rotate admin@speakify.com
 *   node scripts/rotate-demo-passwords.mjs a@x.com b@y.com # rotate specific emails
 *   ROTATE_PASSWORD='MyChosenPass' node scripts/rotate-demo-passwords.mjs a@x.com
 *
 * Only accounts that already exist are updated (this never creates accounts).
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

dotenv.config({ path: ".env.local" });

const BCRYPT_ROUNDS = 10;
const DEFAULT_TARGETS = ["admin@speakify.com"];

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

/** Strong, human-typable password: 24 base64url chars (~143 bits). */
function generatePassword() {
  return randomBytes(18)
    .toString("base64")
    .replace(/\+/g, "A")
    .replace(/\//g, "z")
    .replace(/=/g, "9");
}

async function main() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local");
    process.exit(1);
  }

  const targets = process.argv.slice(2).length
    ? process.argv.slice(2)
    : DEFAULT_TARGETS;

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const rotated = [];

  for (const rawEmail of targets) {
    const email = rawEmail.trim().toLowerCase();

    const { data: existing, error: lookupError } = await supabase
      .from("users")
      .select("id, email, role")
      .eq("email", email)
      .maybeSingle();

    if (lookupError) {
      console.error(`Lookup failed for ${email}:`, lookupError.message);
      process.exit(1);
    }
    if (!existing) {
      console.warn(`Skipped ${email} — no such account in this project.`);
      continue;
    }

    const password = process.env.ROTATE_PASSWORD || generatePassword();
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const { error: updateError } = await supabase
      .from("users")
      .update({ password: passwordHash })
      .eq("id", existing.id);

    if (updateError) {
      console.error(`Update failed for ${email}:`, updateError.message);
      process.exit(1);
    }

    rotated.push({ email, role: existing.role, password });
  }

  if (!rotated.length) {
    console.log("No accounts rotated.");
    return;
  }

  console.log(`\nRotated ${rotated.length} account(s). Save these now — shown once:\n`);
  for (const r of rotated) {
    console.log(`  ${r.email}  (${r.role})`);
    console.log(`    password: ${r.password}\n`);
  }
  console.log(
    "These passwords are NOT stored in the repo. Put them in your password manager."
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
