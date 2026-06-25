import type {
  NormalizedListeningSection,
  PracticeQuestion,
} from "./normalizePracticeContent";
import {
  isCompletionQuestionType,
  isMcqQuestionType,
} from "./listeningQuestionUtils";

export type QuestionDisplayCheck = {
  displayable: boolean;
  errors: string[];
};

export type SectionDisplayValidation = {
  canRender: boolean;
  displayableQuestions: PracticeQuestion[];
  hiddenCount: number;
  devErrors: string[];
  studentMessage: string | null;
};

const MIN_MCQ_OPTIONS = 2;
const PREFERRED_MCQ_OPTIONS = 4;

function hasQuestionText(q: PracticeQuestion): boolean {
  const text = (q.questionText || q.label || "").trim();
  return Boolean(text) && !text.includes("(text missing)") && !text.includes("(prompt missing");
}

function mcqOptionsForDisplay(q: PracticeQuestion) {
  return q.formattedOptions.filter((o) => String(o.text ?? "").trim());
}

/** Validate a single question for student display (errors are dev-only). */
export function validateQuestionForDisplay(q: PracticeQuestion): QuestionDisplayCheck {
  const errors: string[] = [];

  const type = q.questionType ?? q.type ?? "";
  const isMcq = isMcqQuestionType(type);

  if (!isMcq && !hasQuestionText(q)) {
    errors.push(`${q.key}: question_text missing`);
  }

  if (isMcq) {
    const opts = mcqOptionsForDisplay(q);
    if (opts.length < MIN_MCQ_OPTIONS) {
      errors.push(`${q.key}: MCQ requires at least ${MIN_MCQ_OPTIONS} options (has ${opts.length})`);
    }
    if (!hasQuestionText(q)) {
      errors.push(`${q.key}: MCQ question text missing`);
    }
    if (opts.length > 0 && opts.length < PREFERRED_MCQ_OPTIONS) {
      // Dev-only note — 3-option MCQs still render for students
      errors.push(`${q.key}: MCQ has ${opts.length} options (preferred ${PREFERRED_MCQ_OPTIONS})`);
    }
  }

  if (isCompletionQuestionType(type) && !hasQuestionText(q)) {
    errors.push(`${q.key}: completion question missing label`);
  }

  const displayable =
    isMcq
      ? mcqOptionsForDisplay(q).length >= MIN_MCQ_OPTIONS && hasQuestionText(q)
      : errors.filter((e) => !e.includes("preferred")).length === 0;

  return { displayable, errors };
}

/** Validate a listening section before rendering to students. */
export function validateListeningSectionForDisplay(
  section: NormalizedListeningSection
): SectionDisplayValidation {
  const devErrors: string[] = [];
  const hasTranscript = Boolean(section.transcript?.trim());
  const hasAudio = Boolean(section.audioUrl?.trim()) || hasTranscript;

  if (!hasTranscript) {
    devErrors.push(`Section ${section.id}: transcript missing`);
  }

  if (!hasAudio) {
    devErrors.push(`Section ${section.id}: no audio source (transcript/audio_url)`);
  }

  if (!section.questions.length) {
    devErrors.push(`Section ${section.id}: no questions`);
  }

  const displayableQuestions: PracticeQuestion[] = [];

  for (const q of section.questions) {
    const check = validateQuestionForDisplay(q);
    if (check.displayable) {
      displayableQuestions.push(q);
    } else {
      devErrors.push(...check.errors);
    }
  }

  const hiddenCount = section.questions.length - displayableQuestions.length;

  const canRender = hasAudio && displayableQuestions.length > 0;

  let studentMessage: string | null = null;
  if (!hasAudio || !displayableQuestions.length) {
    studentMessage =
      "This practice set is being refreshed. Please try again in a moment.";
  }

  return {
    canRender,
    displayableQuestions,
    hiddenCount,
    devErrors,
    studentMessage,
  };
}

export function logListeningValidationDev(
  sectionId: number,
  validation: SectionDisplayValidation
) {
  if (validation.devErrors.length === 0) return;
  console.warn("[ListeningPractice] Content validation (dev only)", {
    sectionId,
    errors: validation.devErrors,
    hiddenCount: validation.hiddenCount,
  });
}
