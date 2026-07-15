/**
 * Pure quiz scoring for classroom unit quizzes.
 * Supports: mcq, true_false, gap_fill / fill_blank, matching.
 */

export type ScoreableQuestion = {
  id: string | number;
  type: string;
  prompt?: string;
  options?: string[];
  answer?: string | string[];
  pairs?: { left: string; right: string }[];
  points?: number;
};

export type QuizAnswers = Record<string, unknown>;

export type QuizScoreResult = {
  score: number;
  maxScore: number;
  results: Record<string, boolean>;
  details: Array<{
    id: string;
    correct: boolean;
    points: number;
    earned: number;
  }>;
};

export function normalizeAnswer(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function normalizeTrueFalse(value: unknown): string {
  const n = normalizeAnswer(value);
  const map: Record<string, string> = {
    t: "true",
    f: "false",
    yes: "true",
    no: "false",
    "1": "true",
    "0": "false",
  };
  return map[n] ?? n;
}

function answersEqual(expected: unknown, given: unknown): boolean {
  if (Array.isArray(expected)) {
    const givenNorm = normalizeAnswer(given);
    return expected.some((e) => normalizeAnswer(e) === givenNorm);
  }
  return normalizeAnswer(expected) === normalizeAnswer(given);
}

function scoreMatching(
  question: ScoreableQuestion,
  givenRaw: unknown
): boolean {
  const pairs = question.pairs ?? [];
  if (pairs.length === 0) return false;

  // Accept { left: right } map, or array of { left, right }, or JSON string
  let givenMap: Record<string, string> = {};
  if (typeof givenRaw === "string") {
    try {
      givenRaw = JSON.parse(givenRaw);
    } catch {
      return false;
    }
  }

  if (Array.isArray(givenRaw)) {
    for (const row of givenRaw) {
      if (row && typeof row === "object") {
        const left = String((row as { left?: unknown }).left ?? "");
        const right = String((row as { right?: unknown }).right ?? "");
        if (left) givenMap[normalizeAnswer(left)] = normalizeAnswer(right);
      }
    }
  } else if (givenRaw && typeof givenRaw === "object") {
    for (const [k, v] of Object.entries(givenRaw as Record<string, unknown>)) {
      givenMap[normalizeAnswer(k)] = normalizeAnswer(v);
    }
  } else {
    return false;
  }

  return pairs.every(
    (p) => givenMap[normalizeAnswer(p.left)] === normalizeAnswer(p.right)
  );
}

export function isQuestionCorrect(
  question: ScoreableQuestion,
  givenRaw: unknown
): boolean {
  const type = String(question.type ?? "mcq").toLowerCase();

  if (type === "matching") {
    return scoreMatching(question, givenRaw);
  }

  if (type === "true_false" || type === "true-false") {
    return (
      normalizeTrueFalse(givenRaw) ===
      normalizeTrueFalse(question.answer)
    );
  }

  // mcq, gap_fill, fill_blank, default
  return answersEqual(question.answer, givenRaw);
}

export function scoreQuiz(
  questions: ScoreableQuestion[],
  answers: QuizAnswers
): QuizScoreResult {
  const results: Record<string, boolean> = {};
  const details: QuizScoreResult["details"] = [];
  let score = 0;
  let maxScore = 0;

  for (const q of questions) {
    const id = String(q.id);
    const points = typeof q.points === "number" && q.points > 0 ? q.points : 1;
    maxScore += points;
    const correct = isQuestionCorrect(q, answers[id]);
    results[id] = correct;
    const earned = correct ? points : 0;
    score += earned;
    details.push({ id, correct, points, earned });
  }

  return { score, maxScore, results, details };
}
