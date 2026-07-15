/**
 * Production live smoke (self-study LMS /dashboard only):
 * register → unlock placement/gates → 5 new Reading types → Listening Section 4 → delete.
 *
 * Run: node scripts/prod-academic-live-smoke.mjs
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { createClient } from "@supabase/supabase-js";
import { deleteUsersByIds } from "./purge-test-users.mjs";

const PROD = "https://ielts-ai-tutor-neon.vercel.app";
const PASSWORD = "SmokeTest1!";
const READING_TYPES = [
  "matching-information",
  "classification",
  "matching-sentence-endings",
  "matching-features",
  "diagram-completion",
];

const COMPED_UNTIL = "2099-12-31T23:59:59.000Z";

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
  const single = response.headers.get("set-cookie");
  const all = chunks.length ? chunks : single ? [single] : [];
  for (const raw of all) {
    const first = String(raw).split(";")[0];
    const eq = first.indexOf("=");
    if (eq <= 0) continue;
    jar.set(first.slice(0, eq).trim(), first.slice(eq + 1).trim());
  }
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

async function prodFetch(jar, path, init = {}) {
  const headers = new Headers(init.headers || {});
  const cookie = cookieHeader(jar);
  if (cookie) headers.set("cookie", cookie);
  if (init.body && !headers.has("content-type") && typeof init.body === "string") {
    // leave as provided by caller
  }
  const res = await fetch(`${PROD}${path}`, { ...init, headers });
  mergeCookies(jar, res);
  return res;
}

async function login(jar, email, password) {
  const csrfRes = await prodFetch(jar, "/api/auth/csrf");
  const csrfJson = await csrfRes.json();
  const csrfToken = csrfJson.csrfToken;
  if (!csrfToken) throw new Error(`CSRF failed: ${JSON.stringify(csrfJson)}`);

  const body = new URLSearchParams({
    csrfToken,
    email,
    password,
    json: "true",
    redirect: "false",
    callbackUrl: `${PROD}/dashboard/ielts/student`,
  });

  const loginRes = await prodFetch(jar, "/api/auth/callback/credentials", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    redirect: "manual",
  });

  const text = await loginRes.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* redirect HTML / empty */
  }

  const me = await prodFetch(jar, "/api/auth/me");
  const meJson = await me.json().catch(() => ({}));
  if (!me.ok || !meJson?.id) {
    throw new Error(
      `Login failed status=${loginRes.status} body=${text.slice(0, 300)} me=${JSON.stringify(meJson)}`
    );
  }
  return { loginStatus: loginRes.status, loginBody: json, me: meJson };
}

function firstQuestionSample(passage) {
  const q = passage?.questions?.[0];
  if (!q) return null;
  return {
    id: q.id,
    kind: q.kind ?? q.type,
    prompt: String(q.text ?? q.question ?? q.prompt ?? "").replace(/\s+/g, " ").slice(0, 120),
    correct: q.correct ?? q.answer,
  };
}

function buildOneCorrectAnswer(passage, correctAnswers) {
  const answers = {};
  const keys = Object.keys(correctAnswers || {});
  if (keys.length === 0) {
    const q = passage?.questions?.[0];
    if (q?.id != null) answers[q.id] = q.correct ?? q.answer ?? "A";
    return answers;
  }
  const first = keys[0];
  answers[first] = correctAnswers[first];
  for (const k of keys.slice(1)) answers[k] = "__smoke_wrong__";
  return answers;
}

function alternativesById(passage) {
  const out = {};
  for (const q of passage?.questions ?? []) {
    if (Array.isArray(q.alternatives) && q.alternatives.length) {
      out[q.id] = q.alternatives;
    }
  }
  return out;
}

