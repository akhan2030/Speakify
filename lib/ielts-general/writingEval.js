import { evaluateGeneralWritingStructured } from "@/lib/ielts-general/structuredGtWritingEval";

export async function evaluateGeneralWriting(input: {
  essay: string;
  taskType: "task1" | "task2";
  letterType?: string;
  questionPrompt?: string;
  essayType?: string;
}) {
  return evaluateGeneralWritingStructured(input);
}
