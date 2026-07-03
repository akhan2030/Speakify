import type { Question } from "./types";

export type McqOptionsRecord = {
  A?: string;
  B?: string;
  C?: string;
  D?: string;
};

/** Normalize MCQ options from string[] or { A, B, C, D } JSONB shapes. */
export function normalizeMcqOptions(options: unknown): string[] {
  if (!options) return [];

  if (Array.isArray(options)) {
    return options.map((o) => String(o ?? "").trim()).filter(Boolean);
  }

  if (typeof options === "object") {
    const record = options as Record<string, unknown>;
    return ["A", "B", "C", "D"].map((key) => String(record[key] ?? "").trim());
  }

  return [];
}

/** Options as { A, B, C, D } for rendering — matches Supabase JSONB shape. */
export function mcqOptionsRecord(options: unknown): McqOptionsRecord {
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    const arr = normalizeMcqOptions(options);
    return {
      A: arr[0] ?? "",
      B: arr[1] ?? "",
      C: arr[2] ?? "",
      D: arr[3] ?? "",
    };
  }
  const record = options as Record<string, unknown>;
  return {
    A: String(record.A ?? "").trim(),
    B: String(record.B ?? "").trim(),
    C: String(record.C ?? "").trim(),
    D: String(record.D ?? "").trim(),
  };
}

function letterOptionValid(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

/** True when an MCQ has four non-empty option strings (min 4 chars each). */
export function isValidQuestion(question: Question | null | undefined): boolean {
  if (!question) return false;
  if (!String(question.question ?? "").trim()) return false;

  if (question.type !== "mcq") {
    return true;
  }

  if (!question.options) return false;

  const opts = mcqOptionsRecord(question.options);
  return (
    letterOptionValid(opts.A) &&
    letterOptionValid(opts.B) &&
    letterOptionValid(opts.C) &&
    letterOptionValid(opts.D)
  );
}
