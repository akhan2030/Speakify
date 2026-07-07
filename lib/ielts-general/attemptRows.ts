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