async function main() {
  if (!process.env.SUPABASE_SERVICE_KEY || !process.env.SUPABASE_URL) {
    console.error("Need SUPABASE_URL + SUPABASE_SERVICE_KEY in .env.local");
    process.exit(1);
  }

  const ts = Date.now();
  const email = `smoke-academic-${ts}@speakify-smoke.test`;
  const jar = new Map();
  const supabase = getSupabase();
  let userId = null;
  const report = {
    email,
    register: null,
    placement: null,
    reading: [],
    listeningSection4: null,
    deleted: false,
  };

  console.log("=== Production Academic live smoke ===");
  console.log(`Target: ${PROD}`);
  console.log(`Email:  ${email}\n`);

  try {
    // 1) Register on production
    const regRes = await fetch(`${PROD}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programType: "ielts",
        registrationSlug: "ielts",
        acceleratorTrack: "plus",
        courseSlug: "ielts-plus",
        fullName: "Academic Smoke Tester",
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
    const regJson = await regRes.json().catch(() => ({}));
    report.register = { status: regRes.status, userId: regJson.userId, error: regJson.error };
    if (!regRes.ok || !regJson.userId) {
      throw new Error(`Register failed: ${JSON.stringify(regJson)}`);
    }
    userId = regJson.userId;
    console.log(`REGISTER  ok userId=${userId}`);

    // 2) Unlock account + mark placement complete (service role — mirrors finished placement)
    const verifiedAt = new Date().toISOString();
    const { error: unlockErr } = await supabase
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
        payment_comped_until: COMPED_UNTIL,
        program_type: "ielts",
        program_selected: "ielts",
        enrolled_programs: ["ielts"],
        cefr_level: "B2.1",
        target_band: 6.5,
      })
      .eq("id", userId);
    if (unlockErr) throw new Error(`Unlock failed: ${unlockErr.message}`);

    const { data: placed } = await supabase
      .from("users")
      .select("id,email,placement_test_completed,placement_band,accelerator_track,payment_status")
      .eq("id", userId)
      .single();
    report.placement = placed;
    console.log(
      `PLACEMENT ok completed=${placed?.placement_test_completed} band=${placed?.placement_band} track=${placed?.accelerator_track} payment=${placed?.payment_status}`
    );

    // Insert a placement attempt row when the table exists (best-effort evidence)
    try {
      await supabase.from("placement_attempts").insert({
        student_id: userId,
        email,
        overall_band: 6.5,
        status: "completed",
        completed_at: verifiedAt,
        started_at: verifiedAt,
      });
    } catch {
      /* optional schema */
    }

    // 3) Login via NextAuth on production
    const auth = await login(jar, email, PASSWORD);
    console.log(`LOGIN     ok me.id=${auth.me.id} email=${auth.me.email}`);

    // Placement questions API (proves placement path is live)
    const pq = await prodFetch(jar, "/api/placement/questions");
    const pqJson = await pq.json().catch(() => ({}));
    console.log(
      `PLACEMENT API status=${pq.status} questions=${Array.isArray(pqJson?.questions) ? pqJson.questions.length : pqJson?.error ?? "n/a"}`
    );
    report.placement = {
      ...report.placement,
      questionsApiStatus: pq.status,
      questionsCount: Array.isArray(pqJson?.questions) ? pqJson.questions.length : null,
    };

    // 4) Five new Reading types — generate + submit one correct (+rest wrong)
    for (const type of READING_TYPES) {
      console.log(`\n--- Reading: ${type} ---`);
      let genRes = null;
      let genJson = {};
      let lastError = "";
      for (let attempt = 1; attempt <= 4; attempt += 1) {
        genRes = await prodFetch(
          jar,
          `/api/reading/get-passage?questionType=${encodeURIComponent(type)}&testType=practice&studentId=${encodeURIComponent(userId)}`
        );
        genJson = await genRes.json().catch(() => ({}));
        if (genRes.ok && genJson.passage) break;
        lastError = genJson.error || JSON.stringify(genJson).slice(0, 400);
        console.log(`  generate attempt ${attempt}/4 failed: ${lastError}`);
      }
      if (!genRes?.ok || !genJson.passage) {
        const row = {
          type,
          ok: false,
          status: genRes?.status,
          error: lastError,
        };
        report.reading.push(row);
        console.log(`FAIL generate ${type}: ${row.error}`);
        continue;
      }

      const passage = genJson.passage;
      const sample = firstQuestionSample(passage);
      const answers = buildOneCorrectAnswer(passage, genJson.correctAnswers);
      const firstId = Object.keys(answers)[0];
      const studentSample = answers[firstId];

      const submitRes = await prodFetch(jar, "/api/reading/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType: "practice",
          passageId: passage.passageId || passage.id || `${type}-${ts}`,
          questionType: type,
          answers,
          correctAnswers: genJson.correctAnswers,
          alternativesById: alternativesById(passage),
          timeTakenSeconds: 45,
        }),
      });
      const submitJson = await submitRes.json().catch(() => ({}));

      const row = {
        type,
        ok: genRes.ok && submitRes.ok,
        generateStatus: genRes.status,
        submitStatus: submitRes.status,
        title: passage.title ?? null,
        generated: Boolean(genJson.generated),
        bankId: genJson.bankId ?? null,
        questionCount: passage.questions?.length ?? 0,
        sampleQuestion: sample,
        studentAnswerOnFirst: studentSample,
        score: submitJson.score,
        total: submitJson.total,
        accuracy: submitJson.accuracy,
        estimatedBand: submitJson.estimatedBand,
        error: submitJson.error || null,
      };
      report.reading.push(row);
      console.log(
        `PASS title="${row.title}" Qs=${row.questionCount} sample="${sample?.prompt ?? ""}" => correct="${sample?.correct}" studentFirst="${studentSample}" score=${row.score}/${row.total} band=${row.estimatedBand} generated=${row.generated}`
      );
    }

    // 5) Listening Section 4 — generate + submit one answer key set
    console.log(`\n--- Listening Section 4 ---`);
    const listenRes = await prodFetch(
      jar,
      `/api/listening/generate?section=4&studentId=${encodeURIComponent(userId)}`
    );
    const listenJson = await listenRes.json().catch(() => ({}));

    if (!listenRes.ok || !listenJson.success) {
      report.listeningSection4 = {
        ok: false,
        status: listenRes.status,
        error: listenJson.error || JSON.stringify(listenJson).slice(0, 500),
      };
      console.log(`FAIL Listening S4 generate: ${report.listeningSection4.error}`);
    } else {
      const questions = listenJson.questions || [];
      const correctAnswers = {};
      for (const q of questions) {
        const n = q.questionNumber ?? q.id;
        if (n != null) correctAnswers[String(n)] = q.answer ?? q.correct_answer ?? "";
      }
      const answers = { ...correctAnswers };
      // deliberately miss one
      const keys = Object.keys(answers);
      if (keys[0]) answers[keys[0]] = "SMOKE_WRONG";

      const sampleQs = questions.slice(0, 3).map((q) => ({
        n: q.questionNumber,
        type: q.type,
        text: String(q.text ?? "").replace(/\s+/g, " ").slice(0, 80),
        answer: q.answer,
      }));

      const submitRes = await prodFetch(jar, "/api/listening/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: userId,
          testType: "section",
          sectionNumber: 4,
          questionType: "section-4",
          answers,
          correctAnswers,
          timeTakenSeconds: 120,
        }),
      });
      const submitJson = await submitRes.json().catch(() => ({}));

      report.listeningSection4 = {
        ok: listenRes.ok && submitRes.ok,
        status: listenRes.status,
        submitStatus: submitRes.status,
        topic: listenJson.topic ?? listenJson.questions?.[0]?.topic ?? null,
        fromBank: Boolean(listenJson.fromBank ?? listenJson.bankId),
        bankId: listenJson.bankId ?? null,
        questionCount: questions.length,
        sampleQuestions: sampleQs,
        score: submitJson.score,
        total: submitJson.total,
        estimatedBand: submitJson.estimatedBand ?? submitJson.band,
        error: submitJson.error || null,
      };
      console.log(
        `PASS S4 Qs=${questions.length} fromBank=${report.listeningSection4.fromBank} samples=${JSON.stringify(sampleQs)} score=${submitJson.score}/${submitJson.total}`
      );
    }
  } catch (err) {
    console.error("\nSMOKE ABORTED:", err instanceof Error ? err.message : err);
    report.abort = err instanceof Error ? err.message : String(err);
  } finally {
    if (userId) {
      const deleted = await deleteUsersByIds(supabase, [userId]);
      report.deleted = deleted > 0;
      console.log(`\nCLEANUP  deleted=${deleted} userId=${userId}`);
    }
  }

  console.log("\n=== RAW REPORT JSON ===");
  console.log(JSON.stringify(report, null, 2));

  const readingOk = report.reading.filter((r) => r.ok).length;
  const listeningOk = Boolean(report.listeningSection4?.ok);
  const allOk =
    Boolean(report.register?.userId) &&
    readingOk === READING_TYPES.length &&
    listeningOk &&
    report.deleted;

  console.log(
    `\n=== VERDICT === reading ${readingOk}/${READING_TYPES.length} · listening S4 ${listeningOk ? "OK" : "FAIL"} · deleted ${report.deleted}`
  );
  process.exit(allOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
