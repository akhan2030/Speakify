/**
 * Create a student account (bcrypt password, welcome email).
 *
 * Usage:
 *   npm run create:student -- --name "Fatima E. Almethkal" --email fatima.emad.almethkal@gmail.com --password "Speakify@2026"
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

function getLoginUrl() {
  const base = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(
    /\/$/,
    ""
  );
  return `${base}/login`;
}

function readArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx >= process.argv.length - 1) return null;
  return process.argv[idx + 1];
}

async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

async function sendWelcomeEmail({ name, email, temporaryPassword, loginUrl }) {
  const text = [
    `Hello ${name},`,
    "",
    "Your Speakify LMS student account has been created.",
    "",
    `Username: ${email}`,
    `Temporary password: ${temporaryPassword}`,
    `Login URL: ${loginUrl}`,
    "",
    "You will be asked to set a new password when you sign in for the first time.",
    "",
    "— Speakify Global Language Center",
  ].join("\n");

  const resendKey = process.env.RESEND_API_KEY?.trim();
  const from =
    process.env.EMAIL_FROM?.trim() || "Speakify LMS <noreply@speakify.com>";

  if (resendKey) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "Welcome to Speakify LMS — Your account is ready",
        text,
      }),
    });
    if (!response.ok) {
      const body = await response.text();
      return { ok: false, mode: "resend", error: body || response.statusText };
    }
    return { ok: true, mode: "resend" };
  }

  console.log("[email] RESEND_API_KEY not set — welcome email content:");
  console.log(text);
  return { ok: true, mode: "console" };
}

async function insertUser(supabase, row) {
  const { data, error } = await supabase
    .from("users")
    .insert(row)
    .select("id")
    .single();

  if (!error) return { data, error: null };

  if (!error.message?.includes("column")) {
    return { data: null, error };
  }

  const minimal = {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role,
  };
  return supabase.from("users").insert(minimal).select("id").single();
}

async function createStudentAccount({ name, email, temporaryPassword, sendWelcomeEmailFlag }) {
  const normalizedEmail = email.trim().toLowerCase();
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    return { ok: false, status: 503, error: "Missing SUPABASE env vars." };
  }

  if (!name?.trim()) {
    return { ok: false, status: 400, error: "Student name is required." };
  }
  if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return { ok: false, status: 400, error: "A valid email is required." };
  }
  if (!temporaryPassword || temporaryPassword.length < 8) {
    return {
      ok: false,
      status: 400,
      error: "Temporary password must be at least 8 characters.",
    };
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      status: 409,
      error: "An account with this email already exists.",
    };
  }

  const passwordHash = await hashPassword(temporaryPassword);
  const userId = randomUUID();
  const trimmedName = name.trim();
  const loginUrl = getLoginUrl();

  const { data: newUser, error: userError } = await insertUser(supabase, {
    id: userId,
    name: trimmedName,
    email: normalizedEmail,
    password: passwordHash,
    role: "student",
    is_active: true,
    must_change_password: true,
  });

  if (userError) {
    if (userError.code === "23505" || userError.message?.includes("duplicate")) {
      return {
        ok: false,
        status: 409,
        error: "An account with this email already exists.",
      };
    }
    console.error("[createStudentAccount]", userError);
    return { ok: false, status: 500, error: "Could not create student account." };
  }

  const { error: streakError } = await supabase.from("vocab_streaks").insert({
    student_id: newUser.id,
    current_streak: 0,
    longest_streak: 0,
  });

  if (streakError) {
    await supabase.from("users").delete().eq("id", newUser.id);
    return { ok: false, status: 500, error: streakError.message };
  }

  let emailResult = { ok: false, mode: "skipped" };
  if (sendWelcomeEmailFlag) {
    emailResult = await sendWelcomeEmail({
      name: trimmedName,
      email: normalizedEmail,
      temporaryPassword,
      loginUrl,
    });
  }

  return {
    ok: true,
    userId: newUser.id,
    name: trimmedName,
    email: normalizedEmail,
    message: `Student account created successfully for ${trimmedName}.`,
    emailSent: emailResult.ok,
    emailMode: emailResult.mode,
  };
}

async function main() {
  const name = readArg("--name") || process.env.STUDENT_NAME || "";
  const email = readArg("--email") || process.env.STUDENT_EMAIL || "";
  const temporaryPassword =
    readArg("--password") || process.env.STUDENT_PASSWORD || "";
  const sendWelcomeEmailFlag = !process.argv.includes("--no-email");

  if (!name || !email || !temporaryPassword) {
    console.error(
      'Usage: npm run create:student -- --name "Full Name" --email user@example.com --password "TempPass123"'
    );
    process.exit(1);
  }

  const result = await createStudentAccount({
    name,
    email,
    temporaryPassword,
    sendWelcomeEmailFlag,
  });

  if (!result.ok) {
    console.error(`Failed (${result.status}): ${result.error}`);
    process.exit(1);
  }

  console.log(result.message);
  console.log(`  User ID: ${result.userId}`);
  console.log(`  Email:   ${result.email}`);
  console.log(`  Role:    student`);
  console.log(`  Active:  yes`);
  console.log(`  Must change password on first login: yes`);
  console.log(`  Login URL: ${getLoginUrl()}`);
  if (result.emailSent) {
    console.log(`  Welcome email: sent (${result.emailMode})`);
  } else {
    console.log("  Welcome email: not sent");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
