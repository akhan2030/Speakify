export const DEFAULT_CEFR_LEVEL = "B1.1";

/** Official Speakify CEFR sub-levels (vocabulary & pathway). */
export const SPEAKIFY_CEFR_LEVELS = [
  "A1.1",
  "A1.2",
  "A2.1",
  "A2.2",
  "B1.1",
  "B1.2",
  "B2.1",
  "B2.2",
  "C1.1",
  "C1.2",
  "C2.1",
  "C2.2",
] as const;

export type SpeakifyCefrLevel = (typeof SPEAKIFY_CEFR_LEVELS)[number];

/** @deprecated Use SPEAKIFY_CEFR_LEVELS — kept for existing imports. */
export const CEFR_LEVELS = SPEAKIFY_CEFR_LEVELS;

/** Legacy invalid levels → nearest official Speakify level (vocabulary only). */
export const INVALID_CEFR_LEVEL_REMAP: Record<string, SpeakifyCefrLevel> = {
  "A1.3": "A1.2",
  "A1.4": "A1.2",
  "A2.3": "A2.2",
  "A2.4": "A2.2",
};

/** Level-specific vocabulary bank themes (Speakify ecosystem). */
export const VOCAB_LEVEL_BANKS: Record<SpeakifyCefrLevel, string> = {
  "A1.1": "basic greetings, names, classroom words, numbers, countries, simple daily words",
  "A1.2": "family, routines, food, time, places, simple descriptions",
  "A2.1": "travel, shopping, health, hobbies, directions, everyday services",
  "A2.2": "work, study, technology, opinions, plans, comparisons",
  "B1.1": "experiences, education, environment, social life, problems and solutions",
  "B1.2": "work communication, culture, media, future goals, opinions and explanations",
  "B2.1": "academic topics, abstract ideas, argument vocabulary, cause/effect, global issues",
  "B2.2": "advanced discussion, critical thinking, formal writing, debate language",
  "C1.1": "professional, academic, legal, business, complex argument vocabulary",
  "C1.2": "advanced fluency, idioms, nuance, precision, high-level academic/professional language",
  "C2.1":
    "advanced academic vocabulary, nuanced argument language, high-level formal expressions, complex discourse markers, sophisticated abstract vocabulary, professional and academic precision",
  "C2.2":
    "near-native vocabulary control, idiomatic and figurative language, subtle register differences, advanced collocations, rhetoric and persuasion language, expert-level academic, legal, and professional vocabulary",
};

export function isSpeakifyCefrLevel(value: string): value is SpeakifyCefrLevel {
  return (SPEAKIFY_CEFR_LEVELS as readonly string[]).includes(value);
}

/** Normalize any stored/filter value to an official Speakify level. */
export function normalizeSpeakifyCefrLevel(
  raw: string | null | undefined
): SpeakifyCefrLevel {
  if (!raw?.trim()) return DEFAULT_CEFR_LEVEL;

  const cleaned = raw.trim();
  const canonical =
    cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();

  if (isSpeakifyCefrLevel(canonical)) return canonical;

  const remapped = INVALID_CEFR_LEVEL_REMAP[canonical];
  if (remapped) return remapped;

  return DEFAULT_CEFR_LEVEL;
}

export const IELTS_SKILLS = [
  "Writing Task 1",
  "Writing Task 2",
  "Speaking Part 1",
  "Speaking Part 2",
  "Speaking Part 3",
] as const;

export const BAND_FILTERS = [
  { id: "5.0-5.5", label: "5.0–5.5", match: ["5.0", "5.0-5.5", "5.0–5.5"] },
  { id: "6.0-6.5", label: "6.0–6.5", match: ["6.0", "6.0-6.5", "6.0–6.5", "6.5"] },
  { id: "7.0-7.5", label: "7.0–7.5", match: ["7.0", "7.0-7.5", "7.0–7.5", "7.5"] },
  { id: "8.0+", label: "8.0+", match: ["8.0", "8.0+", "8.0–8.5", "8.5", "9.0"] },
] as const;

export type VocabRating = "again" | "hard" | "good" | "easy";

export type VocabularyWord = {
  id: string;
  word: string;
  cefr_level: string;
  part_of_speech: string | null;
  definition: string;
  definition_arabic: string;
  pronunciation_ipa: string;
  example_sentence: string;
  ielts_example: string | null;
  memory_hook: string | null;
  topic_category: string | null;
  audio_url: string | null;
  synonyms: string[];
};

export type IeltsPhrase = {
  id: string;
  phrase: string;
  skill: string;
  function: string;
  band_level: string;
  example_sentence: string;
  avoid_phrase: string | null;
  memory_hook: string | null;
};

export function todayDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayBounds(dateKey = todayDateKey()) {
  return {
    start: `${dateKey}T00:00:00.000Z`,
    end: `${dateKey}T23:59:59.999Z`,
  };
}

export function ratingToInterval(rating: VocabRating): number {
  switch (rating) {
    case "again":
      return 1;
    case "hard":
      return 1;
    case "good":
      return 3;
    case "easy":
      return 7;
    default:
      return 1;
  }
}

/** Recommended core bank size per Speakify sub-level (Layer 1). */
export const VOCAB_CORE_TARGETS: Record<SpeakifyCefrLevel, number> = {
  "A1.1": 400,
  "A1.2": 400,
  "A2.1": 650,
  "A2.2": 650,
  "B1.1": 1250,
  "B1.2": 1250,
  "B2.1": 2000,
  "B2.2": 2000,
  "C1.1": 2500,
  "C1.2": 2500,
  "C2.1": 3000,
  "C2.2": 3000,
};

export const VOCAB_SESSION_SIZE = 10;
export const VOCAB_CORE_MASTERY_THRESHOLD = 0.8;
export const VOCAB_AI_TOPUP_BATCH_SIZE = 50;

export type WordSource = "core" | "ai_personal";

export function addDaysToDateKey(dateKey: string, days: number) {
  const base = new Date(`${dateKey}T12:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export const VOCAB_STORAGE_KEY = "speakify_vocab_cefr_level";
