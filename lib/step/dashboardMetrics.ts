import type { StepSectionId } from "./examModel";
import { STEP_SECTIONS } from "./examModel";
import { getPhaseDefinition, STEP_PHASES, STEP_TOTAL_WEEKS } from "./phases";
import { STEP_ROUTES } from "./paths";

export type SectionBreakdownItem = {
  id: StepSectionId;
  label: string;
  maxPoints: number;
  estimatedPoints: number;
  scorePercent: number;
  targetPoints: number;
  status: "green" | "amber" | "red";
  href: string;
};

export function sectionEstimatedPoints(
  sectionId: StepSectionId,
  scorePercent: number | null
): number {
  const max = STEP_SECTIONS[sectionId].weightPercent;
  if (scorePercent == null) return 0;
  return Math.round((scorePercent / 100) * max);
}

export function sectionStatus(
  estimatedPoints: number,
  maxPoints: number,
  targetTotal: number
): "green" | "amber" | "red" {
  const sectionTarget = (targetTotal / 100) * maxPoints;
  const ratio = sectionTarget > 0 ? estimatedPoints / sectionTarget : 0;
  if (ratio >= 0.8) return "green";
  if (ratio >= 0.6) return "amber";
  return "red";
}

export function buildSectionBreakdown(
  sectionScores: Partial<Record<StepSectionId, number>>,
  targetScore: number
): SectionBreakdownItem[] {
  return (Object.keys(STEP_SECTIONS) as StepSectionId[]).map((id) => {
    const spec = STEP_SECTIONS[id];
    const scorePercent = sectionScores[id] ?? null;
    const estimatedPoints = sectionEstimatedPoints(id, scorePercent);
    const targetPoints = Math.round((targetScore / 100) * spec.weightPercent);
    const shortLabel =
      id === "compositional_analysis"
        ? "Compositional"
        : id === "structure"
          ? "Structure"
          : spec.label.replace(" Comprehension", "");
    return {
      id,
      label: shortLabel,
      maxPoints: spec.weightPercent,
      estimatedPoints,
      scorePercent: scorePercent ?? 0,
      targetPoints,
      status: sectionStatus(estimatedPoints, spec.weightPercent, targetScore),
      href: STEP_ROUTES.practice(id),
    };
  });
}

export function weekWithinPhase(
  currentWeek: number,
  currentPhase: number
): { weekInPhase: number; weeksInPhase: number } {
  const def = getPhaseDefinition(currentPhase);
  if (!def) return { weekInPhase: 1, weeksInPhase: 2 };
  const weeksInPhase = def.weekCount;
  const weekInPhase = Math.min(
    weeksInPhase,
    Math.max(1, currentWeek - def.weeks[0] + 1)
  );
  return { weekInPhase, weeksInPhase };
}

export function overallCompletionPercent(
  currentWeek: number,
  phases: Array<{ status: string }>
): number {
  const completedPhases = phases.filter((p) => p.status === "completed").length;
  const weekProgress = ((currentWeek - 1) / STEP_TOTAL_WEEKS) * 100;
  const phaseProgress = (completedPhases / 4) * 100;
  return Math.round(Math.min(100, weekProgress * 0.6 + phaseProgress * 0.4));
}

export type ScoreTrend = "on_track" | "needs_attention";

export function scoreTrend(
  estimated: number,
  diagnostic: number | null,
  recentMocks: number[]
): ScoreTrend {
  if (recentMocks.length >= 2) {
    const latest = recentMocks[0];
    const prev = recentMocks[1];
    if (latest > prev) return "on_track";
    if (latest < prev) return "needs_attention";
  }
  if (diagnostic != null && estimated > diagnostic) return "on_track";
  if (diagnostic != null && estimated <= diagnostic) return "needs_attention";
  return "on_track";
}

export function largestGapSection(
  breakdown: SectionBreakdownItem[]
): SectionBreakdownItem {
  return breakdown.reduce((worst, item) => {
    const gap = item.targetPoints - item.estimatedPoints;
    const worstGap = worst.targetPoints - worst.estimatedPoints;
    return gap > worstGap ? item : worst;
  }, breakdown[0]);
}

export function recommendedFocusActions(
  weak: SectionBreakdownItem
): Array<{ title: string; href: string }> {
  const base = STEP_ROUTES.practice(weak.id);
  const actions: Record<StepSectionId, Array<{ title: string; href: string }>> = {
    reading: [
      { title: "2 timed reading passages", href: base },
      { title: "Skimming & scanning drill", href: base },
      { title: "Word-meaning in context set", href: base },
    ],
    structure: [
      { title: "20 grammar MCQs", href: `${STEP_ROUTES.home}/grammar-drills` },
      { title: "Tense & preposition review", href: base },
      { title: "Subject–verb agreement set", href: base },
    ],
    listening: [
      { title: "2 dialogue recordings", href: base },
      { title: "Numbers & dates drill", href: base },
      { title: "Idiom comprehension set", href: base },
    ],
    compositional_analysis: [
      { title: "Punctuation accuracy set", href: base },
      { title: "Sentence combining drill", href: base },
      { title: "Find-the-error practice", href: base },
    ],
  };
  return actions[weak.id] ?? actions.reading;
}
