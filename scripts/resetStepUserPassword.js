require("dotenv").config({ path: ".env.local", quiet: true });
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");

const email = process.argv[2] || "step.student.jun2026@speakify.test";
const newPassword = process.argv[3] || "StepTest@2026";

const url = (process.env.SUPABASE_URL || "")
  .replace(/\/rest\/v1\/?$/i, "")
  .replace(/\/$/, "");

(async () => {
  const supabase = createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
  const hash = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase
    .from("users")
    .update({
      password: hash,
      must_change_password: false,
      is_active: true,
      step_enrolled: true,
      enrolled_programs: ["step"],
      program_type: "ielts",
    })
    .eq("email", email);

  if (error) {
    console.error("Update failed:", error.message);
    process.exit(1);
  }

  console.log(`Password reset for ${email}`);
  console.log(`  New password: ${newPassword}`);
  console.log(`  must_change_password: false`);
})();
