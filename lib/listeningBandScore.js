/**
 * Official-style IELTS Listening raw score (out of 40) → band.
 * Used for section practice (10 Q), full mock (40 Q), and tracker aggregates.
 */
export function listeningRawToBand(rawScore, totalQuestions = 40) {
  const total = Math.max(1, Number(totalQuestions) || 40);
  const score = Math.max(0, Number(rawScore) || 0);

  let scaledScore = score;
  if (total === 10) {
    scaledScore = score * 4;
  } else if (total !== 40) {
    scaledScore = Math.round((score / total) * 40);
  }

  scaledScore = Math.min(40, Math.max(0, scaledScore));

  if (scaledScore >= 39) return 9.0;
  if (scaledScore >= 37) return 8.5;
  if (scaledScore >= 35) return 8.0;
  if (scaledScore >= 33) return 7.5;
  if (scaledScore >= 30) return 7.0;
  if (scaledScore >= 27) return 6.5;
  if (scaledScore >= 23) return 6.0;
  if (scaledScore >= 20) return 5.5;
  if (scaledScore >= 16) return 5.0;
  if (scaledScore >= 13) return 4.5;
  if (scaledScore >= 10) return 4.0;
  if (scaledScore >= 8) return 3.5;
  if (scaledScore >= 6) return 3.0;
  if (scaledScore >= 4) return 2.5;
  if (scaledScore >= 2) return 2.0;
  if (scaledScore >= 1) return 1.5;
  return 1.0;
}
