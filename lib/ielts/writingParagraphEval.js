import OpenAI from "openai";
import { getGuidedSteps } from "./writingGuidedMode";
import {
  WRITING_PROMPTS,
  promptKeyForStep,
  substitutePromptVariables,
  isFinalParagraphStep,
} from "./writingPromptLibrary";
import {
  normalizeCriterionScore,
  calculateWritingOverallBand,
  roundIeltsWritingBand,
} from "./writingBandScore.js";

function assertEnv() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set");
  }
}

function parseJson(raw, fallback = {}) {
  try {
    return JSON.parse(raw);
  } catch {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

function normalizeBandField(value) {
  if (value == null || value === "") return null;
  return normalizeCriterionScore(Number(value));
}

function paragraphBandFromCriteria(bands, focusCriteria) {
  const scores = focusCriteria
    .map((c) => {
      const key = c.toLowerCase();
      if (key === "ta" || key === "tr") return bands.ta;
      if (key === "cc") return bands.cc;
      if (key === "lr") return bands.lr;
      if (key === "gra") return bands.gra;
      return null;
    })
    .filter((v) => v != null && Number.isFinite(v));

  if (!scores.length) return null;
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  return roundIeltsWritingBand(avg);
}

export function normalizeParagraphEvalJson(parsed, focusCriteria, isFinal = false) {
  const bands = {
    ta: normalizeBandField(parsed.ta),
    cc: normalizeBandField(parsed.cc),
    lr: normalizeBandField(parsed.lr),
    gra: normalizeBandField(parsed.gra),
    overall: null,
  };

  let paragraphBand =
    normalizeBandField(parsed.paragraphBand) ??
    paragraphBandFromCriteria(bands, focusCriteria);

  if (isFinal) {
    const ta = bands.ta ?? normalizeBandField(parsed.ta);
    const cc = bands.cc ?? normalizeBandField(parsed.cc);
    const lr = bands.lr ?? normalizeBandField(parsed.lr);
    const gra = bands.gra ?? normalizeBandField(parsed.gra);
    bands.ta = ta;
    bands.cc = cc;
    bands.lr = lr;
    bands.gra = gra;
    bands.overall =
      normalizeBandField(parsed.overallBand) ??
      calculateWritingOverallBand(ta, cc, lr, gra);
  }

  return {
    bands,
    paragraphBand,
    feedback: {
      taskAchievement: String(
        parsed.taskResponse ?? parsed.taskAchievement ?? ""
      ).trim(),
      coherenceCohesion: String(parsed.coherenceCohesion ?? "").trim(),
      lexicalResource: String(parsed.lexicalResource ?? "").trim(),
      grammaticalRange: String(parsed.grammaticalRange ?? "").trim(),
      strengths: String(parsed.strengths ?? "").trim(),
      priorityFix: String(parsed.priorityFix ?? "").trim(),
      modelSentence: String(parsed.modelSentence ?? "").trim(),
      fullResponseSummary: String(parsed.fullResponseSummary ?? "").trim(),
      nextSteps: String(parsed.nextSteps ?? "").trim(),
    },
  };
}

export async function evaluateWritingParagraph({
  taskType,
  stepIndex,
  paragraphText,
  questionPrompt,
  visualType,
  essayType,
  p1Text = "",
  p2Text = "",
  p3Text = "",
}) {
  assertEnv();

  if (taskType !== "task1" && taskType !== "task2") {
    throw new Error('taskType must be "task1" or "task2"');
  }
  if (!paragraphText?.trim()) {
    throw new Error("paragraphText must be a non-empty string");
  }

  const steps = getGuidedSteps(taskType);
  const step = steps[stepIndex];
  if (!step) {
    throw new Error(`Invalid stepIndex ${stepIndex} for ${taskType}`);
  }

  const promptKey = promptKeyForStep(taskType, stepIndex);
  const template = WRITING_PROMPTS[promptKey];
  const isFinal = isFinalParagraphStep(taskType, stepIndex);

  const prompt = substitutePromptVariables(template, {
    visualType,
    essayType,
    questionPrompt,
    studentText: paragraphText.trim(),
    p1Text: p1Text.trim(),
    p2Text: p2Text.trim(),
    p3Text: p3Text.trim(),
  });

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content:
          "You are the Speakify IELTS Writing AI examiner. Respond with valid JSON only.",
      },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
  });

  const raw = completion.choices[0]?.message?.content?.trim() || "{}";
  const parsed = parseJson(raw, {});
  const result = normalizeParagraphEvalJson(parsed, step.focusCriteria, isFinal);

  return {
    promptKey,
    stepId: step.id,
    stepLabel: step.label,
    paragraphNumber: stepIndex + 1,
    isFinal,
    ...result,
  };
}

export function combineGuidedParagraphs(paragraphs) {
  return paragraphs.map((p) => p.trim()).filter(Boolean).join("\n\n");
}
