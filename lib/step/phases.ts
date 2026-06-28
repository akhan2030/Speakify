/**
 * Speakify STEP Accelerator — one adaptive course with 4 internal phases.
 */

import type { StepSectionId } from "./examModel";

export type StepPhaseStatus = "locked" | "active" | "completed";

export type StepPhaseDefinition = {
  phase: number;
  title: string;
  subtitle: string;
  weeks: [number, number];
  weekCount: number;
  focusSections: StepSectionId[];
  exitScoreRequired: number;
  description: string;
  weeklyThemes: Record<number, string>;
};

export const STEP_ACCELERATOR_NAME = "Speakify STEP Accelerator";
export const STEP_TOTAL_WEEKS = 10;
export const STEP_DEFAULT_TARGET = 80;

/** Diagnostic score → starting phase */
export function diagnosticStartingPhase(score: number): number {
  if (score >= 73) return 4;
  if (score >= 58) return 3;
  if (score >= 40) return 2;
  return 1;
}

export function weeksRemainingFromPhase(
  currentPhase: number,
  weekInPhase: number,
  weeksInPhase: number
): number {
  let remaining = weeksInPhase - weekInPhase + 1;
  for (const p of STEP_PHASES) {
    if (p.phase > currentPhase) {
      remaining += p.weekCount;
    }
  }
  return Math.max(1, remaining);
}

export const STEP_PHASES: StepPhaseDefinition[] = [
  {
    phase: 1,
    title: "Foundation",
    subtitle: "Format, pacing & core grammar",
    weeks: [1, 2],
    weekCount: 2,
    focusSections: ["structure", "reading"],
    exitScoreRequired: 50,
    description:
      "Learn the Qiyas STEP format, timing rules, and build grammar accuracy for Structure (30%).",
    weeklyThemes: {
      1: "STEP format overview & Structure drills",
      2: "Reading strategies & timed MCQ pacing",
    },
  },
  {
    phase: 2,
    title: "Development",
    subtitle: "Reading mastery & grammar depth",
    weeks: [3, 5],
    weekCount: 3,
    focusSections: ["reading", "structure"],
    exitScoreRequired: 65,
    description:
      "Strengthen Reading Comprehension (40%) with skimming, inference, and vocabulary-in-context.",
    weeklyThemes: {
      3: "Passage scanning & word-meaning questions",
      4: "Inference & main idea practice",
      5: "Structure consolidation under time pressure",
    },
  },
  {
    phase: 3,
    title: "Advancement",
    subtitle: "Listening & compositional analysis",
    weeks: [6, 8],
    weekCount: 3,
    focusSections: ["listening", "compositional_analysis"],
    exitScoreRequired: 75,
    description:
      "Train one-play listening and written-form analysis — the sections that surprise most students.",
    weeklyThemes: {
      6: "Listening: numbers, idioms & detail questions",
      7: "Compositional analysis: punctuation & word order",
      8: "Mixed section drills & phase exit prep",
    },
  },
  {
    phase: 4,
    title: "Excellence",
    subtitle: "Full mocks & exam-day polish",
    weeks: [9, 10],
    weekCount: 2,
    focusSections: ["reading", "structure", "listening", "compositional_analysis"],
    exitScoreRequired: 80,
    description:
      "Full-length timed mocks, score review, and polish toward your 80+ university target.",
    weeklyThemes: {
      9: "Full mock #1 & weak-area review",
      10: "Full mock #2 & exam-day strategy",
    },
  },
];

export function getPhaseDefinition(phase: number): StepPhaseDefinition | undefined {
  return STEP_PHASES.find((p) => p.phase === phase);
}

export function weekForPhase(phase: number): number {
  const def = getPhaseDefinition(phase);
  return def?.weeks[0] ?? 1;
}

export function phaseForWeek(week: number): number {
  for (const p of STEP_PHASES) {
    if (week >= p.weeks[0] && week <= p.weeks[1]) return p.phase;
  }
  return 4;
}

export function nextPhase(current: number): number | null {
  if (current >= 4) return null;
  return current + 1;
}
