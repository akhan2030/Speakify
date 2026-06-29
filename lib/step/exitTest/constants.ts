import { getPhaseDefinition } from "../phases";

export const EXIT_TEST_QUESTIONS = 40;
export const EXIT_TEST_TIME_SECONDS = 45 * 60;
export const EXIT_TEST_SECTION_COUNTS = [10, 10, 10, 10] as const;
export const EXIT_TEST_COOLDOWN_DAYS = 7;

export const PASS_THRESHOLDS: Record<number, number> = {
  1: 40,
  2: 57,
  3: 72,
  4: 80,
};

export const EXIT_SECTION_NAMES = [
  "Reading Comprehension",
  "Structure & Grammar",
  "Listening",
  "Compositional Analysis",
] as const;

export const EXIT_SECTION_WEIGHTS = ["40%", "30%", "20%", "10%"] as const;

export const EXIT_SECTION_MAX = {
  reading: 40,
  structure: 30,
  listening: 20,
  compositional: 10,
} as const;

export function passThresholdForPhase(phase: number): number {
  return PASS_THRESHOLDS[phase] ?? 80;
}

/** Exit test unlocks when the student reaches the final week of their current phase. */
export function isExitTestWeekEligible(currentPhase: number, currentWeek: number): boolean {
  const def = getPhaseDefinition(currentPhase);
  if (!def) return false;
  return currentWeek >= def.weekCount;
}

export function daysUntilExitRetake(lastSubmittedAt: string | null): number {
  if (!lastSubmittedAt) return 0;
  const last = new Date(lastSubmittedAt);
  const next = new Date(last);
  next.setDate(next.getDate() + EXIT_TEST_COOLDOWN_DAYS);
  const diff = next.getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function nextRetakeDate(lastSubmittedAt: string | null): string | null {
  if (!lastSubmittedAt) return null;
  const last = new Date(lastSubmittedAt);
  const next = new Date(last);
  next.setDate(next.getDate() + EXIT_TEST_COOLDOWN_DAYS);
  return next.toISOString();
}

export function readinessLabel(
  estimated: number,
  threshold: number
): { tone: "green" | "amber" | "red"; message: string } {
  if (estimated >= threshold) {
    return {
      tone: "green",
      message: "✅ Ready — your practice score suggests you will pass",
    };
  }
  if (estimated >= threshold - 10) {
    return {
      tone: "amber",
      message: "⚠ Almost ready — a few more practice sessions recommended",
    };
  }
  return {
    tone: "red",
    message: "❌ Not ready yet — complete more practice before attempting",
  };
}
