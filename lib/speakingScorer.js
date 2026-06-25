/**
 * IELTS Speaking band calculation — placeholder
 */

/** @param {number|null} score */
export function roundToHalfBand(score) {
  if (score === null || !Number.isFinite(score)) return null;
  return Math.round(score * 2) / 2;
}

/** @param {object} criteriaScores */
export function calculateOverallSpeakingBand(criteriaScores) {
  const values = Object.values(criteriaScores).filter(
    (v) => typeof v === "number" && Number.isFinite(v)
  );
  if (values.length === 0) return null;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  return roundToHalfBand(avg);
}
