import type { Question } from "../types";

export const WRITING_QUESTION_ORDER = [
  "write-task1-data",
  "write-task2-opinion",
] as const;

const WRITING_PROMPTS: Question[] = [
  {
    id: "write-task1-data",
    section: "writing_prompt",
    band: 5.0,
    type: "open_writing",
    question:
      "The bar chart shows the number of tourists visiting Saudi Arabia from 2019 to 2023. The figures rose from 18 million to 27 million. Write 2-3 sentences describing the main trend. (40-50 words)",
    correct: "N/A",
    explanation:
      "AI scoring rubric: TA: mention both years and the upward trend. CC: 2–3 clear sentences with simple linking. LR: tourism/data vocabulary (million, rose, increased). GRA: present/past simple. Band 5 Task 1 style.",
    topic: "Vision2030",
  },
  {
    id: "write-task2-opinion",
    section: "writing_prompt",
    band: 5.5,
    type: "open_writing",
    question:
      "Some people believe that university education is essential for success, while others think work experience is more valuable. Write 2-3 sentences giving your opinion. (40-50 words)",
    correct: "N/A",
    explanation:
      "AI scoring rubric: TA: clear opinion on the topic. CC: 2–3 cohesive sentences. LR: education/career vocabulary. GRA: varied simple and compound sentences. Band 5.5 Task 2 style.",
    topic: "education",
  },
];

export function buildWritingQuestions(): Question[] {
  return WRITING_PROMPTS;
}

export function getWritingTaskLabel(questionId: string): string | null {
  if (questionId === "write-task1-data") return "Task 1 — Data Description";
  if (questionId === "write-task2-opinion") return "Task 2 — Opinion";
  return null;
}
