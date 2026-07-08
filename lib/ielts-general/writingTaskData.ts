export type LetterType = "formal" | "semi_formal" | "informal";

export type GeneralEssayType =
  | "Opinion"
  | "Discussion"
  | "Cause & Effect"
  | "Problem & Solution"
  | "Advantages & Disadvantages"
  | "Two-Part Question";

export type GeneralLetterQuestion = {
  id: string;
  letterType: LetterType;
  label: string;
  title: string;
  summary: string;
  writeTo: string;
  situation: string;
  bulletPoints: string[];
  beginAs: string;
  prompt: string;
};

export type GeneralTask2Question = {
  id: string;
  label: string;
  essayType: GeneralEssayType;
  title: string;
  summary: string;
  prompt: string;
};

export const LETTER_TYPE_LABELS: Record<LetterType, string> = {
  formal: "Formal",
  semi_formal: "Semi-formal",
  informal: "Informal",
};

export function buildLetterPrompt(q: {
  situation: string;
  bulletPoints: string[];
  writeTo: string;
  beginAs: string;
  letterType: LetterType;
}): string {
  const bullets = q.bulletPoints.map((b) => `- ${b}`).join("\n");
  return `${q.situation}\n\nWrite a letter to ${q.writeTo}. In your letter,\n${bullets}\n\nWrite at least 150 words. You do NOT need to write any addresses.\nBegin your letter as follows:\n\n${q.beginAs}`;
}

export {
  GT_LETTER_CATEGORIES,
  GT_LETTER_PROMPT_BANK,
  GT_TASK2_CATEGORIES,
  GT_TASK2_PROMPT_BANK,
  getGtLetterById,
  getGtLettersByCategory,
  getGtTask2ByCategory,
  getGtTask2ById,
} from "./writingPromptBank";

import { GT_LETTER_PROMPT_BANK, GT_TASK2_PROMPT_BANK } from "./writingPromptBank";

/** @deprecated Use GT_LETTER_PROMPT_BANK */
export const GENERAL_LETTER_QUESTIONS = GT_LETTER_PROMPT_BANK;

/** @deprecated Use GT_TASK2_PROMPT_BANK */
export const GENERAL_TASK2_QUESTIONS = GT_TASK2_PROMPT_BANK;

const LETTER_SESSION_KEY = "ielts-general-writing-letter-id";
const TASK2_SESSION_KEY = "ielts-general-writing-task2-id";

function pickSessionPromptId(
  pool: { id: string }[],
  storageKey: string
): string | null {
  if (typeof window === "undefined" || pool.length === 0) return null;

  const stored = sessionStorage.getItem(storageKey);
  if (stored && pool.some((q) => q.id === stored)) return stored;

  const index = Math.floor(Math.random() * pool.length);
  const id = pool[index]?.id ?? pool[0].id;
  sessionStorage.setItem(storageKey, id);
  return id;
}

export function getSessionGeneralLetterQuestion() {
  const id = pickSessionPromptId(GT_LETTER_PROMPT_BANK, LETTER_SESSION_KEY);
  return GT_LETTER_PROMPT_BANK.find((q) => q.id === id) ?? GT_LETTER_PROMPT_BANK[0];
}

export function getSessionGeneralTask2Question() {
  const id = pickSessionPromptId(GT_TASK2_PROMPT_BANK, TASK2_SESSION_KEY);
  return GT_TASK2_PROMPT_BANK.find((q) => q.id === id) ?? GT_TASK2_PROMPT_BANK[0];
}

export function setGeneralLetterById(id: string): void {
  if (typeof window !== "undefined" && GT_LETTER_PROMPT_BANK.some((q) => q.id === id)) {
    sessionStorage.setItem(LETTER_SESSION_KEY, id);
  }
}

export function setGeneralTask2ById(id: string): void {
  if (typeof window !== "undefined" && GT_TASK2_PROMPT_BANK.some((q) => q.id === id)) {
    sessionStorage.setItem(TASK2_SESSION_KEY, id);
  }
}

/** @deprecated Use setGeneralLetterById */
export function setGeneralLetterQuestionIndex(index: number): void {
  const q = GT_LETTER_PROMPT_BANK[index % GT_LETTER_PROMPT_BANK.length];
  if (q) setGeneralLetterById(q.id);
}

/** @deprecated Use setGeneralTask2ById */
export function setGeneralTask2QuestionIndex(index: number): void {
  const q = GT_TASK2_PROMPT_BANK[index % GT_TASK2_PROMPT_BANK.length];
  if (q) setGeneralTask2ById(q.id);
}
