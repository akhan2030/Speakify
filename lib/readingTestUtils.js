import {
  calculateEstimatedBand,
  normalizeAnswer,
  scoreReadingAttempt,
} from "./readingScorer.js";

/**
 * @param {number} seconds
 * @returns {string}
 */
export function formatTimeTaken(seconds) {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}

/**
 * @param {Record<string, string>} answers
 * @param {Record<string, string>} correctAnswers
 * @param {object[]} questions
 * @param {(q: object) => string} getGroupKey
 */
function scoreByGroup(answers, correctAnswers, questions, getGroupKey) {
  /** @type {Record<string, { label: string, slug: string, score: number, total: number }>} */
  const groups = {};

  for (const q of questions) {
    const key = getGroupKey(q);
    if (!groups[key]) {
      groups[key] = {
        label: q.typeLabel,
        slug: q.typeSlug,
        score: 0,
        total: 0,
      };
    }
    groups[key].total += 1;
    if (
      normalizeAnswer(answers[q.id]) === normalizeAnswer(correctAnswers[q.id])
    ) {
      groups[key].score += 1;
    }
  }

  return Object.values(groups).map((g) => ({
    questionType: g.slug,
    label: g.label,
    score: g.score,
    total: g.total,
    accuracy: g.total > 0 ? Math.round((g.score / g.total) * 1000) / 10 : 0,
    estimatedBand: calculateEstimatedBand(
      g.total > 0 ? (g.score / g.total) * 100 : 0
    ),
  }));
}

/**
 * @param {Record<string, string>} answers
 * @param {Record<string, string>} correctAnswers
 * @param {import('./readingMockTestContent.js').MockTestConfig} config
 */
export function buildTestResults(answers, correctAnswers, config) {
  const questions = config.passages.flatMap((p) => p.questions);
  const overall = scoreReadingAttempt(answers, correctAnswers);

  const passageBreakdown = config.passages.map((passage) => {
    const passageCorrect = {};
    for (const q of passage.questions) {
      passageCorrect[q.id] = correctAnswers[q.id];
    }
    const result = scoreReadingAttempt(answers, passageCorrect);
    return {
      passageId: passage.id,
      passageIndex: passage.index,
      title: passage.title,
      score: result.score,
      total: result.total,
      accuracy: Math.round(result.accuracy * 10) / 10,
      estimatedBand: result.estimatedBand,
    };
  });

  const typeBreakdown = scoreByGroup(
    answers,
    correctAnswers,
    questions,
    (q) => q.typeSlug
  );

  const weakest = [...typeBreakdown].sort((a, b) => a.accuracy - b.accuracy)[0];

  return {
    testId: config.testId,
    testType: config.passages.length > 1 ? "full" : "passage",
    title: config.title,
    score: overall.score,
    total: overall.total,
    accuracy: Math.round(overall.accuracy * 10) / 10,
    estimatedBand: overall.estimatedBand,
    passageBreakdown,
    typeBreakdown,
    weakestType: weakest?.questionType ?? null,
    weakestLabel: weakest?.label ?? null,
  };
}

/**
 * @param {object} payload
 */
export function storeTestResults(payload) {
  try {
    sessionStorage.setItem(
      "reading_test_results",
      JSON.stringify({
        ...payload,
        savedAt: new Date().toISOString(),
      })
    );
  } catch {
    // ignore quota errors
  }
}

/**
 * @returns {object|null}
 */
export function loadTestResults() {
  try {
    const raw = sessionStorage.getItem("reading_test_results");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
