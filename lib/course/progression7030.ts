export type LessonProgress = {
  id: string;
  slug: string;
  title: string;
  contentType: "review" | "new";
  status: "not_started" | "in_progress" | "completed";
  progressionWeight: number;
};

export type WeekProgress7030 = {
  weekNumber: number;
  reviewTotal: number;
  reviewCompleted: number;
  reviewPercent: number;
  newTotal: number;
  newCompleted: number;
  newUnlocked: boolean;
  newPercent: number;
  overallPercent: number;
};

const REVIEW_UNLOCK_THRESHOLD = 70;

export function computeWeekProgress7030(
  lessons: LessonProgress[]
): WeekProgress7030 {
  const review = lessons.filter((l) => l.contentType === "review");
  const newLessons = lessons.filter((l) => l.contentType === "new");

  const reviewCompleted = review.filter((l) => l.status === "completed").length;
  const newCompleted = newLessons.filter((l) => l.status === "completed").length;

  const reviewTotal = review.length;
  const newTotal = newLessons.length;

  const reviewPercent =
    reviewTotal > 0 ? Math.round((reviewCompleted / reviewTotal) * 100) : 100;

  const newUnlocked = reviewPercent >= REVIEW_UNLOCK_THRESHOLD;

  const newPercent =
    newTotal > 0 ? Math.round((newCompleted / newTotal) * 100) : 0;

  const totalLessons = reviewTotal + newTotal;
  const totalCompleted = reviewCompleted + (newUnlocked ? newCompleted : 0);
  const overallPercent =
    totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0;

  return {
    weekNumber: 0,
    reviewTotal,
    reviewCompleted,
    reviewPercent,
    newTotal,
    newCompleted,
    newUnlocked,
    newPercent,
    overallPercent,
  };
}

export function canAccessLesson(
  lesson: LessonProgress,
  weekProgress: WeekProgress7030
): { allowed: boolean; reason?: string } {
  if (lesson.contentType === "review") {
    return { allowed: true };
  }
  if (!weekProgress.newUnlocked) {
    return {
      allowed: false,
      reason: `Complete ${REVIEW_UNLOCK_THRESHOLD}% of review lessons first (${weekProgress.reviewPercent}% done)`,
    };
  }
  return { allowed: true };
}

import { getMidLevelUnlockWeek } from "@/lib/course/programTracks";

export function canAccessWeek(
  weekNumber: number,
  midLevelPassed: boolean,
  weekCount = 4
): { allowed: boolean; reason?: string } {
  const unlockAfter = getMidLevelUnlockWeek(weekCount);
  if (weekNumber <= unlockAfter) return { allowed: true };
  if (!midLevelPassed) {
    return {
      allowed: false,
      reason: `Pass the mid-level check to unlock Weeks ${unlockAfter + 1}–${weekCount}`,
    };
  }
  return { allowed: true };
}

export function split7030Label(reviewPercent: number, newUnlocked: boolean) {
  return {
    reviewLabel: `${reviewPercent}% review complete (target 70%)`,
    newLabel: newUnlocked
      ? "New content unlocked"
      : "New content locked until 70% review",
    ratio: "70% review · 30% new",
  };
}
