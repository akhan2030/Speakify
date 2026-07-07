import type { GtReadingQuestion, GtReadingQuestionType } from "./readingContent";

/**
 * Extract a readable label from a reading option that may arrive as a plain
 * string OR an object (e.g. { label }, { text }, { value }, { heading },
 * { key, label }). Prevents "[object Object]" from leaking into the UI when
 * AI-generated or bank content stores options as objects.
 */
export function gtOptionText(opt: unknown): string {
  if (opt == null) return "";
  if (typeof opt === "string") return opt.trim();
  if (typeof opt === "number" || typeof opt === "boolean") return String(opt);

  if (typeof opt === "object") {
    const o = opt as Record<string, unknown>;
    const key = typeof o.key === "string" ? o.key.trim() : "";
    const label =
      typeof o.label === "string"
        ? o.label.trim()
        : typeof o.text === "string"
          ? o.text.trim()
          : typeof o.option === "string"
            ? o.option.trim()
            : typeof o.heading === "string"
              ? o.heading.trim()
              : typeof o.value === "string"
                ? o.value.trim()
                : "";

    if (key && label) return `${key}. ${label}`;
    if (label) return label;
    if (key) return key;

    // Last resort: a scalar field, else empty (never "[object Object]").
    const firstScalar = Object.values(o).find(
      (v) => typeof v === "string" || typeof v === "number"
    );
    return firstScalar != null ? String(firstScalar).trim() : "";
  }

  return "";
}

/** Normalize a raw options value into a clean, de-duplicated string list. */
export function normalizeGtOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const text = gtOptionText(item);
    if (text && !seen.has(text)) {
      seen.add(text);
      out.push(text);
    }
  }
  return out;
}

const OPTION_PICKER_TYPES: GtReadingQuestionType[] = [
  "multiple_choice",
  "matching_features",
  "matching",
  "matching_headings",
];

/** Whether this question type should render a fixed set of options. */
export function gtUsesOptionPicker(type: GtReadingQuestionType): boolean {
  return OPTION_PICKER_TYPES.includes(type);
}

/** Matching-style types read better as a dropdown than radio buttons. */
export function gtUsesDropdown(type: GtReadingQuestionType): boolean {
  return type === "matching" || type === "matching_headings";
}

const FALLBACK_PROMPTS: Partial<Record<GtReadingQuestionType, string>> = {
  matching_headings: "Choose the correct heading.",
  matching: "Choose the correct match.",
  matching_features: "Choose the correct option.",
  multiple_choice: "Choose the correct answer.",
  summary_completion: "Complete the summary.",
  sentence_completion: "Complete the sentence.",
  short_answer: "Write your answer.",
  true_false_not_given: "TRUE, FALSE or NOT GIVEN?",
};

/**
 * A guaranteed non-empty prompt/label for a question. Falls back to a
 * type-appropriate instruction so completion inputs are never unlabeled.
 */
export function gtQuestionPrompt(question: GtReadingQuestion): string {
  const text = String(question.question ?? "").trim();
  if (text) return text;
  return FALLBACK_PROMPTS[question.type] ?? `Question ${question.number}`;
}
