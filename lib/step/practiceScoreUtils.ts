import type { StepSectionId } from "./examModel";

/** Maximum points each section contributes to the STEP 0–100 scale */
export const SECTION_POINT_MAX: Record<StepSectionId, number> = {
  reading: 40,
  structure: 30,
  listening: 20,
  compositional_analysis: 10,
};

const CONSERVATIVE_FACTOR = 0.8;

/** Conservative section estimate: (correct / attempted) × sectionMax × 0.8 */
export function conservativeSectionEstimate(
  section: StepSectionId,
  correct: number,
  attempted: number
): number {
  if (attempted <= 0) return 0;
  const max = SECTION_POINT_MAX[section];
  return Math.round((correct / attempted) * max * CONSERVATIVE_FACTOR);
}

/** Sum of all four section estimates (max 80 with perfect accuracy due to 0.8 factor) */
export function totalEstimatedFromSections(
  scores: Partial<Record<StepSectionId, number>>
): number {
  let total = 0;
  for (const key of Object.keys(SECTION_POINT_MAX) as StepSectionId[]) {
    total += scores[key] ?? 0;
  }
  return Math.round(total);
}

export function accuracyPercent(correct: number, attempted: number): number {
  if (attempted <= 0) return 0;
  return Math.round((correct / attempted) * 100);
}
