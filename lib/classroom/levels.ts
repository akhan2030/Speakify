/**
 * Speakify in-person classroom textbook — micro-CEFR level catalog.
 * Completely separate from the self-study LMS programme tracks.
 */

import type { ClassroomLevelCode } from "./types";

export type { ClassroomLevelCode } from "./types";

/** Narrow section keys used by the pilot unit reader content shape. */
export type ClassroomSectionType =
  | "objectives"
  | "warm_up"
  | "reading"
  | "comprehension"
  | "vocabulary"
  | "grammar"
  | "listening"
  | "speaking"
  | "writing"
  | "quiz"
  | "cultural_bridge"
  | "reflection";

export const SECTION_ORDER: ClassroomSectionType[] = [
  "objectives",
  "warm_up",
  "reading",
  "comprehension",
  "vocabulary",
  "grammar",
  "listening",
  "speaking",
  "writing",
  "quiz",
  "cultural_bridge",
  "reflection",
];

export const SECTION_LABELS: Record<ClassroomSectionType, string> = {
  objectives: "Unit Theme & Learning Objectives",
  warm_up: "Warm-Up",
  reading: "Reading Passage",
  comprehension: "Comprehension Questions",
  vocabulary: "Vocabulary Bank",
  grammar: "Grammar Focus",
  listening: "Listening Task",
  speaking: "Speaking Practice",
  writing: "Writing Task",
  quiz: "End-of-Unit Quiz",
  cultural_bridge: "Cultural Bridge",
  reflection: "Self-Reflection",
};

export interface ClassroomLevelMeta {
  code: ClassroomLevelCode;
  name: string;
  slug: string;
  orderIndex: number;
  targetWeeks: number;
  nextLevelCode: ClassroomLevelCode | null;
  /** @deprecated use orderIndex */
  sortOrder: number;
  /** @deprecated use targetWeeks */
  durationWeeks: number;
  /** Short audience hint for UI */
  targetProfile: string;
}

/** B1.1 -> b1-1, AB -> ab, A1.1 -> a1-1 */
export function levelSlugFromCode(code: string): string {
  return String(code)
    .trim()
    .toLowerCase()
    .replace(/\./g, "-");
}

/** b1-1 -> B1.1, ab -> AB, a1-1 -> A1.1 */
export function levelCodeFromSlug(slug: string): string {
  const raw = String(slug).trim().toLowerCase();
  if (!raw) return "";
  if (raw === "ab") return "AB";
  const parts = raw.split("-");
  if (parts.length === 1) {
    return parts[0].toUpperCase();
  }
  const [letterBand, micro] = parts;
  const band = letterBand.toUpperCase();
  return `${band}.${micro}`;
}

function level(
  code: ClassroomLevelCode,
  name: string,
  orderIndex: number,
  targetWeeks: number,
  nextLevelCode: ClassroomLevelCode | null,
  targetProfile: string
): ClassroomLevelMeta {
  return {
    code,
    name,
    slug: levelSlugFromCode(code),
    orderIndex,
    targetWeeks,
    nextLevelCode,
    sortOrder: orderIndex,
    durationWeeks: targetWeeks,
    targetProfile,
  };
}

export const CLASSROOM_LEVELS: ClassroomLevelMeta[] = [
  level("AB", "Absolute Beginner", 1, 6, "A1.1", "Zero English, Arabic-only background"),
  level("A1.1", "Beginner 1", 2, 6, "A1.2", "Knows alphabet, basic greetings"),
  level("A1.2", "Beginner 2", 3, 6, "A2.1", "Simple words, basic sentences"),
  level("A2.1", "Elementary 1", 4, 7, "A2.2", "Everyday survival English"),
  level("A2.2", "Elementary 2", 5, 7, "B1.1", "Simple conversations, present/past"),
  level("B1.1", "Pre-Intermediate 1", 6, 8, "B1.2", "Clear communication on familiar topics"),
  level("B1.2", "Pre-Intermediate 2", 7, 8, "B2.1", "Extended communication, opinions"),
  level("B2.1", "Intermediate 1", 8, 8, "B2.2", "Fluent on wide range of topics"),
  level("B2.2", "Intermediate 2", 9, 9, "C1.1", "Academic and professional English"),
  level("C1.1", "Upper-Intermediate 1", 10, 9, "C1.2", "Complex ideas, flexible language"),
  level("C1.2", "Upper-Intermediate 2", 11, 9, "C2.1", "Near-professional mastery"),
  level("C2.1", "Advanced 1", 12, 10, "C2.2", "Near-native, nuanced expression"),
  level("C2.2", "Advanced 2", 13, 10, null, "Full mastery, academic/literary English"),
];

export function getLevelByCode(
  code: string
): ClassroomLevelMeta | undefined {
  const normalized = String(code).trim();
  return CLASSROOM_LEVELS.find(
    (l) => l.code === normalized || l.code.toLowerCase() === normalized.toLowerCase()
  );
}

export function getLevelBySlug(
  slug: string
): ClassroomLevelMeta | undefined {
  const normalized = levelSlugFromCode(slug);
  return CLASSROOM_LEVELS.find((l) => l.slug === normalized);
}

/** @deprecated Prefer getLevelByCode */
export function getClassroomLevel(
  code: string
): ClassroomLevelMeta | undefined {
  return getLevelByCode(code) ?? getLevelBySlug(code);
}

/** Pilot B1.1 unit themes (UI placeholders until content/classroom is filled). */
export const B1_1_UNIT_THEMES: {
  unitNumber: number;
  theme: string;
  grammarFocus: string;
}[] = [
  {
    unitNumber: 1,
    theme: "Identity & Background",
    grammarFocus: "Present Simple vs Present Continuous",
  },
  {
    unitNumber: 2,
    theme: "Education & Ambition",
    grammarFocus: "Past Simple vs Past Continuous",
  },
  {
    unitNumber: 3,
    theme: "City Life & Travel",
    grammarFocus: "Future forms (will, going to, present continuous for future)",
  },
  {
    unitNumber: 4,
    theme: "Health & Habits",
    grammarFocus: "Modal verbs (should, must, have to, need to)",
  },
  {
    unitNumber: 5,
    theme: "Work & Technology",
    grammarFocus: "Present Perfect Simple (ever, never, already, yet, just)",
  },
  {
    unitNumber: 6,
    theme: "Environment & Responsibility",
    grammarFocus: "Conditional Type 1",
  },
  {
    unitNumber: 7,
    theme: "Culture & Traditions",
    grammarFocus: "Comparative and Superlative structures",
  },
  {
    unitNumber: 8,
    theme: "Plans & Decisions",
    grammarFocus: "Reported Speech (statements and questions)",
  },
];
