/**
 * Banked listening content: separate pools for section practice vs full mock.
 */

import { normalizeSectionQuestions } from "./listeningSectionNormalize.js";
import { prepareTranscriptForListening } from "./listeningSpeakerAlignment.js";
import { sectionHasPlaceholderQuestions, hydrateListeningQuestionsFromPayload } from "./listeningQuestionContent.js";
import {
  logListeningValidationFailure,
  validateListeningSectionPayload,
} from "./listeningUserFacingValidation.js";
import {
  applySpeakerIdentitiesToPayload,
  assertSpeakerIdentitiesValid,
} from "./listeningSpeakerIdentity.js";

export const CONTENT_TYPE_SECTION_PRACTICE = "section_practice";
export const CONTENT_TYPE_FULL_MOCK = "full_mock";

/** Agent batch defaults — override via env (no cap on user attempts). */
export const PRACTICE_SETS_PER_SECTION = Number(
  process.env.LISTENING_PRACTICE_SETS_PER_SECTION ?? 5
);
export const FULL_MOCK_TESTS_PER_DAY = Number(
  process.env.LISTENING_FULL_MOCK_TESTS_PER_DAY ?? 3
);
export const SECTIONS_COUNT = 4;

/** A full mock test must have rows for sections 1, 2, 3, and 4 — not just four rows. */
export function mockTestHasAllSections(sectionRows) {
  if (!Array.isArray(sectionRows) || sectionRows.length < SECTIONS_COUNT) {
    return false;
  }
  return [1, 2, 3, 4].every((s) =>
    sectionRows.some((r) => Number(r.section_number) === s)
  );
}

export const POOL_EXHAUSTED_MESSAGE =
  "No banked tests available right now. Generating a new test for you…";

export const BANK_SETUP_HINT =
  "Listening content tables are not set up yet. Ask your administrator to run supabase/listening_content_setup.sql in the Supabase SQL editor, then run npm run agent:listening.";

/** @param {{ message?: string; code?: string } | null | undefined} error */
export function isMissingSchemaError(error) {
  if (!error) return false;
  const msg = String(error.message ?? "").toLowerCase();
  const code = String(error.code ?? "");
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    msg.includes("could not find the table") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}

/** @param {{ message?: string; code?: string } | null | undefined} error */
function isMissingColumnError(error) {
  if (!error) return false;
  const msg = String(error.message ?? "").toLowerCase();
  return (
    msg.includes("column") &&
    (msg.includes("content_type") ||
      msg.includes("generation_date") ||
      msg.includes("schema cache"))
  );
}

function getTodayBoundsIso() {
  const dateKey = getTodayDateKey();
  return {
    start: `${dateKey}T00:00:00.000Z`,
    end: `${dateKey}T23:59:59.999Z`,
  };
}

export function getTodayDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function buildTestId(contentType, testNumber) {
  return `${contentType}:${testNumber}`;
}

export function parseQuestionsJson(questionsField) {
  const raw = questionsField ?? {};
  if (Array.isArray(raw)) {
    return { items: raw };
  }
  return {
    title: raw.title ?? "",
    topic: raw.topic ?? "",
    section: raw.section,
    speakers: raw.speakers ?? [],
    questionType: raw.questionType ?? "",
    wordLimit: raw.wordLimit ?? "",
    answerKey: raw.answer_key ?? raw.answerKey ?? null,
    items: Array.isArray(raw.items) ? raw.items : [],
  };
}

