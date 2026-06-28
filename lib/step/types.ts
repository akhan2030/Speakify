/**
 * TypeScript schemas for STEP practice content generation and LMS storage.
 */

import type { StepSectionId } from "./examModel";

export type StepMcqOption = "A" | "B" | "C" | "D";

export type StepMcqQuestion = {
  id: string;
  section: StepSectionId;
  questionType: string;
  stem: string;
  options: Record<StepMcqOption, string>;
  correct: StepMcqOption;
  explanation: string;
  /** Display order in timed sections */
  number?: number;
  /** Reading / listening only — full passage or recording transcript */
  passageRef?: string;
  passageTitle?: string;
  transcript?: string;
  recordingId?: string;
  /** Listening only */
  recordingNumber?: number;
  difficulty?: "easy" | "medium" | "hard";
  tags?: string[];
};

export type StepReadingPassage = {
  id: string;
  paragraphs: { number: number; text: string }[];
  /** Words highlighted in bold — usually tested for meaning */
  boldTerms?: string[];
  questions: StepMcqQuestion[];
};

export type StepListeningRecording = {
  id: string;
  recordingNumber: number;
  transcript: string;
  speakers: string[];
  setting: string;
  questions: StepMcqQuestion[];
};

export type StepStructureItem = StepMcqQuestion & {
  section: "structure";
  grammarPoint?: string;
};

export type StepCompositionalItem = StepMcqQuestion & {
  section: "compositional_analysis";
  /** For identify_incorrect_underlined type */
  underlinedSegments?: Partial<Record<StepMcqOption, string>>;
};

export type StepPracticeSet = {
  id: string;
  title: string;
  section: StepSectionId;
  questionCount: number;
  timeLimitMinutes: number;
  createdAt: string;
  source: "agent" | "manual" | "imported";
  content:
    | { kind: "reading"; passages: StepReadingPassage[] }
    | { kind: "listening"; recordings: StepListeningRecording[] }
    | { kind: "structure"; items: StepStructureItem[] }
    | { kind: "compositional_analysis"; items: StepCompositionalItem[] };
};

export type StepMockExam = {
  id: string;
  title: string;
  totalQuestions: 100;
  totalMinutes: 150;
  sections: {
    reading: { passages: StepReadingPassage[] };
    structure: { items: StepStructureItem[] };
    listening: { recordings: StepListeningRecording[] };
    compositional_analysis: { items: StepCompositionalItem[] };
  };
  metadata?: {
    generationDate?: string;
    topics?: string[];
    difficulty?: string;
  };
};

export type StepKnowledgeChunk = {
  content: string;
  sourceUrl: string;
  sourceTitle?: string;
  language: "ar" | "en";
  sectionHints?: StepSectionId[];
  scrapedAt: string;
};
