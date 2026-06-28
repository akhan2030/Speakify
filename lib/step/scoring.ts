import type { StepSectionId } from "./examModel";
import { STEP_SECTIONS } from "./examModel";

/** Convert raw correct/total to section score on 0–100 scale */
export function sectionScoreFromAccuracy(
  correct: number,
  attempted: number
): number {
  if (attempted <= 0) return 0;
  return Math.round((correct / attempted) * 100);
}

/** Weighted total STEP estimate from per-section scores (0–100 each) */
export function estimatedTotalScore(
  sectionScores: Partial<Record<StepSectionId, number>>
): number {
  let weighted = 0;
  let totalWeight = 0;

  for (const section of Object.values(STEP_SECTIONS)) {
    const score = sectionScores[section.id];
    if (score == null) continue;
    weighted += score * section.weightPercent;
    totalWeight += section.weightPercent;
  }

  if (totalWeight === 0) return 0;
  return Math.round(weighted / totalWeight);
}

/** Map section practice accuracy to estimated section contribution */
export function updateSectionEstimate(
  existing: number,
  sessionScore: number,
  weight = 0.35
): number {
  if (existing <= 0) return sessionScore;
  return Math.round(existing * (1 - weight) + sessionScore * weight);
}

export function scoreGap(current: number, target: number): number {
  return Math.max(0, target - current);
}

export function weakestSection(
  scores: Partial<Record<StepSectionId, number>>
): StepSectionId | null {
  let min: { id: StepSectionId; score: number } | null = null;

  for (const section of Object.values(STEP_SECTIONS)) {
    const score = scores[section.id];
    if (score == null) continue;
    if (!min || score < min.score) {
      min = { id: section.id, score };
    }
  }

  return min?.id ?? null;
}

export function formatStepScore(score: number | null | undefined): string {
  if (score == null) return "—";
  return `${score}/100`;
}