export function rowToSectionPayload(row) {
  const meta = parseQuestionsJson(row.questions);
  const sectionNumber = Number(row.section_number);
  const hydrated = hydrateListeningQuestionsFromPayload(
    meta.items,
    meta.answerKey
  );
  const normalizedQuestions = normalizeSectionQuestions(
    hydrated,
    sectionNumber
  );
  const rawSpeakers = Array.isArray(meta.speakers) ? meta.speakers : [];
  const testId = buildTestId(row.content_type, row.test_number);

  let payload = applySpeakerIdentitiesToPayload(
    {
      bankRowId: row.id,
      testNumber: row.test_number,
      testId,
      contentType: row.content_type,
      title: meta.title || `Section ${sectionNumber}`,
      section: sectionNumber,
      topic: meta.topic ?? "",
      transcript: String(row.transcript ?? ""),
      speakers: rawSpeakers,
      questionType: meta.questionType,
      wordLimit: meta.wordLimit,
      questions: normalizedQuestions,
    },
    {
      testSeed: `bank-row-${row.id}`,
      source: "bank_load",
    }
  );

  try {
    assertSpeakerIdentitiesValid(payload, sectionNumber);
  } catch (err) {
    logListeningValidationFailure({
      contentType: row.content_type,
      testNumber: row.test_number,
      sectionNumber,
      field: "speaker_identity",
      source: "bank_load",
      errors: [err instanceof Error ? err.message : String(err)],
    });
  }

  payload.transcript = prepareTranscriptForListening(
    payload.transcript,
    sectionNumber,
    payload.speakers
  );

  const validation = validateListeningSectionPayload(payload, sectionNumber, {
    logOnFailure: true,
    contentType: row.content_type,
    testNumber: row.test_number,
    source: "bank_load",
  });
  if (!validation.valid) {
    logListeningValidationFailure({
      contentType: row.content_type,
      testNumber: row.test_number,
      sectionNumber,
      field: "bank_row",
      source: "bank_load",
      errors: validation.errors,
    });
    return null;
  }

  return payload;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} studentId
 * @param {'section_practice'|'full_mock'} contentType
 * @param {number} [sectionNumber]
 */
export async function getSeenTestIds(
  supabase,
  studentId,
  contentType,
  sectionNumber = null
) {
  let query = supabase
    .from("student_mock_history")
    .select("test_id")
    .eq("student_id", studentId)
    .eq("content_type", contentType);

  if (contentType === CONTENT_TYPE_SECTION_PRACTICE && sectionNumber != null) {
    query = query.eq("section_number", sectionNumber);
  }
  if (contentType === CONTENT_TYPE_FULL_MOCK) {
    query = query.eq("section_number", 0);
  }

  const { data, error } = await query;
  if (error) {
    if (isMissingSchemaError(error)) {
      console.warn(
        "[listeningContentPool] student_mock_history missing — treating as no prior history"
      );
      return new Set();
    }
    throw new Error(`Failed to load student history: ${error.message}`);
  }

  return new Set((data ?? []).map((r) => String(r.test_id)));
}

/**
 * Load all bank rows for a content type (newest dates first). Falls back to today-only legacy query.
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {'section_practice'|'full_mock'} contentType
 * @param {string} [preferDate] — optional date to sort first
 */
export async function fetchBankRows(
  supabase,
  contentType,
  preferDate = null
) {
  const { data, error } = await supabase
    .from("generated_listening_tests")
    .select("*")
    .eq("content_type", contentType)
    .order("generation_date", { ascending: false })
    .order("test_number", { ascending: true })
    .order("section_number", { ascending: true });

  if (!error) {
    const rows = data ?? [];
    if (!preferDate || rows.length === 0) return rows;
    const preferred = rows.filter((r) => r.generation_date === preferDate);
    const rest = rows.filter((r) => r.generation_date !== preferDate);
    return [...preferred, ...rest];
  }

  if (isMissingSchemaError(error)) {
    throw new Error(BANK_SETUP_HINT);
  }

  if (preferDate) {
    return fetchBankRowsForToday(supabase, preferDate, contentType);
  }

  throw new Error(`Failed to load content bank: ${error.message}`);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} generationDate
 * @param {'section_practice'|'full_mock'} contentType
 */
export async function fetchBankRowsForToday(
  supabase,
  generationDate,
  contentType
) {
  const { data, error } = await supabase
    .from("generated_listening_tests")
    .select("*")
    .eq("generation_date", generationDate)
    .eq("content_type", contentType)
    .order("test_number", { ascending: true })
    .order("section_number", { ascending: true });

  if (!error) {
    return data ?? [];
  }

  if (isMissingSchemaError(error)) {
    throw new Error(BANK_SETUP_HINT);
  }

  if (isMissingColumnError(error)) {
    const { start, end } = getTodayBoundsIso();
    const { data: legacyRows, error: legacyError } = await supabase
      .from("generated_listening_tests")
      .select("*")
      .gte("created_at", start)
      .lte("created_at", end)
      .order("test_number", { ascending: true })
      .order("section_number", { ascending: true });

    if (legacyError) {
      if (isMissingSchemaError(legacyError)) {
        throw new Error(BANK_SETUP_HINT);
      }
      throw new Error(`Failed to load content bank: ${legacyError.message}`);
    }

    return (legacyRows ?? []).filter((row) => {
      const rowType = row.content_type ?? CONTENT_TYPE_FULL_MOCK;
      return rowType === contentType;
    });
  }

  throw new Error(`Failed to load content bank: ${error.message}`);
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} studentId
 * @param {number} sectionNumber
 */
