import type { PracticeQuestion } from "./normalizePracticeContent";

export type QuestionValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

export type SectionValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  questions: Array<{ key: string; errors: string[] }>;
};

const MCQ_TYPES = new Set([
  "mcq",
  "multiple_choice",
  "multiple choice",
  "multiple_choice_and_matching",
]);

/** Canonical validation before displaying a question */
export function validateQuestion(q: {
  question_text?: string;
  label?: string;
  question_type?: string;
  type?: string;
  options?: string[];
  audio_url?: string | null;
  audioUrl?: string | null;
}): boolean {
  const questionText = String(q.question_text ?? q.label ?? "").trim();
  if (!questionText || questionText.includes("(text missing)")) return false;

  const qType = String(q.question_type ?? q.type ?? "")
    .toLowerCase()
    .replace(/_/g, " ");

  if (
    qType === "multiple choice" ||
    qType === "multiple_choice" ||
    qType === "mcq"
  ) {
    if (!q.options || q.options.length < 2) return false;
  }

  if (qType === "listening") {
    const audio = q.audio_url ?? q.audioUrl;
    if (!audio) return false;
  }

  return true;
}

export function validateListeningQuestion(
  q: PracticeQuestion,
  sectionHasTranscript: boolean
): QuestionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!validateQuestion(q)) {
    if (!q.questionText?.trim()) errors.push("question_text missing");
    if (MCQ_TYPES.has(q.questionType) && q.options.length < 2) {
      errors.push("options missing for multiple_choice");
    }
  }

  if (!q.questionType) {
    errors.push("question_type missing");
  }

  if (MCQ_TYPES.has(q.questionType)) {
    if (!q.options.length) {
      errors.push("options missing for MCQ");
    } else if (q.options.length < 2) {
      errors.push(`options incomplete (${q.options.length}/4 expected)`);
    } else if (q.options.length < 4) {
      warnings.push(`only ${q.options.length} options (IELTS MCQ usually has 4)`);
    }
    if (q.options.some((o) => !String(o).trim())) {
      errors.push("options contain empty values");
    }
  }

  if (sectionHasTranscript === false && !q.audioUrl) {
    errors.push("section transcript missing (audio cannot be generated)");
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateReadingQuestion(q: PracticeQuestion): QuestionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!validateQuestion(q)) {
    if (!q.questionText?.trim()) errors.push("question_text missing");
    if (MCQ_TYPES.has(q.questionType) && q.options.length < 2) {
      errors.push("options missing for multiple_choice");
    }
  }

  if (MCQ_TYPES.has(q.questionType) && !q.options.length) {
    errors.push("options missing for MCQ");
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateListeningSection(section: {
  transcript: string;
  questions: PracticeQuestion[];
}): SectionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const hasTranscript = Boolean(section.transcript?.trim());

  if (!hasTranscript) {
    errors.push("transcript missing — audio_url cannot be generated");
  }

  if (!section.questions.length) {
    errors.push("no questions in section");
  }

  const questionResults = section.questions.map((q) => {
    const v = validateListeningQuestion(q, hasTranscript);
    return { key: q.key, errors: v.errors, warnings: v.warnings };
  });

  for (const qr of questionResults) {
    errors.push(...qr.errors.map((e) => `${qr.key}: ${e}`));
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    questions: questionResults.map((q) => ({ key: q.key, errors: q.errors })),
  };
}

export function shouldBlockPublish(sectionValidation: SectionValidationResult): boolean {
  return !sectionValidation.valid;
}

export { MCQ_TYPES };
