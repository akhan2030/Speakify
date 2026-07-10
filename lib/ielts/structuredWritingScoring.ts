import OpenAI from "openai";
import {
  activeWritingCriteria,
  normalizeStructuredWritingScore,
  WRITING_ERROR_TYPES,
  type StructuredWritingScore,
} from "@/lib/ielts/writingScoringSchema";

const SYSTEM_PROMPT = `You are a senior IELTS Writing examiner. Score the essay using official band descriptors.

Return ONLY valid JSON:
{
  "overall_band": 6.5,
  "criteria": {
    "task_achievement" OR "task_response": {
      "band": 6.0,
      "weight": 0.25,
      "deductions": [
        {
          "reason": "short label",
          "evidence": "exact quote from the student's essay",
          "band_impact": 0.5,
          "error_type": "repetitive_vocabulary"
        }
      ],
      "strengths": ["optional"]
    },
    "coherence_cohesion": { "band": 6.0, "weight": 0.25, "deductions": [], "strengths": [] },
    "lexical_resource": { "band": 6.0, "weight": 0.25, "deductions": [], "strengths": [] },
    "grammatical_range_accuracy": { "band": 6.0, "weight": 0.25, "deductions": [], "strengths": [] }
  }
}

Rules:
- Task 1 uses task_achievement (not task_response). Task 2 uses task_response (not task_achievement).
- Every deduction MUST quote real evidence from the essay — never invent text.
- error_type must be one of: ${WRITING_ERROR_TYPES.join(", ")}
- band_impact is a positive number (0.25–0.5 typical); do not overpromise.
- overall_band = mean of four criterion bands rounded to nearest 0.5.`;

export async function runStructuredWritingScoring(input: {
  openai: OpenAI;
  essay: string;
  taskType: "task1" | "task2";
  questionPrompt?: string | null;
}): Promise<StructuredWritingScore | null> {
  const essay = String(input.essay ?? "").trim();
  if (!essay) return null;

  const criteriaKeys = activeWritingCriteria(input.taskType);
  const taskLabel = input.taskType === "task1" ? "Task 1" : "Task 2";

  const userContent = [
    `Task: IELTS Academic Writing ${taskLabel}`,
    input.questionPrompt ? `Prompt: ${input.questionPrompt}` : null,
    `Required criteria keys: ${criteriaKeys.join(", ")}`,
    "---",
    essay,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const response = await input.openai.chat.completions.create({
      model: process.env.OPENAI_WRITING_SCORE_MODEL || "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    const text = response.choices[0]?.message?.content ?? "";
    if (!text.trim()) return null;

    const parsed = JSON.parse(text) as unknown;
    return normalizeStructuredWritingScore(parsed, input.taskType);
  } catch (err) {
    console.warn(
      "[structuredWritingScoring]",
      err instanceof Error ? err.message : err
    );
    return null;
  }
}
