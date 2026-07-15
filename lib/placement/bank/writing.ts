import type { Question } from "../types";

import type { PlacementIeltsModule } from "../onboarding";

export const WRITING_QUESTION_ORDER = [
  "write-task1-data",
  "write-task2-opinion",
] as const;

export const PLACEMENT_GT_LETTER = {
  letterType: "semi_formal" as const,
  situation:
    "You are a member of a sports centre in Jeddah. The swimming pool has been closed for three weeks without notice, and staff have been unhelpful when you asked for information.",
  writeTo: "the manager of the sports centre",
  bulletPoints: [
    "say how long you have been a member",
    "explain the problem and how it affects you",
    "say what you would like the manager to do",
  ],
  beginAs: "Dear Mr Khan,",
};

const WRITING_PROMPTS: Question[] = [
  {
    id: "write-task1-data",
    section: "writing_prompt",
    band: 5.0,
    type: "open_writing",
    question:
      "The bar chart below shows the number of international tourists visiting the United Kingdom from 2019 to 2023.\n\nSummarise the information by selecting and reporting the main features.\n\nWrite 2–3 sentences describing the main trend. (40–50 words)",
    correct: "N/A",
    explanation:
      "AI scoring rubric: TA: mention the 2020 fall and recovery by 2023. CC: 2–3 clear sentences with simple linking. LR: tourism/data vocabulary (million, fell, recovered). GRA: past simple. Band 5 Academic Task 1 style.",
    topic: "tourism",
  },
  {
    id: "write-task1-letter",
    section: "writing_prompt",
    band: 5.0,
    type: "open_writing",
    question:
      "Write the opening 2–3 sentences of your letter (40–50 words). You do not need to write the full letter or any addresses.",
    correct: "N/A",
    explanation:
      "AI scoring rubric: TA: identifies the problem (pool closure), appropriate semi-formal tone to a manager. CC: 2–3 cohesive opening sentences. LR: letter vocabulary (membership, closure, enquiry). GRA: accurate simple/compound sentences. Band 5 GT Task 1 letter style.",
    topic: "letter",
    letterPrompt: PLACEMENT_GT_LETTER,
  },
  {
    id: "write-task2-opinion",
    section: "writing_prompt",
    band: 5.5,
    type: "open_writing",
    question:
      "Some people believe that university education is essential for success, while others think work experience is more valuable.\n\nWrite 2–3 sentences giving your opinion. (40–50 words)",
    correct: "N/A",
    explanation:
      "AI scoring rubric: TA: clear opinion on the topic. CC: 2–3 cohesive sentences. LR: education/career vocabulary. GRA: varied simple and compound sentences. Band 5.5 Task 2 style.",
    topic: "education",
  },
];

export function buildWritingQuestions(): Question[] {
  return WRITING_PROMPTS;
}

export function placementTask1QuestionId(module: PlacementIeltsModule): string {
  return module === "general_training" ? "write-task1-letter" : "write-task1-data";
}

export function getWritingTaskLabel(questionId: string): string | null {
  if (questionId === "write-task1-data") return "Task 1 — Chart / Graph";
  if (questionId === "write-task1-letter") return "Task 1 — Letter";
  if (questionId === "write-task2-opinion") return "Task 2 — Opinion";
  return null;
}
