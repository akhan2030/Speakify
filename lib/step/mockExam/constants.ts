import type { StepSectionId } from "../examModel";

export const MOCK_TOTAL_QUESTIONS = 100;
export const MOCK_TIME_SECONDS = 150 * 60;

export const MOCK_SECTION_ORDER: StepSectionId[] = [
  "reading",
  "structure",
  "listening",
  "compositional_analysis",
];

export const MOCK_SECTION_NAMES = [
  "Reading Comprehension",
  "Structure & Grammar",
  "Listening",
  "Compositional Analysis",
] as const;

export const MOCK_SECTION_COUNTS = [40, 30, 20, 10] as const;

export const MOCK_SECTION_MAX = {
  reading: 40,
  structure: 30,
  listening: 20,
  compositional_analysis: 10,
} as const;

export const MOCK_SECTION_MINUTES = [54, 40, 27, 14] as const;

export const MOCK_SECTION_WEIGHTS = ["40%", "30%", "20%", "10%"] as const;

export function sectionIndex(section: StepSectionId): number {
  return MOCK_SECTION_ORDER.indexOf(section);
}

export function sectionIdFromIndex(index: number): StepSectionId {
  return MOCK_SECTION_ORDER[index] ?? "reading";
}
