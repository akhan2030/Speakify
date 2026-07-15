/**
 * Pure helpers for classroom unit progress (lessons 1–5).
 */

export const UNIT_LESSON_COUNT = 5;
export const UNIT_LESSON_NUMBERS = [1, 2, 3, 4, 5] as const;

export type ProgressSnapshot = {
  completedCount: number;
  totalLessons: number;
  percent: number;
  completedLessonNumbers: number[];
  remainingLessonNumbers: number[];
  isComplete: boolean;
};

/** Clamp / filter completed lesson numbers to the 1–5 unit lesson range. */
export function normalizeCompletedLessons(
  completed: Iterable<number | string>
): number[] {
  const set = new Set<number>();
  for (const raw of completed) {
    const n = typeof raw === "number" ? raw : Number(raw);
    if (Number.isInteger(n) && n >= 1 && n <= UNIT_LESSON_COUNT) {
      set.add(n);
    }
  }
  return UNIT_LESSON_NUMBERS.filter((n) => set.has(n));
}

/** Progress percent rounded to nearest integer (0–100). */
export function progressPercentFromLessons(
  completed: Iterable<number | string>,
  totalLessons: number = UNIT_LESSON_COUNT
): number {
  const total = totalLessons > 0 ? totalLessons : UNIT_LESSON_COUNT;
  const done = normalizeCompletedLessons(completed).length;
  const capped = Math.min(done, total);
  return Math.round((capped / total) * 100);
}

export function buildUnitProgress(
  completed: Iterable<number | string>,
  totalLessons: number = UNIT_LESSON_COUNT
): ProgressSnapshot {
  const total = totalLessons > 0 ? totalLessons : UNIT_LESSON_COUNT;
  const completedLessonNumbers = normalizeCompletedLessons(completed).filter(
    (n) => n <= total
  );
  const completedCount = completedLessonNumbers.length;
  const remainingLessonNumbers = Array.from(
    { length: total },
    (_, i) => i + 1
  ).filter((n) => !completedLessonNumbers.includes(n));

  return {
    completedCount,
    totalLessons: total,
    percent: progressPercentFromLessons(completedLessonNumbers, total),
    completedLessonNumbers,
    remainingLessonNumbers,
    isComplete: completedCount >= total,
  };
}

export function isLessonComplete(
  completed: Iterable<number | string>,
  lessonNumber: number
): boolean {
  return normalizeCompletedLessons(completed).includes(lessonNumber);
}
