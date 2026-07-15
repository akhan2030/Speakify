/**
 * Retry Listening Section 4 on production only.
 * Run: node scripts/prod-listening-s4-retry.mjs
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
  const email = `smoke-s4-${ts}@speakify-smoke.test`;
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
      fullName: "S4 Smoke",
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
  let result = null;
  for (let i = 1; i <= 4; i += 1) {
    console.log(`\nListening S4 attempt ${i}/4…`);
    const res = await prodFetch(
      jar,
      `/api/listening/generate?section=4&studentId=${encodeURIComponent(userId)}`
    );
    const text = await res.text();
    let json = {};
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text.slice(0, 300) };
    }
    if (!res.ok || !json.success) {
      console.log(`  FAIL status=${res.status} ${json.error || text.slice(0, 200)}`);
      continue;
    }

    const questions = json.questions || [];
    const correctAnswers = {};
    for (const q of questions) {
      const n = q.questionNumber ?? q.id;
      if (n != null) correctAnswers[String(n)] = q.answer ?? "";
    }
    const answers = { ...correctAnswers };
    const firstKey = Object.keys(answers)[0];
    // Answer first question correctly, leave rest correct too except intentionally miss Q32
    if (answers["32"]) answers["32"] = "WRONG";

    const sample = questions.find((q) => Number(q.questionNumber) === 31) || questions[0];

    const sub = await prodFetch(jar, "/api/listening/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: userId,
        testType: "section",
        sectionNumber: 4,
        questionType: "section-4",
        answers,
        correctAnswers,
        timeTakenSeconds: 90,
      }),
    });
    const subJson = await sub.json().catch(() => ({}));

    result = {
      topic: json.topic,
      questionCount: questions.length,
      q31: {
        text: sample?.text,
        type: sample?.type,
        studentAnswer: answers[String(sample?.questionNumber)],
        correctAnswer: correctAnswers[String(sample?.questionNumber)],
      },
      score: subJson.score,
      total: subJson.total,
      estimatedBand: subJson.estimatedBand ?? subJson.band,
      submitStatus: sub.status,
    };
    console.log(JSON.stringify(result, null, 2));
    ok = sub.ok && Number(subJson.total) > 0;
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
