import type OpenAI from "openai";

export type PracticeCoachingInput = {
  studentMessage: string;
  currentPart: number;
  lastExaminerQuestion?: string;
  programme?: string;
};

export type PracticeCoachingResult = {
  hint: string;
  focus: "fluency" | "vocabulary" | "grammar" | "development" | "pronunciation";
};

const COACHING_PROMPT = `You are an IELTS Speaking coach helping a Saudi student during PRACTICE (not a mock exam).
After each answer, give ONE short, actionable tip (max 2 sentences, under 220 characters).
Pick the single most useful improvement: fluency, vocabulary, grammar, answer development, or pronunciation.
Be warm and specific — reference what they actually said. Never say "Great answer!" without a tip.
Do not repeat the examiner's question. Do not score bands.

Return JSON only:
{
  "hint": "your coaching sentence(s)",
  "focus": "fluency" | "vocabulary" | "grammar" | "development" | "pronunciation"
}`;

export async function generatePracticeCoachingHint(
  openai: OpenAI,
  input: PracticeCoachingInput
): Promise<PracticeCoachingResult | null> {
  const studentMessage = String(input.studentMessage ?? "").trim();
  if (studentMessage.length < 8) return null;

  const part = Number(input.currentPart) || 1;
  const examinerCtx = input.lastExaminerQuestion?.trim()
    ? `Examiner asked: "${input.lastExaminerQuestion.trim()}"\n`
    : "";
  const examLabel =
    input.programme === "ielts_general"
      ? "IELTS General Training Speaking"
      : "IELTS Academic Speaking";

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: COACHING_PROMPT },
        {
          role: "user",
          content: `${examinerCtx}Exam: ${examLabel}\nPart ${part}\nStudent answer: "${studentMessage}"`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 120,
      temperature: 0.5,
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<PracticeCoachingResult>;
    const hint = String(parsed.hint ?? "").trim();
    if (!hint) return null;

    const focus = parsed.focus;
    const validFocus = [
      "fluency",
      "vocabulary",
      "grammar",
      "development",
      "pronunciation",
    ] as const;

    return {
      hint,
      focus: validFocus.includes(focus as (typeof validFocus)[number])
        ? (focus as PracticeCoachingResult["focus"])
        : "development",
    };
  } catch (err) {
    console.warn("[practiceCoaching]", err);
    return null;
  }
}

export function lastExaminerQuestionFromHistory(
  history: Array<{ role?: string; text?: string }> | null | undefined
): string | undefined {
  if (!Array.isArray(history)) return undefined;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    const entry = history[i];
    if (entry?.role === "examiner" && entry.text?.trim()) {
      return entry.text.trim();
    }
  }
  return undefined;
}
