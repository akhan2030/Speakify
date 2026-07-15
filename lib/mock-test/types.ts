export type MockSection = "listening" | "reading" | "writing" | "speaking";

export type MockExamPhase =
  | "loading"
  | "listening"
  | "transition"
  | "reading"
  | "writing"
  | "speaking"
  | "submitting";

export type NavigatorItem = {
  id: string;
  label: string;
  answered: boolean;
  flagged: boolean;
};

export type ListeningQuestion = {
  id: string;
  number: number;
  section: 1 | 2 | 3 | 4;
  type:
    | "form"
    | "note"
    | "table"
    | "mcq"
    | "summary"
    | "matching"
    | "matching-features"
    | "flowchart"
    | "diagram";
  prompt: string;
  options?: string[];
  tableHeaders?: string[];
  correct: string;
  /** MCQ: 1 = single letter; 2 = choose TWO */
  chooseCount?: 1 | 2;
  /**
   * Shared group id for "answers in either order" (e.g. "s2-19-20").
   * Questions in the same group are scored as a set.
   */
  eitherOrderGroup?: string;
  /** Optional note/form subheading */
  subheading?: string;
};

export type ListeningSectionContent = {
  section: 1 | 2 | 3 | 4;
  title: string;
  subtitle: string;
  transcript: string;
  voice: string;
  questions: ListeningQuestion[];
};

export type ReadingPassage = {
  id: string;
  index: number;
  title: string;
  difficulty: string;
  paragraphs: { id: string; label: string; text: string }[];
  questions: ReadingQuestion[];
  startNumber: number;
  endNumber: number;
};

export type ReadingQuestion = {
  id: string;
  globalNumber: number;
  kind: string;
  typeLabel: string;
  text: string;
  correct?: string;
  options?: { key: string; label: string }[];
  headings?: { key: string; label: string }[];
  wordBank?: string[];
};

export type MockExamContent = {
  version: 1;
  reading: { passages: ReadingPassage[]; totalQuestions: number };
  generatedAt: string;
};

import type { Task1Question } from "@/lib/ielts/writingTaskData";

export type WritingTaskDef = {
  id: string;
  title: string;
  prompt: string;
  minWords: number;
  /** Full Task 1 visual (table, bar chart, line graph, pie, map, process). */
  task1Visual?: Task1Question;
  /** @deprecated Legacy bar-only payload — use task1Visual instead. */
  chartData?: {
    title: string;
    countries: string[];
    years: number[];
    values: number[][];
  };
};

import type { ListeningExamPart } from "./listeningExam";

export type AcademicMockBundle = {
  mockNumber: number;
  generatedMockTestId?: number | null;
  topic?: string | null;
  reading: MockExamContent;
  listening: ListeningExamPart[];
  writing: { task1: WritingTaskDef; task2: WritingTaskDef };
  speaking: SpeakingPart[];
};

export type SpeakingPart = {
  part: 1 | 2 | 3;
  prepSeconds?: number;
  answerSeconds: number;
  questions: string[];
  cueCard?: { topic: string; bullets: string[] };
};
