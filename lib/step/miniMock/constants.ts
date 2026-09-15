export const MINI_MOCK_TOTAL_QUESTIONS = 20;
export const MINI_MOCK_TIME_SECONDS = 25 * 60;
export const MINI_MOCK_SECTION_COUNTS = [8, 6, 4, 2] as const;
export const MINI_MOCK_SECTION_NAMES = [
  "Reading Comprehension",
  "Structure & Grammar",
  "Listening",
  "Compositional Analysis",
] as const;

export const MINI_SECTION_SCALE = {
  reading: 5,
  structure: 5,
  listening: 5,
  compositional_analysis: 5,
} as const;
