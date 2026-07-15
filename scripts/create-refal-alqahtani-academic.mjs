/**
 * Create Refal Alqahtani — IELTS Academic only.
 * Run: node scripts/create-refal-alqahtani-academic.mjs
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";

dotenv.config({ path: ".env.local" });

const BCRYPT_ROUNDS = 10;
const COMPED_UNTIL = "2099-12-31T23:59:59.000Z";

const ACCOUNT = {
  name: "Refal Alqahtani",
  email: "refal.alqahtani@speakify.demo",
  password: "SpeakifyRefal2026!",
  program_type: "ielts",
  program_selected: "ielts",
  enrolled_programs: ["ielts"],
  accelerator_track: "plus",
  checkout_track: "plus",
};

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

async function main() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const passwordHash = await bcrypt.hash(ACCOUNT.password, BCRYPT_ROUNDS);
  const verifiedAt = new Date().toISOString();

  const row = {
    name: ACCOUNT.name,
    role: "student",
    password: passwordHash,
    program_type: ACCOUNT.program_type,
    program_selected: ACCOUNT.program_selected,
    enrolled_programs: ACCOUNT.enrolled_programs,
    accelerator_track: ACCOUNT.accelerator_track,
    checkout_track: ACCOUNT.checkout_track,
    payment_status: "comped",
    payment_comped_until: COMPED_UNTIL,
    onboarding_completed: true,
    placement_test_completed: true,
    cefr_level: "B2.1",
    target_band: 7.0,
    is_active: true,
    must_change_password: false,
    email_verified_at: verifiedAt,
    phone_verified_at: verifiedAt,
    step_enrolled: false,
  };

  const { data: existing } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", ACCOUNT.email)
    .maybeSingle();

  let userId;
  if (existing) {
    const { error } = await supabase.from("users").update(row).eq("id", existing.id);
    if (error) {
      console.error(error.message);
      process.exit(1);
    }
    userId = existing.id;
    console.log(`Updated: ${ACCOUNT.email}`);
  } else {
    userId = randomUUID();
    const { error } = await supabase.from("users").insert({
      id: userId,
      email: ACCOUNT.email,
      ...row,
    });
    if (error) {
      console.error(error.message);
      process.exit(1);
    }
    await supabase.from("vocab_streaks").insert({
      student_id: userId,
      current_streak: 0,
      longest_streak: 0,
    });
    console.log(`Created: ${ACCOUNT.email}`);
  }

  const signInLink = `https://ielts-ai-tutor-neon.vercel.app/login?program=ielts&callbackUrl=${encodeURIComponent("/dashboard/ielts/student")}`;

  console.log("\n=== Refal Alqahtani — IELTS Academic ===");
  console.log(`Name:     ${ACCOUNT.name}`);
  console.log(`Email:    ${ACCOUNT.email}`);
  console.log(`Password: ${ACCOUNT.password}`);
  console.log(`User ID:  ${userId}`);
  console.log(`Programme: IELTS Academic only`);
  console.log(`Sign-in:  ${signInLink}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
