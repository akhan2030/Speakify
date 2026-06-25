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
  type: "form" | "note" | "mcq" | "summary" | "matching" | "matching-features";
  prompt: string;
  options?: string[];
  correct: string;
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

export type SpeakingPart = {
  part: 1 | 2 | 3;
  prepSeconds?: number;
  answerSeconds: number;
  questions: string[];
  cueCard?: { topic: string; bullets: string[] };
};
