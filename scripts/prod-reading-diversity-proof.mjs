/**
 * Prove reading topic diversity on production (10 consecutive generations).
 * Run: node scripts/prod-reading-diversity-proof.mjs
 */
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { createClient } from "@supabase/supabase-js";
import { deleteUsersByIds } from "./purge-test-users.mjs";
import {
  isNearDuplicateTopic,
  topicSimilarity,
} from "../lib/readingTopicDiversity.js";

const PROD = "https://ielts-ai-tutor-neon.vercel.app";
const PASSWORD = "SmokeTest1!";
const TYPES = [
  "matching-information",
  "classification",
  "matching-sentence-endings",
  "matching-features",
  "diagram-completion",
  "matching-information",
  "classification",
  "matching-sentence-endings",
  "matching-features",
  "diagram-completion",
];

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
  const email = `smoke-diversity-${ts}@speakify-smoke.test`;
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
      fullName: "Diversity Proof",
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

  console.log("=== Reading diversity proof (10 consecutive on production) ===\n");
  const results = [];

  for (let i = 0; i < TYPES.length; i += 1) {
    const type = TYPES[i];
    console.log(`#${i + 1} generating ${type}…`);
    const res = await prodFetch(
      jar,
      `/api/reading/get-passage?questionType=${encodeURIComponent(type)}&testType=practice&studentId=${encodeURIComponent(userId)}`
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.passage) {
      console.log(`  FAIL ${res.status}`, json.error || json);
      results.push({ n: i + 1, type, ok: false, error: json.error });
      continue;
    }
    const row = {
      n: i + 1,
      type,
      ok: true,
      title: json.passage.title,
      topic: json.passage.topic,
      generated: json.generated,
    };
    results.push(row);
    console.log(`  title: ${row.title}`);
    console.log(`  topic: ${row.topic}`);
  }

  console.log("\n=== All 10 ===");
  for (const r of results) {
    if (!r.ok) console.log(`${r.n}. FAIL ${r.type}: ${r.error}`);
    else console.log(`${r.n}. [${r.type}] ${r.title}  |  ${r.topic}`);
  }

  // Pairwise near-dupe check
  let dupes = 0;
  for (let i = 0; i < results.length; i += 1) {
    for (let j = i + 1; j < results.length; j += 1) {
      const a = results[i];
      const b = results[j];
      if (!a.ok || !b.ok) continue;
      if (
        isNearDuplicateTopic(a.title, [b.title], 0.55) ||
        isNearDuplicateTopic(a.topic, [b.topic], 0.55) ||
        topicSimilarity(a.title, b.title) >= 0.55
      ) {
        dupes += 1;
        console.log(
          `NEAR-DUPE #${a.n}↔#${b.n}: "${a.title}" ≈ "${b.title}"`
        );
      }
    }
  }

  await deleteUsersByIds(supabase, [userId]);
  console.log(`\ndeleted ${userId}`);
  console.log(
    `VERDICT: ${results.filter((r) => r.ok).length}/10 generated, ${dupes} near-duplicate pairs`
  );
  process.exit(results.every((r) => r.ok) && dupes === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
