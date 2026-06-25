/** Session state stored inside exam_content when legacy columns are missing. */
export const SESSION_KEY = "_session";

export function formatSupabaseError(err, fallback = "Request failed") {
  if (!err) return fallback;
  if (err instanceof Error && err.message) return err.message;
  if (typeof err.message === "string" && err.message.trim()) return err.message;
  return fallback;
}

export function emptySessionState(overrides = {}) {
  return {
    currentSection: "listening",
    planId: null,
    generatedMockTestId: null,
    answers: {},
    flagged: [],
    sectionScores: {},
    transcripts: {},
    report: {},
    ...overrides,
  };
}

export function readSessionState(examContent) {
  const root = examContent && typeof examContent === "object" ? examContent : {};
  const nested = root[SESSION_KEY];
  if (nested && typeof nested === "object") {
    return {
      currentSection: nested.currentSection ?? "listening",
      planId: nested.planId ?? null,
      generatedMockTestId: nested.generatedMockTestId ?? null,
      answers: nested.answers ?? {},
      flagged: Array.isArray(nested.flagged) ? nested.flagged : [],
      sectionScores: nested.sectionScores ?? {},
      transcripts: nested.transcripts ?? {},
      report: nested.report ?? {},
    };
  }

  return emptySessionState({
    answers: root.answers ?? {},
    flagged: Array.isArray(root.flagged) ? root.flagged : [],
    sectionScores: root.sectionScores ?? root.section_scores ?? {},
    transcripts: root.transcripts ?? {},
    report: root.report ?? {},
    currentSection: root.currentSection ?? root.current_section ?? "listening",
    generatedMockTestId: root.generatedMockTestId ?? root.generated_mock_test_id ?? null,
  });
}

export function mergeSessionIntoExamContent(examContent, sessionPatch) {
  const root =
    examContent && typeof examContent === "object" && !Array.isArray(examContent)
      ? { ...examContent }
      : {};
  const current = readSessionState(root);
  root[SESSION_KEY] = {
    ...current,
    ...sessionPatch,
  };
  return root;
}

export function buildAttemptInsertRow({
  studentId,
  mockNumber,
  planId,
  generatedMockTestId,
  examContent = {},
}) {
  const contentRoot =
    examContent && typeof examContent === "object" && !Array.isArray(examContent)
      ? { ...examContent }
      : {};

  contentRoot[SESSION_KEY] = emptySessionState({
    planId,
    generatedMockTestId,
  });

  return {
    student_id: studentId,
    status: "in_progress",
    mock_number: mockNumber ?? contentRoot.mockNumber ?? null,
    exam_content: contentRoot,
  };
}

export function normalizeAttemptRow(row) {
  if (!row) return null;
  const session = readSessionState(row.exam_content);
  return {
    ...row,
    started_at: row.started_at ?? row.created_at ?? null,
    section_scores: row.section_scores ?? session.sectionScores ?? {},
    report: row.report ?? session.report ?? {},
    answers: row.answers ?? session.answers ?? {},
    flagged: row.flagged ?? session.flagged ?? [],
    transcripts: row.transcripts ?? session.transcripts ?? {},
    current_section: row.current_section ?? session.currentSection ?? "listening",
    generated_mock_test_id:
      row.generated_mock_test_id ?? session.generatedMockTestId ?? null,
  };
}
