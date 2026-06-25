export const PART1_QUESTIONS = [
  "Describe your hometown.",
  "What do you enjoy studying?",
  "Talk about a skill you want to improve.",
] as const;

export type Part2Cue = {
  topic: string;
  bullets: string[];
};

export const PART2_CUE: Part2Cue = {
  topic: "Describe a goal you want to achieve",
  bullets: [
    "what the goal is",
    "why it is important to you",
    "what you are doing to reach it",
    "how you will feel when you achieve it",
  ],
};

export function usePart2Cue(currentBand: number) {
  return currentBand >= 6;
}
