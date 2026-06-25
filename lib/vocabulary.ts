export const DEFAULT_CEFR_LEVEL = "B1.1";

export const CEFR_LEVELS = [
  "A1.1",
  "A1.2",
  "A1.3",
  "A1.4",
  "A2.1",
  "A2.2",
  "A2.3",
  "A2.4",
  "B1.1",
  "B1.2",
  "B2.1",
  "B2.2",
  "C1.1",
  "C1.2",
  "C2.1",
  "C2.2",
] as const;

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
      return 0;
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

export function addDaysToDateKey(dateKey: string, days: number) {
  const base = new Date(`${dateKey}T12:00:00.000Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export const VOCAB_STORAGE_KEY = "speakify_vocab_cefr_level";
