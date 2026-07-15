import type { QuizQuestion } from "./b1-1-unit1";

export function normalizeQuizAnswer(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function isQuizAnswerCorrect(
  question: QuizQuestion,
  givenRaw: unknown
): boolean {
  const given = normalizeQuizAnswer(givenRaw);
  const expected = normalizeQuizAnswer(question.answer);
  if (!given) return false;
  if (given === expected) return true;
  if (question.type === "true_false") {
    const map: Record<string, string> = {
      t: "true",
      f: "false",
      yes: "true",
      no: "false",
    };
    return (map[given] ?? given) === expected;
  }
  return false;
}
