/**
 * Creates dedicated IELTS Academic and IELTS General demo student accounts.
 * Run: node scripts/seedIeltsProgrammeDemoUsers.js
 */
require("dotenv").config({ path: ".env.local", quiet: true });

const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");
const bcrypt = require("bcryptjs");

const BCRYPT_ROUNDS = 10;
const COMPED_UNTIL = "2099-12-31T23:59:59.000Z";

const DEMO_USERS = [
  {
    email: "ielts.academic@speakify.demo",
    password: "SpeakifyAcademic1!",
    name: "IELTS Academic Demo",
    program_type: "ielts",
    program_selected: "ielts",
    enrolled_programs: ["ielts"],
    accelerator_track: "plus",
    checkout_track: "plus",
    dashboard: "/dashboard/ielts/student",
    label: "IELTS Academic Accelerator",
  },
  {
    email: "ielts.general@speakify.demo",
    password: "SpeakifyGeneral1!",
    name: "IELTS General Demo",
    program_type: "ielts_general",
    program_selected: "ielts_general",
    enrolled_programs: ["ielts_general"],
    accelerator_track: "plus",
    checkout_track: "plus",
    dashboard: "/dashboard/ielts-general/student",
    label: "IELTS General Accelerator",
  },
];

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
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

  for (const user of DEMO_USERS) {
    const passwordHash = await hashPassword(user.password);
    const verifiedAt = new Date().toISOString();
    const row = {
      name: user.name,
      role: "student",
      password: passwordHash,
      program_type: user.program_type,
      program_selected: user.program_selected,
      enrolled_programs: user.enrolled_programs,
      accelerator_track: user.accelerator_track,
      checkout_track: user.checkout_track,
      payment_status: "comped",
      payment_comped_until: COMPED_UNTIL,
      onboarding_completed: true,
      placement_test_completed: true,
      cefr_level: "B1.2",
      target_band: 6.5,
      is_active: true,
      email_verified_at: verifiedAt,
      phone_verified_at: verifiedAt,
    };

    const { data: existing } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", user.email)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase.from("users").update(row).eq("id", existing.id);
      if (error) {
        console.error(`Update failed for ${user.email}:`, error.message);
        process.exit(1);
      }
      console.log(`Updated ${user.email}`);
    } else {
      const { error } = await supabase.from("users").insert({
        id: randomUUID(),
        email: user.email,
        ...row,
      });
      if (error) {
        console.error(`Insert failed for ${user.email}:`, error.message);
        process.exit(1);
      }
      console.log(`Created ${user.email}`);
    }
  }

  const base = (process.env.NEXTAUTH_URL || "https://ielts-ai-tutor-neon.vercel.app").replace(
    /\/$/,
    ""
  );

  console.log("\n=== IELTS programme demo logins ===");
  console.log(`Login: ${base}/login\n`);
  for (const user of DEMO_USERS) {
    console.log(`${user.label}`);
    console.log(`  Email:    ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log(`  Dashboard: ${base}${user.dashboard}\n`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
