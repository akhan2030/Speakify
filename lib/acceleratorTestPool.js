/**
 * Serve fresh IELTS Accelerator tests — excludes tests the student has already seen
 * AND granular content (audio, passages, question sets) via student_content_usage.
 */

import { createClient } from "@supabase/supabase-js";
import {
  excludeUsedTests,
  getUsedContentForStudent,
  markTestContentAsUsed,
  validateFreshMockTest,
} from "./contentUsage.js";
import { buildUsedContentIndex, excludeUsedContentFromTests } from "./accelerator/studentContentUsage.js";

function getSupabaseAdmin() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY required");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const VISIBLE_STATUSES = ["published"];

function logDuplicateAssignment(studentId, test, validation) {
  console.warn("[contentUsage] Blocked duplicate content assignment", {
    studentId,
    testId: test?.id,
    issues: validation?.issues ?? validation?.duplicates?.length,
  });
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
export async function getSeenTestIds(supabase, studentId, track) {
  const { data, error } = await supabase
    .from("accelerator_test_history")
    .select("test_id")
    .eq("student_id", studentId)
    .eq("track", track);

  if (error) {
    console.warn("[acceleratorTestPool] seen tests lookup:", error.message);
    return [];
  }

  return (data ?? []).map((row) => row.test_id).filter(Boolean);
}

function applyNotSeenFilter(query, seenIds) {
  if (!seenIds.length) return query;
  return query.not("id", "in", `(${seenIds.join(",")})`);
}

function extractOptsForQuery(testType, section) {
  if (testType === "section_practice" && section) {
    return { section, sourceActivityType: "section_practice" };
  }
  if (testType === "full_mock") {
    return { sourceActivityType: "full_mock" };
  }
  return {};
}

/**
 * Pick first test from candidates that has no used content for this student.
 */
async function pickFreshTest(supabase, studentId, candidates, extractOpts) {
  if (!candidates.length) return null;

  const usedRows = await getUsedContentForStudent(studentId);
  const index = buildUsedContentIndex(usedRows);
  const { fresh, excluded } = excludeUsedContentFromTests(
    candidates,
    index,
    extractOpts
  );

  for (const ex of excluded) {
    logDuplicateAssignment(studentId, ex.test, {
      duplicates: ex.duplicates,
    });
  }

  return fresh[0] ?? null;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 */
async function queryUnseenTest(supabase, { studentId, track, testType, section }) {
  const seenIds = await getSeenTestIds(supabase, studentId, track);
  const extractOpts = extractOptsForQuery(testType, section);

  let query = supabase
    .from("accelerator_mock_tests")
    .select("*")
    .eq("track", track)
    .eq("test_type", testType)
    .in("status", VISIBLE_STATUSES)
    .order("generated_at", { ascending: true })
    .limit(20);

  if (testType === "section_practice" && section) {
    query = query.eq("section", section);
  }

  query = applyNotSeenFilter(query, seenIds);

  const { data, error } = await query;
  if (error) {
    throw new Error(`Fresh test lookup failed: ${error.message}`);
  }

  const match = await pickFreshTest(
    supabase,
    studentId,
    data ?? [],
    extractOpts
  );

  if (match || testType !== "section_practice") {
    return match;
  }

  // Section practice can use an unseen full_mock (extract section from content)
  const seenIdsForFull = await getSeenTestIds(supabase, studentId, track);
  let fullQuery = supabase
    .from("accelerator_mock_tests")
    .select("*")
    .eq("track", track)
    .eq("test_type", "full_mock")
    .in("status", VISIBLE_STATUSES)
    .order("generated_at", { ascending: true })
    .limit(20);

  fullQuery = applyNotSeenFilter(fullQuery, seenIdsForFull);
  const { data: fullData, error: fullError } = await fullQuery;
  if (fullError) {
    throw new Error(`Fresh full mock lookup failed: ${fullError.message}`);
  }

  return pickFreshTest(
    supabase,
    studentId,
    fullData ?? [],
    extractOpts
  );
}

async function ensureTestIsFreshForStudent(supabase, studentId, test, extractOpts) {
  void supabase;
  const validation = await validateFreshMockTest(studentId, test, {
    section: extractOpts.section ?? null,
    sourceActivityType: extractOpts.sourceActivityType ?? null,
    bandTrack: extractOpts.bandTrack ?? test.track ?? null,
  });

  if (validation.isValid ?? validation.valid) {
    return { test, valid: true };
  }

  logDuplicateAssignment(studentId, test, validation);
  return { test: null, valid: false, duplicates: validation.issues };
}

/**
 * When all content is marked used, reuse a published test (history-only filter).
 */
async function queryPoolFallback(supabase, { studentId, track, testType, section }) {
  const seenIds = await getSeenTestIds(supabase, studentId, track);

  let query = supabase
    .from("accelerator_mock_tests")
    .select("*")
    .eq("track", track)
    .in("status", VISIBLE_STATUSES)
    .order("generated_at", { ascending: true })
    .limit(20);

  if (testType === "section_practice" && section) {
    query = query.or(`and(test_type.eq.section_practice,section.eq.${section}),test_type.eq.full_mock`);
  } else if (testType === "full_mock") {
    query = query.eq("test_type", "full_mock");
  }

  const { data, error } = await query;
  if (error) {
    console.warn("[acceleratorTestPool] pool fallback lookup:", error.message);
    return null;
  }

  const candidates = data ?? [];
  if (!candidates.length) return null;

  const unseen = candidates.filter((t) => !seenIds.includes(t.id));
  const pick = unseen[0] ?? candidates[0];

  console.warn("[acceleratorTestPool] Content pool exhausted — reusing published test", {
    studentId,
    track,
    section,
    testId: pick.id,
    unseenOnly: Boolean(unseen[0]),
  });

  return pick;
}

export async function getFreshAcceleratorTest({
  studentId,
  track,
  section,
  testType = "section_practice",
  generateIfNeeded = true,
  markOnAssign = false,
  sourceActivityType,
}) {
  const supabase = getSupabaseAdmin();
  const extractOpts = {
    ...extractOptsForQuery(testType, section),
    sourceActivityType:
      sourceActivityType ?? extractOptsForQuery(testType, section).sourceActivityType,
    bandTrack: track,
  };

  let freshTest = await queryUnseenTest(supabase, {
    studentId,
    track,
    testType,
    section,
  });

  if (freshTest) {
    const check = await ensureTestIsFreshForStudent(
      supabase,
      studentId,
      freshTest,
      extractOpts
    );
    if (!check.valid) {
      freshTest = null;
    }
  }

  if (!freshTest) {
    freshTest = await queryPoolFallback(supabase, {
      studentId,
      track,
      testType,
      section,
    });
  }

  if (!freshTest && generateIfNeeded && testType === "full_mock") {
    try {
      const { generateOnDemand } = await import("../agent/acceleratorAgentCore.js");
      const generated = await generateOnDemand(track, section, { studentId });
      if (generated) {
        if (markOnAssign) {
          await markTestContentAsUsed(studentId, generated, extractOpts);
        }
        return { test: generated, generated: true };
      }
    } catch (genErr) {
      console.error("[acceleratorTestPool] On-demand generation failed:", genErr);
    }
    return { test: null, generated: false, error: "generation_failed" };
  }

  if (!freshTest) {
    return { test: null, generated: false };
  }

  if (freshTest && markOnAssign) {
    await markTestContentAsUsed(studentId, freshTest, extractOpts);
  }

  return { test: freshTest, generated: false };
}

/**
 * Validate and optionally mark a specific test when assigned by ID.
 */
export async function assignAcceleratorTestToStudent({
  studentId,
  test,
  track,
  testType,
  section,
  markUsed = true,
  sourceActivityType,
}) {
  const supabase = getSupabaseAdmin();
  const extractOpts = {
    ...extractOptsForQuery(testType, section),
    sourceActivityType:
      sourceActivityType ??
      extractOptsForQuery(testType, section).sourceActivityType,
    bandTrack: track,
  };

  const check = await ensureTestIsFreshForStudent(
    supabase,
    studentId,
    test,
    extractOpts
  );

  if (!check.valid) {
    return {
      ok: false,
      error: "duplicate_content",
      duplicates: check.duplicates,
    };
  }

  if (markUsed) {
    await markTestContentAsUsed(studentId, test, extractOpts);
  }

  return { ok: true };
}

/**
 * Dashboard payload for practice hub.
 */
export async function getAcceleratorPracticeDashboard(studentId, track) {
  const supabase = getSupabaseAdmin();
  const seenIds = await getSeenTestIds(supabase, studentId, track);
  const usedRows = await getUsedContentForStudent(studentId);
  const usedIndex = buildUsedContentIndex(usedRows);

  const { data: tests, error: testsError } = await supabase
    .from("accelerator_mock_tests")
    .select("id, test_type, section, topic, status, generated_at, target_band, content")
    .eq("track", track)
    .in("status", VISIBLE_STATUSES)
    .order("generated_at", { ascending: false })
    .limit(100);

  if (testsError) {
    throw new Error(testsError.message);
  }

  const unseen = (tests ?? []).filter((t) => !seenIds.includes(t.id));

  const isContentFresh = (test, sectionFilter) => {
    const opts = sectionFilter
      ? { section: sectionFilter, sourceActivityType: "section_practice" }
      : { sourceActivityType: "full_mock" };
    const { fresh } = excludeUsedContentFromTests([test], usedIndex, opts);
    return fresh.length > 0;
  };

  const unseenFullMocks = unseen.filter(
    (t) => t.test_type === "full_mock" && isContentFresh(t)
  );
  const fullMockCandidate = unseenFullMocks[0] ?? null;

  const sections = ["listening", "reading", "writing", "speaking"];
  const sectionAvailability = {};
  for (const section of sections) {
    const freshSectionPractice = unseen.find(
      (t) =>
        t.test_type === "section_practice" &&
        t.section === section &&
        isContentFresh(t, section)
    );
    const freshFromFullMock = unseenFullMocks[0] ?? null;
    const fresh = freshSectionPractice ?? freshFromFullMock;
    sectionAvailability[section] = {
      hasFresh: Boolean(fresh),
      testId: fresh?.id ?? null,
      topic: fresh?.topic ?? null,
      fromFullMock: Boolean(!freshSectionPractice && freshFromFullMock),
    };
  }

  const { data: history } = await supabase
    .from("accelerator_test_history")
    .select("test_id, test_type, section, band_score, score, completed_at, feedback")
    .eq("student_id", studentId)
    .eq("track", track)
    .order("completed_at", { ascending: false })
    .limit(20);

  const { data: practiceAttempts } = await supabase
    .from("accelerator_practice_attempts")
    .select("section, accuracy, band_score, score, total_questions, completed_at, weak_areas")
    .eq("student_id", studentId)
    .order("completed_at", { ascending: false })
    .limit(40);

  const lastFullMock =
    (history ?? []).find((h) => h.test_type === "full_mock") ?? null;

  const lastBySection = {};
  for (const section of sections) {
    const attempt = (practiceAttempts ?? []).find((a) => a.section === section);
    lastBySection[section] = attempt
      ? {
          accuracy: attempt.accuracy,
          bandScore: attempt.band_score,
          score: attempt.score,
          totalQuestions: attempt.total_questions,
          completedAt: attempt.completed_at,
        }
      : null;
  }

  return {
    fullMock: {
      testId: fullMockCandidate?.id ?? null,
      topic: fullMockCandidate?.topic ?? null,
      hasFresh: Boolean(fullMockCandidate),
      previous: lastFullMock
        ? {
            bandScore: lastFullMock.band_score,
            score: lastFullMock.score,
            completedAt: lastFullMock.completed_at,
            feedback: lastFullMock.feedback,
          }
        : null,
    },
    sections: sectionAvailability,
    lastBySection,
    seenCount: seenIds.length,
    usedContentCount: usedRows.length,
    poolCount: tests?.length ?? 0,
  };
}

export async function getAcceleratorTestById(testId) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("accelerator_mock_tests")
    .select("*")
    .eq("id", testId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * Record completion — accelerator_test_history + accelerator_practice_attempts + content usage.
 */
export async function recordAcceleratorCompletion(entry) {
  const supabase = getSupabaseAdmin();

  await recordAcceleratorTestHistory(supabase, entry);

  if (entry.testId && entry.studentId) {
    const test = entry.test ?? (await getAcceleratorTestById(entry.testId));
    if (test) {
      await markTestContentAsUsed(entry.studentId, test, {
        section: entry.section ?? null,
        sourceActivityType: entry.testType ?? "section_practice",
        bandTrack: entry.track,
        attemptId: entry.attemptId ?? `${entry.testId}:complete:${Date.now()}`,
      });
    }
  }

  if (entry.testType === "section_practice" && entry.section) {
    const { error } = await supabase.from("accelerator_practice_attempts").insert({
      student_id: entry.studentId,
      test_id: entry.testId,
      section: entry.section,
      score: entry.score ?? null,
      total_questions: entry.totalQuestions ?? null,
      accuracy: entry.accuracy ?? null,
      time_spent_minutes: entry.timeSpentMinutes ?? null,
      weak_areas: entry.weakAreas ?? null,
      completed_at: entry.completedAt ?? new Date().toISOString(),
    });

    if (error) {
      console.warn("[acceleratorTestPool] practice attempt insert:", error.message);
    }
  }
}

export async function recordAcceleratorTestHistory(supabase, entry) {
  const { error } = await supabase.from("accelerator_test_history").upsert(
    {
      student_id: entry.studentId,
      test_id: entry.testId,
      test_type: entry.testType ?? null,
      section: entry.section ?? null,
      track: entry.track,
      score: entry.score ?? null,
      band_score: entry.bandScore ?? null,
      answers: entry.answers ?? null,
      feedback: entry.feedback ?? null,
      started_at: entry.startedAt ?? new Date().toISOString(),
      completed_at: entry.completedAt ?? new Date().toISOString(),
    },
    { onConflict: "student_id,test_id" }
  );

  if (error) {
    console.warn("[acceleratorTestPool] record history:", error.message);
  }
}

export { getSupabaseAdmin, markTestContentAsUsed };