export async function pickSectionPracticeContent(
  supabase,
  studentId,
  sectionNumber
) {
  const generationDate = getTodayDateKey();
  const seen = await getSeenTestIds(
    supabase,
    studentId,
    CONTENT_TYPE_SECTION_PRACTICE,
    sectionNumber
  );

  const rows = await fetchBankRows(
    supabase,
    CONTENT_TYPE_SECTION_PRACTICE,
    generationDate
  );

  const forSection = rows.filter(
    (r) => Number(r.section_number) === sectionNumber
  );

  let candidates = forSection.filter(
    (r) =>
      !seen.has(buildTestId(CONTENT_TYPE_SECTION_PRACTICE, r.test_number))
  );

  if (candidates.length === 0 && forSection.length > 0) {
    candidates = forSection;
  }

  if (candidates.length === 0) {
    return null;
  }

  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  for (const pick of shuffled) {
    const payload = rowToSectionPayload(pick);
    if (!payload || sectionHasPlaceholderQuestions(payload.questions)) continue;
    return {
      ...payload,
      testId: buildTestId(CONTENT_TYPE_SECTION_PRACTICE, pick.test_number),
    };
  }

  return null;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {string} studentId
 */
export async function pickFullMockTest(supabase, studentId) {
  const generationDate = getTodayDateKey();
  const seen = await getSeenTestIds(
    supabase,
    studentId,
    CONTENT_TYPE_FULL_MOCK
  );

  const rows = await fetchBankRows(
    supabase,
    CONTENT_TYPE_FULL_MOCK,
    generationDate
  );

  const byTest = new Map();
  for (const row of rows) {
    const tn = Number(row.test_number);
    if (!byTest.has(tn)) byTest.set(tn, []);
    byTest.get(tn).push(row);
  }

  const completeTestNumbers = [...byTest.entries()]
    .filter(([, sectionRows]) => mockTestHasAllSections(sectionRows))
    .map(([tn]) => tn)
    .sort((a, b) => a - b);

  const unseenTests = completeTestNumbers.filter(
    (tn) => !seen.has(buildTestId(CONTENT_TYPE_FULL_MOCK, tn))
  );
  const testOrder =
    unseenTests.length > 0 ? unseenTests : completeTestNumbers;

  for (const testNumber of testOrder) {
    const testId = buildTestId(CONTENT_TYPE_FULL_MOCK, testNumber);

    const sectionRows = byTest.get(testNumber);
    const sections = {};
    for (let s = 1; s <= SECTIONS_COUNT; s += 1) {
      const row = sectionRows.find((r) => Number(r.section_number) === s);
      if (!row) break;
      const payload = rowToSectionPayload(row);
      if (!payload) break;
      sections[s] = payload;
    }

    if (Object.keys(sections).length === SECTIONS_COUNT) {
      return {
        testNumber,
        testId,
        contentType: CONTENT_TYPE_FULL_MOCK,
        generationDate,
        sections,
      };
    }
  }

  return null;
}

/**
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase
 * @param {object} params
 */
export async function recordContentHistory(supabase, params) {
  const {
    studentId,
    contentType,
    testId,
    sectionNumber = null,
    bankRowId = null,
  } = params;

  const resolvedSection =
    contentType === CONTENT_TYPE_FULL_MOCK ? 0 : sectionNumber;

  const { error } = await supabase.from("student_mock_history").upsert(
    {
      student_id: studentId,
      content_type: contentType,
      test_id: testId,
      section_number: resolvedSection,
      bank_row_id: bankRowId,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "student_id,content_type,test_id,section_number" }
  );

  if (error) {
    if (isMissingSchemaError(error)) {
      console.warn(
        "[listeningContentPool] student_mock_history missing — skip recording history"
      );
      return;
    }
    console.warn("[listeningContentPool] record history:", error.message);
  }
}
