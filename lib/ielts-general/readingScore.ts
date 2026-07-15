import type { GtReadingQuestion } from "./readingContent";
import type { MockExamContent } from "@/lib/mock-test/types";

export function gtReadingKindToType(kind: string): string | undefined {
  if (kind === "true-false-not-given") return "true_false_not_given";
  if (kind === "multiple-choice") return "multiple_choice";
  if (kind === "matching-headings") return "matching_headings";
  return undefined;
}

function normalizeAnswer(value: string): string {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?'"()]/g, "");
}

function matchesOneCorrectForm(student: string, correct: string): boolean {
  if (!student || !correct) return false;
  if (student === correct) return true;
  if (student.replace(/\s/g, "") === correct.replace(/\s/g, "")) return true;
  if (correct.includes(student) && student.length >= 2) return true;
  if (student.includes(correct) && correct.length >= 2) return true;
  return false;
}

export function checkGtReadingAnswer(
  studentAnswer: string,
  correctAnswer: string,
  type?: string
): boolean {
  const student = normalizeAnswer(studentAnswer);
  const correctRaw = String(correctAnswer ?? "").trim();

  if (!student && !correctRaw) return true;
  if (!student || !correctRaw) return false;

  if (type === "true_false_not_given") {
    const raw = String(studentAnswer ?? "").trim().toUpperCase().replace(/\s+/g, " ");
    const studentTfng =
      raw === "T" || raw === "TRUE"
        ? "TRUE"
        : raw === "F" || raw === "FALSE"
          ? "FALSE"
          : raw === "NG" || raw === "NOT GIVEN" || raw === "NOTGIVEN"
            ? "NOT GIVEN"
            : raw;
    const correctTfng = correctRaw.toUpperCase().replace(/\s+/g, " ");
    return studentTfng === correctTfng;
  }

  // Official-style alternates: "lime water/limewater", "two hundred/200"
  const alternates = correctRaw
    .split("/")
    .map((part) => normalizeAnswer(part))
    .filter(Boolean);

  for (const correct of alternates.length ? alternates : [normalizeAnswer(correctRaw)]) {
    if (matchesOneCorrectForm(student, correct)) return true;
  }

  return false;
}

export type GtReadingScoreResult = {
  correct: number;
  total: number;
  accuracy: number;
  estimatedBand: number;
  breakdown: Array<{
    questionId: string;
    number: number;
    correct: boolean;
    studentAnswer: string;
    correctAnswer: string;
    explanation: string;
  }>;
  sectionBreakdown?: {
    A: { correct: number; total: number };
    B: { correct: number; total: number };
    C: { correct: number; total: number };
  };
};

/** IELTS GT reading raw-score → band (40-question scale). */
export function gtReadingRawToBand(correct: number, total = 40): number {
  if (total <= 0) return 0;
  if (total !== 40) {
    const ratio = correct / total;
    return gtReadingRawToBand(Math.round(ratio * 40), 40);
  }

  if (correct >= 39) return 9;
  if (correct >= 37) return 8.5;
  if (correct >= 35) return 8;
  if (correct >= 33) return 7.5;
  if (correct >= 30) return 7;
  if (correct >= 27) return 6.5;
  if (correct >= 23) return 6;
  if (correct >= 19) return 5.5;
  if (correct >= 15) return 5;
  if (correct >= 12) return 4.5;
  if (correct >= 9) return 4;
  if (correct >= 6) return 3.5;
  if (correct >= 4) return 3;
  return 2.5;
}

export function scoreGtReadingAnswers(
  questions: GtReadingQuestion[],
  answers: Record<string, string>,
  options?: {
    passageSectionByQuestionId?: Record<string, "A" | "B" | "C">;
  }
): GtReadingScoreResult {
  const breakdown = questions.map((q) => {
    const studentAnswer = String(answers[q.id] ?? "").trim();
    const correct = checkGtReadingAnswer(studentAnswer, q.answer, q.type);
    return {
      questionId: q.id,
      number: q.number,
      correct,
      studentAnswer,
      correctAnswer: q.answer,
      explanation: q.explanation,
    };
  });

  const correct = breakdown.filter((b) => b.correct).length;
  const total = questions.length;
  const accuracy = total > 0 ? Math.round((correct / total) * 1000) / 10 : 0;

  let sectionBreakdown: GtReadingScoreResult["sectionBreakdown"];
  if (options?.passageSectionByQuestionId) {
    const sections = { A: { correct: 0, total: 0 }, B: { correct: 0, total: 0 }, C: { correct: 0, total: 0 } };
    for (const row of breakdown) {
      const sec = options.passageSectionByQuestionId[row.questionId];
      if (!sec) continue;
      sections[sec].total += 1;
      if (row.correct) sections[sec].correct += 1;
    }
    sectionBreakdown = sections;
  }

  return {
    correct,
    total,
    accuracy,
    estimatedBand: gtReadingRawToBand(correct, total),
    breakdown,
    sectionBreakdown,
  };
}

export type GtMockReadingScore = {
  correct: number;
  total: number;
  accuracy: number;
  band: number;
  passageBreakdown: Array<{
    label: string;
    correct: number;
    total: number;
    accuracy: number;
    band: number;
  }>;
};

/** Score GT reading inside the shared mock exam engine using GT band tables. */
export function scoreGtReadingFromMockContent(
  answers: Record<string, string>,
  examContent: MockExamContent
): GtMockReadingScore {
  const passages = examContent.reading.passages;
  let correct = 0;
  let total = 0;

  const passageBreakdown = passages.map((passage) => {
    let passageCorrect = 0;
    let passageTotal = 0;
    for (const q of passage.questions) {
      passageTotal += 1;
      total += 1;
      const gtType = gtReadingKindToType(q.kind);
      if (
        checkGtReadingAnswer(answers[q.id] ?? "", q.correct ?? "", gtType)
      ) {
        passageCorrect += 1;
        correct += 1;
      }
    }
    const accuracy = passageTotal ? passageCorrect / passageTotal : 0;
    return {
      label: passage.title || `Passage ${passage.index}`,
      correct: passageCorrect,
      total: passageTotal,
      accuracy,
      band: gtReadingRawToBand(passageCorrect, passageTotal || 1),
    };
  });

  return {
    correct,
    total: total || 40,
    accuracy: total ? correct / total : 0,
    band: gtReadingRawToBand(correct, total || 40),
    passageBreakdown,
  };
}
