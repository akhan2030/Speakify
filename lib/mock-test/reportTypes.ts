export type SkillCardBase = {
  band: number;
  meaning: string;
  strengths: string[];
  weaknesses: string[];
  priority: string;
  examinerReport: string;
};

export type SectionBreakdown = {
  label: string;
  correct: number;
  total: number;
  accuracy: number;
  band?: number;
};

export type WritingCriteria = {
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
};

export type WritingDetail = SkillCardBase & {
  task1Band: number;
  task2Band: number;
  task1Criteria: WritingCriteria;
  task2Criteria: WritingCriteria;
  task1Text: string;
  task2Text: string;
  task1Feedback: string;
  task2Feedback: string;
  annotatedFeedback: string;
  writingHighlights: { phrase: string; type: "good" | "weak" }[];
};

export type SpeakingPartTranscript = {
  part: string;
  label: string;
  text: string;
};

export type SpeakingDetail = SkillCardBase & {
  fluency: number;
  lexicalResource: number;
  grammaticalRange: number;
  pronunciation: number;
  transcript: string;
  partTranscripts: SpeakingPartTranscript[];
  strongPhrases: string[];
  weakPhrases: string[];
};

export type ListeningDetail = SkillCardBase & {
  accuracy: number;
  correct: number;
  total: number;
  sectionBreakdown: SectionBreakdown[];
  strongestQuestionType: string;
  weakestQuestionType: string;
};

export type ReadingDetail = SkillCardBase & {
  accuracy: number;
  correct: number;
  total: number;
  passageBreakdown: SectionBreakdown[];
};

export type RadarPoint = {
  skill: string;
  score: number;
};

export type ImprovementWeek = {
  week: number;
  phase: string;
  focus: string;
  resources: { label: string; href: string }[];
};

export type BandPrediction = {
  current: number;
  target: number;
  gap: number;
  progressPercent: number;
  probabilityPercent: number;
  weeksEstimate: number;
  message: string;
};

export type ExaminerReportPayload = {
  listening: string;
  reading: string;
  writing: string;
  speaking: string;
  vocabulary: { strongWords: string[]; weakPatterns: string[] };
  grammar: { structuresUsedWell: string[]; errorPatterns: string[] };
  improvementPlan: ImprovementWeek[];
};

export type MockTestFullReport = {
  version: 1;
  generatedAt: string;
  studentName: string;
  completedAt: string;
  overallBand: number;
  confidencePercent: number;
  predictedRange: { low: number; high: number };
  cefr: { level: string; label: string };
  radar: RadarPoint[];
  bandPrediction: BandPrediction;
  skills: {
    listening: ListeningDetail;
    reading: ReadingDetail;
    writing: WritingDetail;
    speaking: SpeakingDetail;
  };
  vocabulary: {
    strongWords: string[];
    weakPatterns: string[];
  };
  grammar: {
    structuresUsedWell: string[];
    errorPatterns: string[];
  };
  improvementPlan: ImprovementWeek[];
  weakAreas: string[];
  examinerReviewed: boolean;
};
