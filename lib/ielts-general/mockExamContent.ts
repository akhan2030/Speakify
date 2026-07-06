import { getFullGtReadingTest, type GtReadingPassage, type GtReadingQuestion } from "./readingContent";
import {
  GENERAL_LETTER_QUESTIONS,
  GENERAL_TASK2_QUESTIONS,
  LETTER_TYPE_LABELS,
  type GeneralLetterQuestion,
  type GeneralTask2Question,
} from "./writingTaskData";
import type { MockExamContent, ReadingPassage, ReadingQuestion } from "@/lib/mock-test/types";

export const GENERAL_EXAM_CONTENT = {
  listening: { ready: true },
  reading: { ready: true },
  writing: { ready: true },
  speaking: { ready: true },
} as const;

function mapQuestionKind(type: string): string {
  if (type === "true_false_not_given") return "true-false-not-given";
  if (type === "multiple_choice" || type === "matching_features") return "multiple-choice";
  return "short-answer";
}

function mapQuestionLabel(type: string): string {
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function toReadingQuestion(q: GtReadingQuestion): ReadingQuestion {
  const kind = mapQuestionKind(q.type);
  const base: ReadingQuestion = {
    id: q.id,
    globalNumber: q.number,
    kind,
    typeLabel: mapQuestionLabel(q.type),
    text: q.question,
    correct: q.answer,
  };

  if (kind === "multiple-choice" && q.options?.length) {
    base.options = q.options.map((opt) => ({ key: opt, label: opt }));
  }

  if (kind === "true-false-not-given") {
    base.correct = q.answer.toUpperCase().replace("NOTGIVEN", "NOT GIVEN");
  }

  return base;
}

function passageToReadingPassage(
  passage: GtReadingPassage,
  index: number,
  startNumber: number,
  endNumber: number
): ReadingPassage {
  return {
    id: passage.id,
    index: index + 1,
    title: passage.title,
    difficulty: `Section ${passage.section}${passage.saudiContext ? " · Saudi context" : ""}`,
    paragraphs: [
      {
        id: `${passage.id}_body`,
        label: "",
        text: passage.text,
      },
    ],
    questions: passage.questions.map(toReadingQuestion),
    startNumber,
    endNumber,
  };
}

export function getGeneralMockExamContent(): MockExamContent {
  const bundle = getFullGtReadingTest();
  let idx = 0;
  const passages: ReadingPassage[] = bundle.passages.map((p) => {
    const start = p.questions[0]?.number ?? idx + 1;
    const end = p.questions[p.questions.length - 1]?.number ?? start;
    idx += 1;
    return passageToReadingPassage(p, idx - 1, start, end);
  });

  return {
    version: 1,
    generatedAt: "gt-static",
    reading: {
      passages,
      totalQuestions: bundle.questions.length,
    },
  };
}

export type GeneralMockWritingTask1 = {
  id: string;
  title: string;
  prompt: string;
  minWords: number;
  letter: GeneralLetterQuestion;
};

export type GeneralMockWritingTask2 = {
  id: string;
  title: string;
  prompt: string;
  minWords: number;
  essay: GeneralTask2Question;
};

export function pickGeneralMockWritingTasks(mockNumber = 1): {
  task1: GeneralMockWritingTask1;
  task2: GeneralMockWritingTask2;
} {
  const n = Math.max(1, mockNumber);
  const letter =
    GENERAL_LETTER_QUESTIONS[(n - 1) % GENERAL_LETTER_QUESTIONS.length];
  const essay =
    GENERAL_TASK2_QUESTIONS[(n - 1) % GENERAL_TASK2_QUESTIONS.length];

  return {
    task1: {
      id: "gt-write-task1",
      title: "Task 1 — Letter",
      prompt: letter.prompt,
      minWords: 150,
      letter,
    },
    task2: {
      id: "gt-write-task2",
      title: "Task 2 — Essay",
      prompt: essay.prompt,
      minWords: 250,
      essay,
    },
  };
}

export { LETTER_TYPE_LABELS };
