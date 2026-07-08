export type Task1VisualType = "bar" | "line" | "pie" | "table" | "map" | "process";

export type Task2EssayType =
  | "Opinion"
  | "Discussion"
  | "Problem & Solution"
  | "Advantages & Disadvantages"
  | "Two-Part Question";

export type BarChartData = {
  categories: string[];
  series: { name: string; color: string; values: number[] }[];
  yAxisLabel?: string;
};

export type LineChartData = {
  years: string[];
  series: { name: string; color: string; values: number[] }[];
  yAxisLabel?: string;
};

export type PieChartData = {
  segments: { name: string; value: number; color: string }[];
};

export type TableData = {
  headers: string[];
  rows: string[][];
};

export type MapData = {
  beforeLabel: string;
  afterLabel: string;
  beforeYear: string;
  afterYear: string;
};

export type ProcessData = {
  steps: { label: string; detail?: string }[];
};

export type Task1Question = {
  id: string;
  visualType: Task1VisualType;
  title: string;
  summary: string;
  prompt: string;
  chartTitle: string;
  bar?: BarChartData;
  line?: LineChartData;
  pie?: PieChartData;
  table?: TableData;
  map?: MapData;
  process?: ProcessData;
};

export type Task2Question = {
  id: string;
  label: string;
  essayType: Task2EssayType;
  title: string;
  summary: string;
  prompt: string;
};

export {
  TASK1_CATEGORIES,
  TASK1_PROMPT_BANK,
  TASK2_CATEGORIES,
  TASK2_PROMPT_BANK,
  getTask1PromptById,
  getTask1PromptsByCategory,
  getTask2PromptById,
  getTask2PromptsByCategory,
} from "./writingPromptBank";

import { TASK1_PROMPT_BANK, TASK2_PROMPT_BANK } from "./writingPromptBank";

/** @deprecated Use TASK1_PROMPT_BANK — kept for backward compatibility */
export const TASK1_QUESTIONS = TASK1_PROMPT_BANK;

/** @deprecated Use TASK2_PROMPT_BANK — kept for backward compatibility */
export const TASK2_QUESTIONS = TASK2_PROMPT_BANK;

const TASK1_SESSION_KEY = "ielts-writing-task1-question-id";
const TASK2_SESSION_KEY = "ielts-writing-task2-question-id";

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

export function getSessionTask1Question() {
  const id = pickSessionPromptId(TASK1_PROMPT_BANK, TASK1_SESSION_KEY);
  return TASK1_PROMPT_BANK.find((q) => q.id === id) ?? TASK1_PROMPT_BANK[0];
}

export function getSessionTask2Question() {
  const id = pickSessionPromptId(TASK2_PROMPT_BANK, TASK2_SESSION_KEY);
  return TASK2_PROMPT_BANK.find((q) => q.id === id) ?? TASK2_PROMPT_BANK[0];
}

export function setTask1QuestionById(id: string): void {
  if (typeof window !== "undefined" && TASK1_PROMPT_BANK.some((q) => q.id === id)) {
    sessionStorage.setItem(TASK1_SESSION_KEY, id);
  }
}

export function setTask2QuestionById(id: string): void {
  if (typeof window !== "undefined" && TASK2_PROMPT_BANK.some((q) => q.id === id)) {
    sessionStorage.setItem(TASK2_SESSION_KEY, id);
  }
}

/** @deprecated Use setTask1QuestionById */
export function setTask1QuestionIndex(index: number): void {
  const q = TASK1_PROMPT_BANK[index % TASK1_PROMPT_BANK.length];
  if (q) setTask1QuestionById(q.id);
}

/** @deprecated Use setTask2QuestionById */
export function setTask2QuestionIndex(index: number): void {
  const q = TASK2_PROMPT_BANK[index % TASK2_PROMPT_BANK.length];
  if (q) setTask2QuestionById(q.id);
}
