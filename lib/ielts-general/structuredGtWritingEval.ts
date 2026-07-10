import OpenAI from "openai";
import { LETTER_TYPE_LABELS } from "@/lib/ielts-general/writingTaskData";
import {
  countWritingWords,
  getWritingWordLimits,
  writingWordLimitExceededMessage,
  writingWordMinimumMessage,
} from "@/lib/ielts/writingCriteria";
import {
  GT_TASK1_SCORING_PROMPT,
  GT_TASK2_SCORING_PROMPT,
} from "@/lib/ielts-general/gtWritingScoringPrompts";
import {
  gtFeedbackToBands,
  normalizeGtStructuredFeedback,
  type GtStructuredWritingFeedback,
} from "@/lib/ielts-general/gtWritingScoringSchema";

function assertEnv() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
}

function countWords(text: string) {
  return String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export async function evaluateGeneralWritingStructured(input: {
  essay: string;
  taskType: "task1" | "task2";
  letterType?: string;
  questionPrompt?: string;
  essayType?: string;
}): Promise<{
  structuredFeedback: GtStructuredWritingFeedback;
  evaluation: string;
  bands: {
    ta: number;
    cc: number;
    lr: number;
    gra: number;
    overall: number;
  };
  taskType: "task1" | "task2";
  examVariant: "general";
}> {
  assertEnv();

  const taskType = input.taskType;
  if (taskType !== "task1" && taskType !== "task2") {
    throw new Error('taskType must be "task1" or "task2"');
  }

  const trimmed = String(input.essay ?? "").trim();
  if (!trimmed) throw new Error("Response is empty");

  const minWords = getWritingWordLimits(taskType).min;
  const maxWords = getWritingWordLimits(taskType).max;
  const wordCount = countWritingWords(trimmed);
  if (wordCount < minWords) {
    throw new Error(writingWordMinimumMessage(taskType));
  }
  if (wordCount > maxWords) {
    throw new Error(writingWordLimitExceededMessage(taskType));
  }

  const isTask1 = taskType === "task1";
  const systemPrompt = isTask1 ? GT_TASK1_SCORING_PROMPT : GT_TASK2_SCORING_PROMPT;
  const letterLabel =
    input.letterType && LETTER_TYPE_LABELS[input.letterType as keyof typeof LETTER_TYPE_LABELS]
      ? LETTER_TYPE_LABELS[input.letterType as keyof typeof LETTER_TYPE_LABELS]
      : input.letterType ?? "not specified";

  const userContent = isTask1
    ? `Letter type: ${letterLabel}
Task prompt: ${input.questionPrompt || "Write a letter responding to the situation."}
Student response (${wordCount} words):
${trimmed}`
    : `Essay type: ${input.essayType ?? "General Training essay"}
Task prompt: ${input.questionPrompt || "Write an essay."}
Student response (${wordCount} words):
${trimmed}`;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_GT_WRITING_MODEL || "gpt-4o",
    temperature: 0,
    response_format: { type: "json_object" },
    max_tokens: 1500,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContent },
    ],
  });

  const text = completion.choices[0]?.message?.content?.trim() || "";
  if (!text) throw new Error("No structured feedback returned");

  const parsed = JSON.parse(text) as unknown;
  const structuredFeedback = normalizeGtStructuredFeedback(parsed, taskType);
  if (!structuredFeedback) {
    throw new Error("Invalid structured GT writing response");
  }

  const bands = gtFeedbackToBands(structuredFeedback);

  return {
    structuredFeedback,
    evaluation: structuredFeedback.evaluation ?? "",
    bands,
    taskType,
    examVariant: "general",
  };
}
