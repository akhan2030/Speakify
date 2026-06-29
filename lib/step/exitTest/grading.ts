import { gradeMockExam } from "../mockExam/generateMockQuestions";
import type { MockExamQuestion } from "../mockExam/types";
import type { StepSectionId } from "../examModel";
import { passThresholdForPhase } from "./constants";

const SECTION_SCALE = {
  reading: 4,
  structure: 3,
  listening: 2,
  compositional_analysis: 1,
} as const;

export function gradeExitTest(
  questions: MockExamQuestion[],
  answers: Record<string, string>
) {
  const raw = gradeMockExam(questions, answers);

  const readingRaw = raw.readingScore;
  const structureRaw = raw.structureScore;
  const listeningRaw = raw.listeningScore;
  const compositionalRaw = raw.compositionalScore;

  const readingScore = readingRaw * SECTION_SCALE.reading;
  const structureScore = structureRaw * SECTION_SCALE.structure;
  const listeningScore = listeningRaw * SECTION_SCALE.listening;
  const compositionalScore = compositionalRaw * SECTION_SCALE.compositional_analysis;
  const totalScore =
    readingScore + structureScore + listeningScore + compositionalScore;

  return {
    readingScore,
    structureScore,
    listeningScore,
    compositionalScore,
    readingRaw,
    structureRaw,
    listeningRaw,
    compositionalRaw,
    totalScore,
    results: raw.results,
  };
}

export function sectionNeededCorrect(passThreshold: number): number {
  return Math.min(10, Math.ceil(passThreshold / 10));
}

export function gapAnalysis(
  phase: number,
  graded: ReturnType<typeof gradeExitTest>
) {
  const threshold = passThresholdForPhase(phase);
  const needed = sectionNeededCorrect(threshold);
  const sections: Array<{
    id: StepSectionId;
    label: string;
    got: number;
    needed: number;
    pointsShort: number;
    passed: boolean;
  }> = [
    {
      id: "reading",
      label: "Reading",
      got: graded.readingRaw,
      needed,
      pointsShort: Math.max(0, needed - graded.readingRaw) * SECTION_SCALE.reading,
      passed: graded.readingRaw >= needed,
    },
    {
      id: "structure",
      label: "Structure",
      got: graded.structureRaw,
      needed,
      pointsShort: Math.max(0, needed - graded.structureRaw) * SECTION_SCALE.structure,
      passed: graded.structureRaw >= needed,
    },
    {
      id: "listening",
      label: "Listening",
      got: graded.listeningRaw,
      needed,
      pointsShort: Math.max(0, needed - graded.listeningRaw) * SECTION_SCALE.listening,
      passed: graded.listeningRaw >= needed,
    },
    {
      id: "compositional_analysis",
      label: "Compositional",
      got: graded.compositionalRaw,
      needed,
      pointsShort:
        Math.max(0, needed - graded.compositionalRaw) *
        SECTION_SCALE.compositional_analysis,
      passed: graded.compositionalRaw >= needed,
    },
  ];

  return {
    threshold,
    pointsNeeded: Math.max(0, threshold - graded.totalScore),
    sections,
  };
}

export function studyRecommendations(
  sections: ReturnType<typeof gapAnalysis>["sections"]
): string[] {
  const weak = sections
    .filter((s) => !s.passed)
    .sort((a, b) => b.pointsShort - a.pointsShort);

  const tips: Record<StepSectionId, string> = {
    reading: "Reading — vocabulary in context questions (your weakest area)",
    structure: "Structure — complete 20 grammar drills daily",
    listening: "Listening — practice 3 recordings per day",
    compositional_analysis:
      "Compositional — punctuation and sentence-combining drills",
  };

  if (weak.length === 0) {
    return [
      "Review your incorrect answers and retake a timed mini-mock before your next attempt.",
    ];
  }

  return weak.slice(0, 3).map((s) => tips[s.id]);
}
