import type { Task1Question } from "@/lib/ielts/writingTaskData";
import type { WritingTaskDef } from "./types";

/** Build a mock Writing Task 1 from a validated practice-bank question (with real visual). */
export function writingTask1FromQuestion(
  question: Task1Question,
  taskId: string
): WritingTaskDef {
  return {
    id: taskId,
    title: "Task 1",
    prompt: question.prompt,
    minWords: 150,
    task1Visual: question,
  };
}
