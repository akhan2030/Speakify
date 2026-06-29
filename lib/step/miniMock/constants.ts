export const MINI_MOCK_TOTAL_QUESTIONS = 20;
export const MINI_MOCK_TIME_SECONDS = 25 * 60;
export const MINI_MOCK_SECTION_COUNTS = [5, 5, 5, 5] as const;
export const MINI_MOCK_SECTION_NAMES = [
  "Reading Comprehension",
  "Structure & Grammar",
  "Listening",
  "Compositional Analysis",
] as const;

export const MINI_SECTION_SCALE = {
  reading: 8,
  structure: 6,
  listening: 4,
  compositional_analysis: 2,
} as const;
