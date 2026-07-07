/**
 * Normalise GT attempt/history rows across prod schema variants.
 * Prod may use task_type (legacy) or skill (app); reads accept both.
 */

export function gtAttemptSkill(row) {
  return String(row?.skill ?? row?.task_type ?? "").toLowerCase();
}

export function gtAttemptInsertRow({
  studentId,
  skill,
  bandScore,
  letterType = null,
  accuracy = null,
  status = "completed",
  mockNumber = null,
  completedAt,
}) {
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

export function gtHistoryInsertRow({
  studentId,
  skill,
  bandScore,
  recordedAt,
}) {
  const at = recordedAt ?? new Date().toISOString();
  return {
    student_id: studentId,
    skill,
    band_score: bandScore,
    recorded_at: at,
    completed_at: at,
  };
}
