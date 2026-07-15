import type { ListeningQuestion, QuestionResult } from "@/components/ListeningQuestions";

export type ListeningSectionData = {
  title: string;
  section: number;
  topic: string;
  transcript: string;
  speakers?: { label: string; name?: string }[];
  questionType: string;
  wordLimit?: string;
  questions: ListeningQuestion[];
  example?: {
    questionText?: string;
    answerText?: string;
    answer?: string;
  } | null;
};

export type SectionScoreEntry = {
  score: number;
  total: number;
  band: number;
};

export type ListeningSubmitResult = {
  success: boolean;
  score: number;
  total: number;
  band: number;
  accuracy: number;
  wrongIndexes: number[];
  results: QuestionResult[];
  sectionScores?: Record<string, SectionScoreEntry>;
  testId?: string;
  attemptId?: number;
};

export const LISTENING_SECTION_META: Record<
  number,
  { name: string; difficulty: string; speakers: string }
> = {
  1: { name: "Conversation", difficulty: "Easiest", speakers: "2 speakers" },
  2: {
    name: "Social Monologue",
    difficulty: "Easy-Medium",
    speakers: "1 speaker",
  },
  3: {
    name: "Academic Discussion",
    difficulty: "Medium-Hard",
    speakers: "3 speakers",
  },
  4: {
    name: "Academic Lecture",
    difficulty: "Hardest",
    speakers: "Continuous lecture",
  },
};

export const MOCK_TARGET_SECONDS = 40 * 60;
