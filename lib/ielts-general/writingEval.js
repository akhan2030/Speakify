import OpenAI from "openai";
import {
  normalizeCriterionScore,
  calculateWritingOverallBand,
} from "../ielts/writingBandScore.js";
import { LETTER_TYPE_LABELS } from "./writingTaskData";

function assertEnv() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
}

function countWords(text) {
  return String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function extractScoresFromText(text) {
  const ta = text.match(/TA\s*:\s*([0-9]+(?:\.[05])?)\s*\/\s*9/i)?.[1];
  const cc = text.match(/CC\s*:\s*([0-9]+(?:\.[05])?)\s*\/\s*9/i)?.[1];
  const lr = text.match(/LR\s*:\s*([0-9]+(?:\.[05])?)\s*\/\s*9/i)?.[1];
  const gra = text.match(/GRA\s*:\s*([0-9]+(?:\.[05])?)\s*\/\s*9/i)?.[1];

  const bands = {
    ta: ta != null ? normalizeCriterionScore(Number(ta)) : null,
    cc: cc != null ? normalizeCriterionScore(Number(cc)) : null,
    lr: lr != null ? normalizeCriterionScore(Number(lr)) : null,
    gra: gra != null ? normalizeCriterionScore(Number(gra)) : null,
    overall: null,
  };

  bands.overall = calculateWritingOverallBand(bands.ta, bands.cc, bands.lr, bands.gra);
  return bands;
}

function buildLetterPrompt(questionPrompt, letterType, studentText) {
  const tone = LETTER_TYPE_LABELS[letterType] ?? letterType;
  return `You are a certified IELTS General Training Writing examiner.

Evaluate this IELTS General Training Writing Task 1 LETTER.
This is NOT an Academic Task 1 graph/chart report.

Letter type required: ${tone}
Task prompt:
${questionPrompt}

Student letter (${countWords(studentText)} words):
${studentText}

Use IELTS General Training Task 1 letter criteria. Assess:
- TA (Task Achievement): all bullet points addressed, appropriate tone/register, clear purpose
- CC (Coherence & Cohesion): logical organisation, paragraphing, linking
- LR (Lexical Resource): range and accuracy of vocabulary for the letter context
- GRA (Grammatical Range & Accuracy)

OUTPUT FORMAT (follow exactly):
Overall Band: X.X
TA: X/9
CC: X/9
LR: X/9
GRA: X/9

Task Achievement:
(2-4 bullet points)

Coherence and Cohesion:
(2-4 bullet points)

Lexical Resource:
(2-4 bullet points)

Grammatical Range and Accuracy:
(2-4 bullet points)

Tone & Register:
(one short paragraph on whether the letter matches a ${tone.toLowerCase()} letter)

Priority Improvements:
1. ...
2. ...
3. ...`;
}

function buildEssayPrompt(questionPrompt, essayType, studentText) {
  return `You are a certified IELTS General Training Writing examiner.

Evaluate this IELTS General Training Writing Task 2 ESSAY.
This is a discursive essay — NOT a letter and NOT a graph report.

Essay type: ${essayType ?? "General Training essay"}
Task prompt:
${questionPrompt}

Student essay (${countWords(studentText)} words):
${studentText}

Use standard IELTS General Training Writing Task 2 criteria.

OUTPUT FORMAT (follow exactly):
Overall Band: X.X
TA: X/9
CC: X/9
LR: X/9
GRA: X/9

Task Achievement:
(2-4 bullet points)

Coherence and Cohesion:
(2-4 bullet points)

Lexical Resource:
(2-4 bullet points)

Grammatical Range and Accuracy:
(2-4 bullet points)

Priority Improvements:
1. ...
2. ...
3. ...`;
}

export async function evaluateGeneralWriting({
  essay,
  taskType,
  letterType,
  questionPrompt,
  essayType,
}) {
  assertEnv();

  if (taskType !== "task1" && taskType !== "task2") {
    throw new Error('taskType must be "task1" or "task2"');
  }

  const trimmed = String(essay ?? "").trim();
  if (!trimmed) {
    throw new Error("Response is empty");
  }

  const minWords = taskType === "task1" ? 150 : 250;
  if (countWords(trimmed) < minWords) {
    throw new Error(`Response must be at least ${minWords} words`);
  }

  const prompt =
    taskType === "task1"
      ? buildLetterPrompt(
          questionPrompt || "Write a letter responding to the situation.",
          letterType || "formal",
          trimmed
        )
      : buildEssayPrompt(questionPrompt || "Write an essay.", essayType, trimmed);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: process.env.OPENAI_WRITING_MODEL || "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are an IELTS General Training writing examiner. Score using whole or half bands only. Never evaluate as an Academic graph report.",
      },
      { role: "user", content: prompt },
    ],
  });

  const evaluation = completion.choices[0]?.message?.content?.trim() || "";
  const bands = extractScoresFromText(evaluation);

  return { evaluation, bands, taskType, examVariant: "general" };
}
