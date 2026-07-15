export type Band =
  | 4.0
  | 4.5
  | 5.0
  | 5.5
  | 6.0
  | 6.5
  | 7.0
  | 7.5
  | 8.0;

export type Section =
  | "vocabulary"
  | "grammar"
  | "reading"
  | "writing_prompt"
  | "listening";

export type QuestionType =
  | "mcq"
  | "fill_blank"
  | "error_correction"
  | "open_writing";

export type Question = {
  id: string;
  section: Section;
  band: Band;
  type: QuestionType;
  question: string;
  options?: string[];
  correct: string;
  explanation: string;
  saudiTrap?: string;
  topic: string;
  /** Listening-only: spoken transcript for TTS playback */
  audioScript?: string;
  /** GT placement letter — shown with beginAs / bullets UI */
  letterPrompt?: {
    letterType: "formal" | "semi_formal" | "informal";
    situation: string;
    writeTo: string;
    bulletPoints: string[];
    beginAs: string;
  };
};

export type Answer = {
  questionId: string;
  section: string;
  band: number;
  correct: boolean;
  timeTaken: number;
};

export type TestState = {
  currentBand: number;
  confidence: number;
  answeredIds: string[];
  answers: Answer[];
  sectionScores: Record<string, number>;
  questionsAsked: number;
  maxQuestions: number;
  speakingCompleted: boolean;
  ieltsModule: "academic" | "general_training";
};

export type PlacementResult = {
  overallBand: number;
  cefr: string;
  skillBands: Record<string, number>;
  weakAreas: string[];
  strongAreas: string[];
  recommendedCourse: string;
  confidenceScore: number;
  totalQuestions: number;
  timeSpent: number;
};

export type WritingScore = {
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  overallBand: number;
  feedback: string;
  saudiSpecificErrors: string[];
  improvedSentence?: string;
};

export type SpeakingScore = {
  fluency: number;
  lexicalResource: number;
  grammaticalRange: number;
  pronunciation: number;
  overallBand: number;
  feedback: string;
  saudiSpecificErrors: string[];
  improvedSentence?: string;
};

export const PLACEMENT_BANDS: Band[] = [
  4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0,
];

export const PLACEMENT_SECTIONS: Section[] = [
  "vocabulary",
  "grammar",
  "reading",
  "writing_prompt",
  "listening",
];
