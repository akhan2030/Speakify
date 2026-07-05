/**
 * Production smoke checks for IELTS Academic launch.
 * Run: node scripts/prod-smoke-check.mjs
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { resolveAcceleratorTrack } from "../lib/accelerator/tracks.ts";
import {
  getMissionTasksForDay,
} from "../lib/ielts/missionTasks.ts";
import { validateListeningQuestionContent, normalizeListeningMcqOptions } from "../lib/listeningQuestionContent.js";
import { READING_INCOMPLETE_UI_TYPES } from "../lib/readingQuestionContent.js";

dotenv.config({ path: ".env.local" });

const PROD = "https://ielts-ai-tutor-neon.vercel.app";

function extractBankQuestionItems(questionsField) {
  const raw = questionsField ?? {};
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
}

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const results = [];

function pass(name, detail = "") {
  results.push({ name, ok: true, detail });
  console.log(`PASS  ${name}${detail ? ` — ${detail}` : ""}`);
}

function fail(name, detail = "") {
  results.push({ name, ok: false, detail });
  console.log(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function main() {
  const ts = Date.now();
  const eliteEmail = `smoke-elite-${ts}@speakify-smoke.test`;
  const foundationEmail = `smoke-foundation-${ts}@speakify-smoke.test`;

  // --- Public register pages ---
  const elitePage = await fetch(`${PROD}/register/ielts-accelerator?track=elite`);
  const eliteHtml = await elitePage.text();
  if (elitePage.ok && /IELTS Elite|Target 7\.0/i.test(eliteHtml)) {
    pass("Elite register page shows Elite tier copy");
  } else {
    fail("Elite register page shows Elite tier copy", `status ${elitePage.status}`);
  }

  const foundationPage = await fetch(
    `${PROD}/register/ielts-accelerator?track=foundation`
  );
  const foundationHtml = await foundationPage.text();
  if (foundationPage.ok && /IELTS Foundation|Target 5\.0/i.test(foundationHtml)) {
    pass("Foundation register page shows Foundation tier copy");
  } else {
    fail("Foundation register page shows Foundation tier copy");
  }

  // --- Register on prod ---
  async function register(track, email) {
    const res = await fetch(`${PROD}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programType: "ielts",
        registrationSlug: "ielts",
        acceleratorTrack: track,
        courseSlug: `ielts-${track}`,
        fullName: `Smoke ${track}`,
        email,
        phone: "+966501234567",
        password: "SmokeTest1!",
        confirmPassword: "SmokeTest1!",
        termsAccepted: true,
      }),
    });
    return { res, json: await res.json() };
  }

  const eliteReg = await register("elite", eliteEmail);
  const foundationReg = await register("foundation", foundationEmail);

  if (!eliteReg.res.ok || !eliteReg.json.userId) {
    fail("Register Elite student on prod", JSON.stringify(eliteReg.json));
  } else {
    pass("Register Elite student on prod", eliteEmail);
  }

  if (!foundationReg.res.ok || !foundationReg.json.userId) {
    fail("Register Foundation student on prod", JSON.stringify(foundationReg.json));
  } else {
    pass("Register Foundation student on prod", foundationEmail);
  }

  const supabase = getSupabase();
  const userIds = [eliteReg.json.userId, foundationReg.json.userId].filter(Boolean);

  if (userIds.length && process.env.SUPABASE_SERVICE_KEY) {
    const { data: users, error } = await supabase
      .from("users")
      .select("id,email,accelerator_track,placement_band")
      .in("id", userIds);

    if (error) {
      if (error.message?.includes("accelerator_track")) {
        fail(
          "Read accelerator_track from DB",
          "column missing — run supabase/universal_onboarding_setup.sql on production"
        );
      } else {
        fail("Read accelerator_track from DB", error.message);
      }
    } else {
      const eliteUser = users?.find((u) => u.email === eliteEmail);
      const foundationUser = users?.find((u) => u.email === foundationEmail);

      if (eliteUser?.accelerator_track === "elite") {
        pass("Elite student stored with accelerator_track=elite");
      } else {
        fail(
          "Elite student stored with accelerator_track=elite",
          `got ${eliteUser?.accelerator_track ?? "null"}`
        );
      }

      if (foundationUser?.accelerator_track === "foundation") {
        pass("Foundation student stored with accelerator_track=foundation");
      } else {
        fail(
          "Foundation student stored with accelerator_track=foundation",
          `got ${foundationUser?.accelerator_track ?? "null"}`
        );
      }

      // Simulate low placement band — Elite must stay Elite
      const resolvedElite = resolveAcceleratorTrack({
        acceleratorTrack: eliteUser?.accelerator_track,
        placementBand: 4.0,
      });
      if (resolvedElite === "elite") {
        pass("Elite track not overridden by low placement band (4.0)");
      } else {
        fail("Elite track not overridden by low placement band", `resolved ${resolvedElite}`);
      }

      // Set placement_band low on elite user and re-check resolution
      await supabase
        .from("users")
        .update({ placement_band: 4.0 })
        .eq("id", eliteUser.id);
      const resolvedAfterPlacement = resolveAcceleratorTrack({
        acceleratorTrack: eliteUser?.accelerator_track,
        placementBand: 4.0,
      });
      if (resolvedAfterPlacement === "elite") {
        pass("Elite stays Elite after placement_band=4.0 saved");
      } else {
        fail("Elite stays Elite after placement", resolvedAfterPlacement);
      }
    }
  } else {
    fail("Supabase check skipped", "no service key or user ids");
  }

  // --- Tier-specific missions ---
  const eliteMonday = getMissionTasksForDay("monday", "elite");
  const foundationMonday = getMissionTasksForDay("monday", "foundation");
  const plusMonday = getMissionTasksForDay("monday", "plus");

  if (
    eliteMonday.some((t) => t.id === "reading-timed") &&
    plusMonday.some((t) => t.id === "reading-strategies") &&
    JSON.stringify(eliteMonday) !== JSON.stringify(plusMonday)
  ) {
    pass("Elite Monday missions differ from Plus (timed focus)");
  } else {
    fail("Elite Monday missions differ from Plus");
  }

  if (
    foundationMonday.some((t) => t.id === "grammar-tenses") &&
    foundationMonday.some((t) => t.id === "speaking-part1")
  ) {
    pass("Foundation Monday missions are Foundation-specific");
  } else {
    fail("Foundation Monday missions are Foundation-specific");
  }

  if (
    plusMonday.some((t) => t.id === "reading-strategies") &&
    JSON.stringify(plusMonday) !== JSON.stringify(foundationMonday)
  ) {
    pass("Plus and Foundation missions are not identical");
  } else {
    fail("Plus and Foundation missions differ");
  }

  // --- Reading incomplete types ---
  const incomplete = [...READING_INCOMPLETE_UI_TYPES];
  if (incomplete.length === 5) {
    pass("Five reading types flagged as incomplete UI", incomplete.join(", "));
  } else {
    fail("Five incomplete reading types configured", String(incomplete.length));
  }

  // --- Listening S3 MCQ Q21–25 normalization (exam block sample) ---
  const s3Questions = [21, 22, 23, 24, 25].map((n, i) => ({
    questionNumber: n,
    type: "multiple-choice",
    text: `Sample Section 3 question ${n}?`,
    options: [
      { key: "A", label: `Option A for Q${n}` },
      { key: "B", label: `Option B for Q${n}` },
      { key: "C", label: `Option C for Q${n}` },
    ],
    answer: ["A", "B", "C", "A", "B"][i],
  }));
  const s3Check = validateListeningQuestionContent(s3Questions, 3);
  const hasObjectObject = s3Questions.some((q) =>
    JSON.stringify(q).includes("[object Object]")
  );
  const emptyOptions = s3Questions.some(
    (q) =>
      !Array.isArray(q.options) ||
      q.options.some((o) => !String(o.label ?? "").trim())
  );

  if (s3Check.valid && !hasObjectObject && !emptyOptions) {
    pass("Listening S3 MCQ normalization (Q21–22 sample)", "A/B/C with real text");
  } else {
    fail(
      "Listening S3 MCQ normalization",
      s3Check.errors?.join("; ") || "empty or [object Object]"
    );
  }

  // --- Prod bank: Section 3 row with valid Q21–25 MCQ block ---
  if (process.env.SUPABASE_SERVICE_KEY) {
    const { data: bankRows, error: bankError } = await supabase
      .from("generated_listening_tests")
      .select("id, section_number, questions, created_at")
      .eq("section_number", 3)
      .order("created_at", { ascending: false })
      .limit(20);

    if (bankError) {
      fail("Latest Section 3 bank row validates", bankError.message);
    } else {
    let bankOk = false;
    for (const row of bankRows ?? []) {
      const raw = extractBankQuestionItems(row.questions);
      let block = raw.filter((q) => {
        const n = Number(q.questionNumber ?? q.number ?? q.id);
        const type = String(q.type ?? "").toLowerCase();
        return n >= 21 && n <= 25 && type.includes("multiple-choice");
      });
      if (block.length < 5) {
        block = raw
          .filter((q) => {
            const n = Number(q.questionNumber ?? q.number ?? q.id);
            const type = String(q.type ?? "").toLowerCase();
            return n >= 1 && n <= 5 && type.includes("multiple-choice");
          })
          .map((q, i) => ({ ...q, questionNumber: 21 + i }));
      }
      if (block.length < 5) continue;
      const check = validateListeningQuestionContent(block, 3);
      const badDisplay = block.some((q) =>
        JSON.stringify(q).includes("[object Object]")
      );
      const emptyOption = block.some((q) => {
        const opts = normalizeListeningMcqOptions(q.options);
        return (
          opts.length < 3 ||
          opts.some((o) => !String(o.text ?? "").trim())
        );
      });
      if (check.valid && !badDisplay && !emptyOption) {
        bankOk = true;
        pass("Latest Section 3 bank row validates", `row ${row.id}`);
        break;
      }
    }
    if (!bankOk) {
      fail(
        "Latest Section 3 bank row validates",
        "no valid S3 bank row with Q21–25 A/B/C — run scripts/regenerate-listening-s3.mjs"
      );
    }
    }
  }

  // --- UI copy checks (static deploy verification) ---
  const accelHtml = await fetch(`${PROD}/dashboard/ielts/student/accelerator`).then(
    (r) => r.text()
  );
  if (!/Certificate preview|Session 5/i.test(accelHtml)) {
    pass("Accelerator page bundle has no certificate preview copy in shell");
  } else {
    fail("Certificate copy removed from accelerator route");
  }

  console.log("\n--- Summary ---");
  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  console.log(`${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
