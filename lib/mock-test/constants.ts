import type { MockSection } from "./types";

export const SECTION_DURATIONS: Record<MockSection, number> = {
  listening: 30 * 60,
  reading: 60 * 60,
  writing: 60 * 60,
  speaking: 20 * 60,
};

export const WRITING_TASK1_SECONDS = 20 * 60;
export const WRITING_TASK2_SECONDS = 40 * 60;

export const TRANSITION_SECONDS = 10;
export const LISTENING_PREP_SECONDS = 30;
/** Default mid/end check look-time; Section 4 uses 60s (official transfer/check window). */
export const LISTENING_CHECK_SECONDS = 30;
export const LISTENING_SECTION4_CHECK_SECONDS = 60;

export const SECTION_ORDER: MockSection[] = [
  "listening",
  "reading",
  "writing",
  "speaking",
];

export const SECTION_LABELS: Record<MockSection, string> = {
  listening: "Listening",
  reading: "Reading",
  writing: "Writing",
  speaking: "Speaking",
};

export const EXAM_BG = "#f8f9fa";
