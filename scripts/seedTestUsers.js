/**
 * Ensures local test accounts exist in public.users (bcrypt passwords).
 * Run: npm run seed:users
 */
require("dotenv").config({ path: ".env.local", quiet: true });

const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");

const BCRYPT_ROUNDS = 10;

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

const TEST_USERS = [
  {
    email: "student@test.com",
    password: "123456",
    role: "student",
    name: "Test Student",
    programType: "ielts",
    forcePassword: false,
  },
  {
    email: "pathway@test.com",
    password: "123456",
    role: "student",
    name: "Pathway Student",
    programType: "pathway",
    forcePassword: false,
  },
  {
    email: "teacher@test.com",
    password: "123456",
    role: "teacher",
    name: "Test Teacher",
    forcePassword: false,
  },
  {
    email: "admin@speakify.com",
    password: "Speakify2026!",
    role: "teacher",
    name: "Speakify Admin",
    forcePassword: true,
  },
  {
    email: "student@speakify.com",
    password: "Speakify2026!",
    role: "student",
    name: "Speakify Student",
    forcePassword: true,
  },
  {
    email: "business@test.com",
    password: "123456",
    role: "student",
    name: "Business English Student",
    programType: "business_english",
    forcePassword: false,
  },
  {
    email: "legal@test.com",
    password: "123456",
    role: "student",
    name: "Legal English Student",
    programType: "legal_english",
    forcePassword: false,
  },
  {
    email: "kids@test.com",
    password: "123456",
    role: "student",
    name: "Kids English Student",
    programType: "kids_english",
    forcePassword: false,
  },
];

async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

function isBcryptHash(value) {
  return (
    typeof value === "string" &&
    (value.startsWith("$2a$") || value.startsWith("$2b$"))
  );
}

async function main() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const user of TEST_USERS) {
    const passwordHash = await hashPassword(user.password);

    const { data: existing, error: lookupError } = await supabase
      .from("users")
      .select("id, email, role, password, name")
      .eq("email", user.email)
      .maybeSingle();

    if (lookupError) {
      console.error(`Lookup failed for ${user.email}:`, lookupError.message);
      process.exit(1);
    }

    if (existing) {
      const updates = {};
      if (existing.role !== user.role) updates.role = user.role;
      if ((existing.name ?? "") !== user.name) updates.name = user.name;
      if (user.programType) updates.program_type = user.programType;
      if (user.forcePassword || !isBcryptHash(existing.password)) {
        updates.password = passwordHash;
      }

      if (Object.keys(updates).length) {
        const { error } = await supabase
          .from("users")
          .update(updates)
          .eq("id", existing.id);
        if (error) {
          console.error(`Update failed for ${user.email}:`, error.message);
          process.exit(1);
        }
        console.log(`Updated ${user.email} (${user.role})`);
      } else {
        console.log(`OK ${user.email} (${user.role})`);
      }
      continue;
    }

    const { error: insertError } = await supabase.from("users").insert({
      id: randomUUID(),
      email: user.email,
      password: passwordHash,
      role: user.role,
      name: user.name,
      ...(user.programType ? { program_type: user.programType } : {}),
    });

    if (insertError) {
      console.error(`Insert failed for ${user.email}:`, insertError.message);
      process.exit(1);
    }
    console.log(`Created ${user.email} (${user.role})`);
  }

  const base = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  console.log("\nTest logins (password shown once — change in production):");
  console.log(`  Login page: ${base}/login`);
  console.log("  student@test.com / 123456  -> IELTS student dashboard");
  console.log("  pathway@test.com / 123456  -> English Pathway student dashboard");
  console.log("  business@test.com / 123456 -> Business English dashboard");
  console.log("  legal@test.com / 123456    -> Legal English dashboard");
  console.log("  kids@test.com / 123456     -> Kids English dashboard");
  console.log("  teacher@test.com / 123456  -> teacher dashboard");
  console.log("  admin@speakify.com / Speakify2026!  -> teacher dashboard (demo admin)");
  console.log("  student@speakify.com / Speakify2026!  -> student dashboard (demo student, no placement lock)");
  console.log(`  Placement test: ${base}/placement-test`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
