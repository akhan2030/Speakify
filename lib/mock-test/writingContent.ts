import { getTask1PromptById } from "@/lib/ielts/writingTaskData";
import { writingTask1FromQuestion } from "./academicWritingTask1";

const HOUSING_TASK1 = getTask1PromptById("housing-england-wales");
if (!HOUSING_TASK1) {
  throw new Error("Default Academic Writing Task 1 prompt missing: housing-england-wales");
}

export const WRITING_TASK1 = writingTask1FromQuestion(HOUSING_TASK1, "write-task1");

export const WRITING_TASK2 = {
  id: "write-task2",
  title: "Task 2",
  prompt: `Some people believe that technology has made human communication less meaningful. Others disagree.

Discuss both views and give your own opinion.

Write at least 250 words.`,
  minWords: 250,
};
