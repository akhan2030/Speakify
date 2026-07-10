/**
 * Normalise GT attempt/history rows across prod schema variants.
 * Prod may use task_type (legacy) or skill (app); reads accept both.
 */

export function gtAttemptSkill(row: {
  skill?: string | null;
  task_type?: string | null;
}): string {
  return String(row?.skill ?? row?.task_type ?? "").toLowerCase();
}

type GtAttemptInsertArgs = {
  studentId: string;
  skill: string;
  bandScore: number;
  letterType?: string | null;
  accuracy?: number | null;
  status?: string;
  mockNumber?: number | null;
  completedAt?: string;
};

export function gtAttemptInsertRow({
  studentId,
  skill,
  bandScore,
  letterType = null,
  accuracy = null,
  status = "completed",
  mockNumber = null,
  completedAt,
}: GtAttemptInsertArgs) {
  const at = completedAt ?? new Date().toISOString();
  return {
    student_id: studentId,
    skill,
    task_type: skill,
    band_score: bandScore,
    letter_type: letterType,
    accuracy,
    status,
    mock_number: mockNumber,
    completed_at: at,
  };
}

type GtHistoryInsertArgs = {
  studentId: string;
  skill: string;
  bandScore: number;
  recordedAt?: string;
};

export function gtWritingAttemptInsertRow({
  studentId,
  taskType,
  letterType = null,
  bands,
  essay,
  structuredFeedback,
  completedAt,
}: {
  studentId: string;
  taskType: "task1" | "task2";
  letterType?: string | null;
  bands: {
    ta: number;
    cc: number;
    lr: number;
    gra: number;
    overall: number;
  };
  essay: string;
  structuredFeedback: Record<string, unknown>;
  completedAt?: string;
}) {
  const at = completedAt ?? new Date().toISOString();
  const letterCheck =
    structuredFeedback.letterFormatCheck &&
    typeof structuredFeedback.letterFormatCheck === "object"
      ? (structuredFeedback.letterFormatCheck as Record<string, unknown>)
      : null;

  return {
    student_id: studentId,
    skill: "writing",
    task_type: "writing",
    task_type_detail: taskType,
    band_score: bands.overall,
    ta_score: bands.ta,
    cc_score: bands.cc,
    lr_score: bands.lr,
    gra_score: bands.gra,
    letter_type: taskType === "task1" ? letterType ?? null : null,
    content: essay,
    feedback: structuredFeedback,
    bullet_points_covered: letterCheck ? Number(letterCheck.bulletPointsCovered) || null : null,
    opening_correct: letterCheck ? Boolean(letterCheck.openingCorrect) : null,
    signoff_correct: letterCheck ? Boolean(letterCheck.signoffCorrect) : null,
    register_accurate: letterCheck ? Boolean(letterCheck.registerConsistent) : null,
    status: "completed",
    completed_at: at,
  };
}

export function gtHistoryInsertRow({
  studentId,
  skill,
  bandScore,
  recordedAt,
}: GtHistoryInsertArgs) {
  const at = recordedAt ?? new Date().toISOString();
  return {
    student_id: studentId,
    skill,
    band_score: bandScore,
    recorded_at: at,
    completed_at: at,
  };
}
