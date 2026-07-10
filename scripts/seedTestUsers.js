/**
 * Ensures local test accounts exist in public.users (bcrypt passwords).
 * Run: npm run seed:users
 */
require("dotenv").config({ path: ".env.local", quiet: true });

const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");

const BCRYPT_ROUNDS = 10;

// Local-dev convenience password for throwaway @test.com accounts. These are
// never created in production. Real demo/admin accounts read from env vars
// (see resolveDemoPassword) so no live password is ever hardcoded in the repo.
const LOCAL_TEST_PASSWORD = "123456";

/**
 * Resolve a demo/admin account password from an env var. Returns null when the
 * var is unset so the account is skipped instead of seeded with a known secret.
 */
function resolveDemoPassword(envKey) {
  const value = process.env[envKey];
  return value && value.trim() ? value.trim() : null;
}

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

const IELTS_DEMO_PROFILE = {
  program_type: "ielts",
  enrolled_programs: ["ielts"],
  step_enrolled: false,
  onboarding_completed: true,
  program_selected: "ielts",
  placement_test_completed: true,
};

const IELTS_GENERAL_DEMO_PROFILE = {
  program_type: "ielts_general",
  enrolled_programs: ["ielts_general"],
  step_enrolled: false,
  onboarding_completed: true,
  program_selected: "ielts_general",
  placement_test_completed: true,
};

// Demo/admin accounts (may exist in production) take their password from env
// vars. When the var is unset the account is skipped rather than seeded with a
// known password. Rotate live passwords with scripts/rotate-demo-passwords.mjs.
const TEST_USERS = [
  {
    email: "student@test.com",
    password: LOCAL_TEST_PASSWORD,
    role: "student",
    name: "Test Student",
    programType: "ielts",
    forcePassword: false,
  },
  {
    email: "ielts.academic@speakify.demo",
    password: "SpeakifyAcademic1!",
    role: "student",
    name: "IELTS Academic Demo",
    programType: "ielts",
    ieltsDemo: true,
    forcePassword: true,
  },
  {
    email: "ielts.general@speakify.demo",
    password: "SpeakifyGeneral1!",
    role: "student",
    name: "IELTS General Demo",
    programType: "ielts_general",
    ieltsGeneralDemo: true,
    forcePassword: true,
  },
  {
    email: "pathway@test.com",
    password: LOCAL_TEST_PASSWORD,
    role: "student",
    name: "Pathway Student",
    programType: "pathway",
    forcePassword: false,
  },
  {
    email: "teacher@test.com",
    password: LOCAL_TEST_PASSWORD,
    role: "teacher",
    name: "Test Teacher",
    forcePassword: false,
  },
  {
    email: "admin@speakify.com",
    password: resolveDemoPassword("DEMO_ADMIN_PASSWORD"),
    role: "teacher",
    name: "Speakify Admin",
    forcePassword: true,
  },
  {
    email: "student@speakify.com",
    password: resolveDemoPassword("DEMO_STUDENT_PASSWORD"),
    role: "student",
    name: "Speakify Student",
    programType: "ielts",
    ieltsDemo: true,
    forcePassword: true,
  },
  {
    email: "ismail.ammar.hamido@speakify.test",
    password: resolveDemoPassword("DEMO_STUDENT_PASSWORD"),
    role: "student",
    name: "Ismail Ammar Hamido",
    programType: "ielts",
    ieltsDemo: true,
    forcePassword: false,
  },
  {
    email: "abdurehman.khan@speakify.test",
    password: resolveDemoPassword("DEMO_STUDENT_PASSWORD"),
    role: "student",
    name: "Abdurehman Khan",
    programType: "ielts",
    ieltsDemo: true,
    forcePassword: true,
  },
  {
    email: "business@test.com",
    password: LOCAL_TEST_PASSWORD,
    role: "student",
    name: "Business English Student",
    programType: "business_english",
    forcePassword: false,
  },
  {
    email: "legal@test.com",
    password: LOCAL_TEST_PASSWORD,
    role: "student",
    name: "Legal English Student",
    programType: "legal_english",
    forcePassword: false,
  },
  {
    email: "kids@test.com",
    password: LOCAL_TEST_PASSWORD,
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

  const skipped = [];

  for (const user of TEST_USERS) {
    if (!user.password) {
      skipped.push(user.email);
      console.log(
        `Skipped ${user.email} — set its env var (DEMO_ADMIN_PASSWORD / DEMO_STUDENT_PASSWORD) to seed it.`
      );
      continue;
    }
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
      if (user.ieltsDemo) Object.assign(updates, IELTS_DEMO_PROFILE);
      if (user.ieltsGeneralDemo) Object.assign(updates, IELTS_GENERAL_DEMO_PROFILE);
      if (user.forcePassword || !isBcryptHash(existing.password)) {
        updates.password = passwordHash;
      }

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", existing.id);
      if (error) {
        console.error(`Update failed for ${user.email}:`, error.message);
        process.exit(1);
      }
      console.log(`Updated ${user.email} (${user.role})`);
      continue;
    }

    const { error: insertError } = await supabase.from("users").insert({
      id: randomUUID(),
      email: user.email,
      password: passwordHash,
      role: user.role,
      name: user.name,
      ...(user.programType ? { program_type: user.programType } : {}),
      ...(user.ieltsDemo ? IELTS_DEMO_PROFILE : {}),
      ...(user.ieltsGeneralDemo ? IELTS_GENERAL_DEMO_PROFILE : {}),
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
  console.log("\nLocal test logins (dev only — never seeded in production):");
  console.log(`  Login page: ${base}/login`);
  console.log("  student@test.com / 123456  -> IELTS student dashboard");
  console.log("  pathway@test.com / 123456  -> English Pathway student dashboard");
  console.log("  business@test.com / 123456 -> Business English dashboard");
  console.log("  legal@test.com / 123456    -> Legal English dashboard");
  console.log("  kids@test.com / 123456     -> Kids English dashboard");
  console.log("  teacher@test.com / 123456  -> teacher dashboard");
  console.log(
    "\nDemo/admin accounts use env-var passwords (DEMO_ADMIN_PASSWORD, DEMO_STUDENT_PASSWORD)."
  );
  console.log(
    "Rotate live passwords with: node scripts/rotate-demo-passwords.mjs"
  );
  if (skipped.length) {
    console.log(`\nSkipped (env var unset): ${skipped.join(", ")}`);
  }
  console.log(`\n  Placement test: ${base}/placement-test`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
