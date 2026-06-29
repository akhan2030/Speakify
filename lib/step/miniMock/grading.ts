import { gradeMockExam } from "../mockExam/generateMockQuestions";
import type { MockExamQuestion } from "../mockExam/types";
import type { StepSectionId } from "../examModel";

export function gradeMiniMock(
  questions: MockExamQuestion[],
  answers: Record<string, string>
) {
  const raw = gradeMockExam(questions, answers);

  const readingRaw = raw.readingScore;
  const structureRaw = raw.structureScore;
  const listeningRaw = raw.listeningScore;
  const compositionalRaw = raw.compositionalScore;
  const totalRaw =
    readingRaw + structureRaw + listeningRaw + compositionalRaw;

  const readingScaled = Math.round((readingRaw / 5) * 40);
  const structureScaled = Math.round((structureRaw / 5) * 30);
  const listeningScaled = Math.round((listeningRaw / 5) * 20);
  const compositionalScaled = Math.round((compositionalRaw / 5) * 10);
  const estimatedStepScore =
    readingScaled + structureScaled + listeningScaled + compositionalScaled;

  return {
    readingRaw,
    structureRaw,
    listeningRaw,
    compositionalRaw,
    totalRaw,
    readingScaled,
    structureScaled,
    listeningScaled,
    compositionalScaled,
    estimatedStepScore,
    results: raw.results,
  };
}

export function estimatedFromMiniRawTotal(totalRaw: number): number {
  return Math.round((totalRaw / 20) * 100);
}

export function weightedEstimatedFromHistory(
  totals: number[]
): number | null {
  if (totals.length === 0) return null;
  const recent = totals.slice(0, 3);
  const estimates = recent.map((t) => estimatedFromMiniRawTotal(t));
  const sum = estimates.reduce((a, b) => a + b, 0);
  return Math.round(sum / estimates.length);
}

export function weakestMiniSection(graded: {
  readingRaw: number;
  structureRaw: number;
  listeningRaw: number;
  compositionalRaw: number;
}): {
  id: StepSectionId;
  label: string;
  raw: number;
  pct: number;
} {
  const sections: Array<{
    id: StepSectionId;
    label: string;
    raw: number;
  }> = [
    { id: "reading", label: "Reading", raw: graded.readingRaw },
    { id: "structure", label: "Structure", raw: graded.structureRaw },
    { id: "listening", label: "Listening", raw: graded.listeningRaw },
    {
      id: "compositional_analysis",
      label: "Compositional",
      raw: graded.compositionalRaw,
    },
  ];
  const worst = sections.reduce((a, b) => (a.raw <= b.raw ? a : b));
  return { ...worst, pct: Math.round((worst.raw / 5) * 100) };
}

export function practicePathForSection(section: StepSectionId): string {
  const map: Record<StepSectionId, string> = {
    reading: "/dashboard/step/student/reading",
    structure: "/dashboard/step/student/structure",
    listening: "/dashboard/step/student/listening",
    compositional_analysis: "/dashboard/step/student/compositional",
  };
  return map[section];
}
