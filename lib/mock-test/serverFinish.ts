import {
  checkGtReadingAnswer,
  gtReadingKindToType,
  gtReadingRawToBand,
  scoreGtReadingFromMockContent,
} from "@/lib/ielts-general/readingScore";
import {
  computeOverallBand,
  scoreListening,
  scoreReading,
} from "@/lib/mock-test/scoring";
import { resolveAcademicMockBundle } from "@/lib/mock-test/resolveFullMockContent";
import type { MockExamContent } from "@/lib/mock-test/types";

export function buildGtReadingSectionBreakdown(
  examContent: MockExamContent,
  answers: Record<string, string>
) {
  const sections: Record<string, { correct: number; total: number; band: number }> = {
    A: { correct: 0, total: 0, band: 0 },
    B: { correct: 0, total: 0, band: 0 },
    C: { correct: 0, total: 0, band: 0 },
  };

  for (const passage of examContent.reading.passages) {
    const secMatch = passage.difficulty.match(/Section ([ABC])/);
    const sec = secMatch?.[1];
    if (!sec || !sections[sec]) continue;
    for (const q of passage.questions) {
      sections[sec].total += 1;
      const gtType = gtReadingKindToType(q.kind);
      if (checkGtReadingAnswer(answers[q.id] ?? "", q.correct ?? "", gtType)) {
        sections[sec].correct += 1;
      }
    }
  }

  for (const key of ["A", "B", "C"]) {
    const row = sections[key];
    row.band = gtReadingRawToBand(row.correct, row.total || 1);
  }

  return sections;
}

export function computeMockObjectiveFinish(input: {
  answers: Record<string, string>;
  examContent?: MockExamContent | null;
  variant?: "academic" | "general";
}) {
  const answers = input.answers ?? {};
  const examContent = input.examContent ?? null;
  const isGeneral = input.variant === "general";

  const academicBundle =
    !isGeneral && examContent
      ? resolveAcademicMockBundle(examContent as Record<string, unknown>)
      : null;

  const listening = scoreListening(
    answers,
    academicBundle?.listening
  );
  const reading = isGeneral
    ? scoreGtReadingFromMockContent(answers, examContent as MockExamContent)
    : scoreReading(answers, examContent);

  const sectionScores = { listening, reading };
  const overallBand = computeOverallBand({
    listening: listening.band,
    reading: reading.band,
  });

  const readingSectionBreakdown = isGeneral
    ? buildGtReadingSectionBreakdown(examContent as MockExamContent, answers)
    : undefined;

  return {
    sectionScores,
    overallBand,
    readingSectionBreakdown,
  };
}
