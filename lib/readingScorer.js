/**
 * Reading answer scoring — exact match plus Listening-style flexible variants.
 */

import flexibleAnswers from "./listeningFlexibleAnswers.js";

const matchesOfficialListeningAnswer =
  flexibleAnswers.matchesOfficialListeningAnswer ??
  flexibleAnswers.default?.matchesOfficialListeningAnswer;

/**
 * @param {number} accuracy 0–100
 * @returns {number}
 */
export function calculateEstimatedBand(accuracy) {
  if (accuracy >= 100) return 9.0;
  if (accuracy >= 89) return 8.0;
  if (accuracy >= 78) return 7.0;
  if (accuracy >= 67) return 6.0;
  if (accuracy >= 56) return 5.0;
  if (accuracy >= 45) return 4.0;
  return 3.0;
}

/**
 * @param {string} value
 * @returns {string}
 */
export function normalizeAnswer(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Build a slash-separated official key from a primary answer + alternatives.
 * @param {string} correct
 * @param {string[]} [alternatives]
 */
export function buildFlexibleAnswerKey(correct, alternatives = []) {
  const parts = [correct, ...(alternatives ?? [])]
    .map((p) => String(p ?? "").trim())
    .filter(Boolean);
  return [...new Set(parts)].join("/");
}

/**
 * Flexible blank matching (singular/plural, official slash keys, minor variants).
 * @param {string} student
 * @param {string} correct
 * @param {string[]} [alternatives]
 */
export function answersMatchFlexible(student, correct, alternatives = []) {
  const s = String(student ?? "").trim();
  const c = String(correct ?? "").trim();
  if (!c) return !s;
  if (normalizeAnswer(s) === normalizeAnswer(c)) return true;

  const key = buildFlexibleAnswerKey(c, alternatives);
  if (typeof matchesOfficialListeningAnswer === "function") {
    if (matchesOfficialListeningAnswer(s, key)) return true;
    if (matchesOfficialListeningAnswer(s, c)) return true;
  }

  // Light singular/plural fallback
  const ns = normalizeAnswer(s).replace(/s\b/g, "");
  const nc = normalizeAnswer(c).replace(/s\b/g, "");
  if (ns && nc && ns === nc) return true;
  for (const alt of alternatives ?? []) {
    if (normalizeAnswer(s) === normalizeAnswer(alt)) return true;
    const na = normalizeAnswer(alt).replace(/s\b/g, "");
    if (ns && na && ns === na) return true;
  }
  return false;
}

/**
 * @param {Record<string, string>} answers
 * @param {Record<string, string>} correctAnswers
 * @param {{ alternativesById?: Record<string, string[]> }} [options]
 * @returns {{ score: number, total: number, accuracy: number, estimatedBand: number }}
 */
export function scoreReadingAttempt(answers, correctAnswers, options = {}) {
  const keys = Object.keys(correctAnswers);
  const total = keys.length;
  let score = 0;
  const alternativesById = options.alternativesById ?? {};

  for (const key of keys) {
    if (
      answersMatchFlexible(
        answers[key],
        correctAnswers[key],
        alternativesById[key]
      )
    ) {
      score += 1;
    }
  }

  const accuracy = total > 0 ? (score / total) * 100 : 0;
  const estimatedBand = calculateEstimatedBand(accuracy);

  return { score, total, accuracy, estimatedBand };
}

/**
 * @param {number|null|undefined} accuracy
 * @returns {"green"|"amber"|"red"|"gray"}
 */
export function accuracyColorClass(accuracy) {
  if (accuracy === null || accuracy === undefined || !Number.isFinite(accuracy)) {
    return "gray";
  }
  if (accuracy >= 70) return "green";
  if (accuracy >= 50) return "amber";
  return "red";
}

/**
 * @param {number|null|undefined} band
 * @returns {"green"|"amber"|"red"|"gray"}
 */
export function bandColorClass(band) {
  if (band === null || band === undefined || !Number.isFinite(band)) {
    return "gray";
  }
  if (band >= 7) return "green";
  if (band >= 5) return "amber";
  return "red";
}

/**
 * @param {number|null|undefined} accuracy
 * @param {number|null|undefined} band
 * @param {number} attempts
 * @returns {"Not attempted"|"Needs work"|"Good"|"Excellent"}
 */
export function trackerStatus(accuracy, band, attempts) {
  if (!attempts || attempts <= 0) return "Not attempted";
  if ((band ?? 0) >= 7 || (accuracy ?? 0) >= 70) return "Excellent";
  if ((band ?? 0) >= 5 || (accuracy ?? 0) >= 50) return "Good";
  return "Needs work";
}
