/**
 * Reset placement / onboarding for a student so they can retake the level check.
 *
 * Usage:
 *   node scripts/resetStudentPlacement.js --email ismail.ammar.hamido@speakify.test
 */
require("dotenv").config({ path: ".env.local", quiet: true });

const { createClient } = require("@supabase/supabase-js");

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function readArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx >= process.argv.length - 1) return null;
  return process.argv[idx + 1];
}

async function resetStudentPlacement(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local");
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, name, email, onboarding_completed, placement_test_completed")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (userError) throw userError;
  if (!user) throw new Error(`No user found for ${normalizedEmail}`);

  const studentId = user.id;

  const { data: attempts } = await supabase
    .from("placement_attempts")
    .select("id")
    .eq("student_id", studentId);

  const attemptIds = (attempts ?? []).map((a) => a.id);

  if (attemptIds.length > 0) {
    const { error: answersError } = await supabase
      .from("placement_answers")
      .delete()
      .in("attempt_id", attemptIds);
    if (answersError) throw answersError;
  }

  const { error: attemptsError } = await supabase
    .from("placement_attempts")
    .delete()
    .eq("student_id", studentId);
  if (attemptsError) throw attemptsError;

  const resetFields = {
    onboarding_completed: false,
    placement_test_completed: false,
    placement_band: null,
    program_selected: null,
    accelerator_track: null,
  };

  let { error: updateError } = await supabase
    .from("users")
    .update(resetFields)
    .eq("id", studentId);

  if (updateError?.message?.includes("column")) {
    const minimal = { onboarding_completed: false };
    const retry = await supabase.from("users").update(minimal).eq("id", studentId);
    updateError = retry.error;
  }

  if (updateError) throw updateError;

  const base = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "");

  return {
    studentId,
    name: user.name,
    email: user.email,
    deletedAttempts: attemptIds.length,
    onboardingUrl: `${base}/onboarding`,
    placementUrl: `${base}/placement-test`,
    loginUrl: `${base}/login?callbackUrl=%2Fonboarding`,
  };
}

async function main() {
  const email = readArg("--email") || process.env.STUDENT_EMAIL;
  if (!email) {
    console.error("Usage: node scripts/resetStudentPlacement.js --email user@example.com");
    process.exit(1);
  }

  const result = await resetStudentPlacement(email);
  console.log(`Reset placement for ${result.name} (${result.email})`);
  console.log(`  User ID:           ${result.studentId}`);
  console.log(`  Attempts deleted:  ${result.deletedAttempts}`);
  console.log(`  Onboarding reset:  yes (will see gateway on next login)`);
  console.log("");
  console.log("Start fresh:");
  console.log(`  Login + onboarding: ${result.loginUrl}`);
  console.log(`  Full placement:     ${result.placementUrl}`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
