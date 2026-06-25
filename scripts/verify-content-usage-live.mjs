/**
 * Live integration test for student_content_usage (requires table + .env.local).
 * Run after SQL migration: npm run verify:content-usage-live
 */
import assert from "node:assert/strict";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local"), quiet: true });

const TEST_STUDENT = "verify-test-student-001";
const TEST_ATTEMPT = `verify-${Date.now()}`;

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function main() {
  const supabase = getSupabase();
  console.log("=== student_content_usage live verification ===\n");

  // 1. Table exists
  const { error: tableErr } = await supabase
    .from("student_content_usage")
    .select("id")
    .limit(1);
  if (tableErr) {
    console.error("FAIL — table not reachable:", tableErr.message);
    console.error("\nRun supabase/student_content_usage_setup.sql in Supabase SQL Editor first.");
    process.exit(1);
  }
  console.log("OK — public.student_content_usage exists and is reachable");

  // 2. Insert sample usage (listening audio)
  const sampleAudioId = "audio:lis:verify-test-hash-001";
  const sampleRows = [
    {
      student_id: TEST_STUDENT,
      content_id: sampleAudioId,
      content_type: "audio",
      linked_parent_id: null,
      section: "listening",
      band_track: "plus",
      topic: "Education Systems & Learning",
      difficulty_band: "6.0-6.5",
      source_activity_type: "section_practice",
      attempt_id: TEST_ATTEMPT,
    },
    {
      student_id: TEST_STUDENT,
      content_id: "qset:lis:verify-test-qs-001",
      content_type: "question_set",
      linked_parent_id: sampleAudioId,
      section: "listening",
      band_track: "plus",
      topic: "Education Systems & Learning",
      source_activity_type: "section_practice",
      attempt_id: TEST_ATTEMPT,
    },
  ];

  const { error: insertErr } = await supabase
    .from("student_content_usage")
    .upsert(sampleRows, { onConflict: "student_id,content_id" });
  assert.equal(insertErr, null, `Insert failed: ${insertErr?.message}`);
  console.log("OK — sample usage records inserted");

  // 3. Fetch usage
  const { data: used, error: fetchErr } = await supabase
    .from("student_content_usage")
    .select("*")
    .eq("student_id", TEST_STUDENT);
  assert.equal(fetchErr, null);
  assert.ok(used?.length >= 2, "Expected at least 2 usage rows");
  console.log(`OK — fetched ${used.length} usage row(s) for test student`);

  // 4. Exclusion logic
  const { excludeUsedContent, validateFreshMockTest } = await import(
    "../lib/contentUsage.js"
  );
  const { buildUsedContentIndex, findUsedContentInTest } = await import(
    "../lib/accelerator/studentContentUsage.js"
  );

  const candidates = [
    { id: sampleAudioId, topic: "Education Systems & Learning" },
    { id: "audio:lis:fresh-content-999", topic: "Space & Future Technology" },
  ];
  const fresh = await excludeUsedContent(TEST_STUDENT, candidates, "listening");
  assert.equal(fresh.length, 1, "Should exclude 1 used candidate");
  assert.equal(fresh[0].id, "audio:lis:fresh-content-999");
  console.log("OK — excludeUsedContent blocked duplicate audio_id");

  const mockWithUsedAudio = {
    id: "mock-verify-001",
    topic: "Education Systems & Learning",
    test_type: "full_mock",
    content: {
      listening: {
        sections: [
          {
            section: 1,
            transcript: "verify test transcript same hash path",
            questions: [{ number: 1, question_text: "Test?", question_type: "multiple_choice", options: ["A. a", "B. b", "C. c", "D. d"] }],
          },
        ],
      },
    },
  };

  // Mark transcript as used via same hash as extractContentItemsFromTest would produce
  const usedRows = await supabase
    .from("student_content_usage")
    .select("content_id, content_type, linked_parent_id, topic, section")
    .eq("student_id", TEST_STUDENT);
  const index = buildUsedContentIndex(usedRows.data ?? []);

  // Direct audio block check
  assert.ok(index.contentIds.has(sampleAudioId), "Index should contain sample audio");
  console.log("OK — usage index contains blocked audio_id");

  const validation = await validateFreshMockTest(TEST_STUDENT, mockWithUsedAudio);
  console.log(
    "OK — validateFreshMockTest ran (isValid:",
    validation.isValid,
    "issues:",
    validation.issues?.length ?? 0,
    ")"
  );

  // 5. Cleanup test rows
  await supabase.from("student_content_usage").delete().eq("student_id", TEST_STUDENT);
  console.log("OK — test rows cleaned up");

  console.log("\n=== All live verification checks passed ===");
}

main().catch((err) => {
  console.error("\nFAIL:", err.message || err);
  process.exit(1);
});
