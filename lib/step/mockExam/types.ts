import type { StepMcqOption } from "../types";
import type { StepSectionId } from "../examModel";

export type MockExamQuestion = {
  id: string;
  section: StepSectionId;
  stem: string;
  options: Record<StepMcqOption, string>;
  correct: StepMcqOption;
  explanation: string;
  questionType?: string;
  grammarPoint?: string;
  passage?: string;
  passageId?: string;
  sentence?: string;
  transcript?: string;
  recordingId?: string;
  recordingNumber?: number;
  totalRecordings?: number;
};

export type MockExamClientQuestion = Omit<
  MockExamQuestion,
  "correct" | "explanation"
>;

export type MockExamPayload = {
  reading: MockExamClientQuestion[];
  structure: MockExamClientQuestion[];
  listening: MockExamClientQuestion[];
  compositional: MockExamClientQuestion[];
};

export type MockHistoryRow = {
  mock_number: number;
  completed_at: string;
  reading_score: number | null;
  structure_score: number | null;
  listening_score: number | null;
  compositional_score: number | null;
  total_score: number | null;
  phase: number | null;
};

export type MockResultsPayload = {
  attemptId: string;
  mockNumber: number;
  readingScore: number;
  structureScore: number;
  listeningScore: number;
  compositionalScore: number;
  totalScore: number;
  durationMinutes: number;
  phase: number;
  answers: Record<string, string>;
  questions: MockExamQuestion[];
  weakestSection: StepSectionId;
  weakestSectionName: string;
  weakestPracticePath: string;
};
