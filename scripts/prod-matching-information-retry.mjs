/**
 * Retry Matching Information only on production.
 * Run: node scripts/prod-matching-information-retry.mjs
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { createClient } from "@supabase/supabase-js";
import { deleteUsersByIds } from "./purge-test-users.mjs";

const PROD = "https://ielts-ai-tutor-neon.vercel.app";
const PASSWORD = "SmokeTest1!";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function mergeCookies(jar, response) {
  const chunks =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [];
  for (const raw of chunks) {
    const first = String(raw).split(";")[0];
    const eq = first.indexOf("=");
    if (eq > 0) jar.set(first.slice(0, eq).trim(), first.slice(eq + 1).trim());
  }
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function prodFetch(jar, path, init = {}) {
  const headers = new Headers(init.headers || {});
  const cookie = cookieHeader(jar);
  if (cookie) headers.set("cookie", cookie);
  const res = await fetch(`${PROD}${path}`, { ...init, headers });
  mergeCookies(jar, res);
  return res;
}

async function main() {
  const ts = Date.now();
  const email = `smoke-mi-${ts}@speakify-smoke.test`;
  const jar = new Map();
  const supabase = getSupabase();

  const regRes = await fetch(`${PROD}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      programType: "ielts",
      registrationSlug: "ielts",
      acceleratorTrack: "plus",
      courseSlug: "ielts-plus",
      fullName: "MI Smoke",
      email,
      phone: "+966501234567",
      password: PASSWORD,
      confirmPassword: PASSWORD,
      termsAccepted: true,
      englishLevel: "Intermediate",
      targetBand: "6.5",
      studyReason: "Personal Growth",
    }),
  });
  const regJson = await regRes.json();
  const userId = regJson.userId;
  if (!userId) throw new Error(JSON.stringify(regJson));
  console.log("register", userId);

  const verifiedAt = new Date().toISOString();
  await supabase
    .from("users")
    .update({
      is_active: true,
      must_change_password: false,
      email_verified_at: verifiedAt,
      phone_verified_at: verifiedAt,
      onboarding_completed: true,
      placement_test_completed: true,
      placement_band: 6.5,
      accelerator_track: "plus",
      checkout_track: "plus",
      payment_status: "comped",
      payment_comped_until: "2099-12-31T23:59:59.000Z",
      program_type: "ielts",
      program_selected: "ielts",
      enrolled_programs: ["ielts"],
    })
    .eq("id", userId);

  const csrf = await (await prodFetch(jar, "/api/auth/csrf")).json();
  await prodFetch(jar, "/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      csrfToken: csrf.csrfToken,
      email,
      password: PASSWORD,
      json: "true",
      redirect: "false",
      callbackUrl: `${PROD}/dashboard/ielts/student`,
    }),
    redirect: "manual",
  });

  let ok = false;
  for (let i = 1; i <= 6; i += 1) {
    const res = await prodFetch(
      jar,
      `/api/reading/get-passage?questionType=matching-information&testType=practice&studentId=${encodeURIComponent(userId)}`
    );
    const json = await res.json();
    if (!res.ok || !json.passage) {
      console.log(`attempt ${i}: FAIL ${json.error || res.status}`);
      continue;
    }
    const q = json.passage.questions?.[0];
    const correct = json.correctAnswers || {};
    const answers = {};
    const keys = Object.keys(correct);
    if (keys[0]) {
      answers[keys[0]] = correct[keys[0]];
      for (const k of keys.slice(1)) answers[k] = "X";
    }
    const sub = await prodFetch(jar, "/api/reading/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        testType: "practice",
        passageId: json.passage.passageId || json.passage.id || `mi-${ts}`,
        questionType: "matching-information",
        answers,
        correctAnswers: correct,
        timeTakenSeconds: 30,
      }),
    });
    const subJson = await sub.json();
    console.log(`attempt ${i}: PASS title="${json.passage.title}" Qs=${json.passage.questions?.length}`);
    console.log(`  sample: ${JSON.stringify(q)}`);
    console.log(
      `  submit ${sub.status} score=${subJson.score}/${subJson.total} band=${subJson.estimatedBand}`
    );
    ok = true;
    break;
  }

  await deleteUsersByIds(supabase, [userId]);
  console.log("deleted", userId);
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
