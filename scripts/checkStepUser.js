require("dotenv").config({ path: ".env.local", quiet: true });
const { createClient } = require("@supabase/supabase-js");
const bcrypt = require("bcryptjs");

const email = process.argv[2] || "step.student.jun2026@speakify.test";
const testPass = process.argv[3] || "StepTest@2026";

const url = (process.env.SUPABASE_URL || "")
  .replace(/\/rest\/v1\/?$/i, "")
  .replace(/\/$/, "");

(async () => {
  const supabase = createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, email, password, role, is_active, must_change_password, step_enrolled, enrolled_programs, program_type"
    )
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("DB error:", error.message);
    process.exit(1);
  }
  if (!data) {
    console.log("USER_NOT_FOUND for", email);
    process.exit(0);
  }

  const hash = data.password || "";
  const isBcrypt = hash.startsWith("$2a$") || hash.startsWith("$2b$");
  const bcryptMatch = isBcrypt ? await bcrypt.compare(testPass, hash) : false;
  const plainMatch = hash === testPass;

  console.log(
    JSON.stringify(
      {
        found: true,
        id: data.id,
        role: data.role,
        is_active: data.is_active,
        must_change_password: data.must_change_password,
        step_enrolled: data.step_enrolled,
        enrolled_programs: data.enrolled_programs,
        program_type: data.program_type,
        passwordIsBcrypt: isBcrypt,
        bcryptMatch,
        plainMatch,
        supabaseUrl: url.slice(0, 40) + "...",
      },
      null,
      2
    )
  );
})();
