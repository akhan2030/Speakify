export type WritingTaskType = "task1" | "task2";

export type FirstWritingCriterion = {
  abbrev: "TA" | "TR";
  label: "Task Achievement" | "Task Response";
  sectionHeading: "Task Achievement" | "Task Response";
};

export const WRITING_CRITERION_WEIGHT_PERCENT = 25;

export const WRITING_WORD_LIMITS = {
  task1: { min: 150, max: 300 },
  task2: { min: 250, max: 400 },
} as const;

const SHARED_CRITERIA = [
  "Coherence and Cohesion",
  "Lexical Resource",
  "Grammatical Range and Accuracy",
] as const;

export function getFirstWritingCriterion(
  taskType: WritingTaskType
): FirstWritingCriterion {
  if (taskType === "task2") {
    return {
      abbrev: "TR",
      label: "Task Response",
      sectionHeading: "Task Response",
    };
  }
  return {
    abbrev: "TA",
    label: "Task Achievement",
    sectionHeading: "Task Achievement",
  };
}

export function countWritingWords(text: string): number {
  return String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function getWritingWordLimits(taskType: WritingTaskType) {
  return WRITING_WORD_LIMITS[taskType];
}

export function truncateToWritingWordLimit(
  text: string,
  taskType: WritingTaskType
): string {
  const max = WRITING_WORD_LIMITS[taskType].max;
  const trimmed = String(text ?? "");
  const words = trimmed.match(/\S+/g) ?? [];
  if (words.length <= max) return trimmed;

  let count = 0;
  let end = trimmed.length;
  const regex = /\S+/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(trimmed)) !== null) {
    count += 1;
    if (count === max) {
      end = match.index + match[0].length;
      break;
    }
  }
  return trimmed.slice(0, end);
}

export function exceedsWritingWordLimit(
  text: string,
  taskType: WritingTaskType
): boolean {
  return countWritingWords(text) > WRITING_WORD_LIMITS[taskType].max;
}

export function belowWritingWordMinimum(
  text: string,
  taskType: WritingTaskType
): boolean {
  const words = countWritingWords(text);
  return words > 0 && words < WRITING_WORD_LIMITS[taskType].min;
}

export function canSubmitWriting(text: string, taskType: WritingTaskType): boolean {
  const words = countWritingWords(text);
  const { min, max } = WRITING_WORD_LIMITS[taskType];
  return words >= min && words <= max;
}

export function writingWordLimitExceededMessage(taskType: WritingTaskType): string {
  const max = WRITING_WORD_LIMITS[taskType].max;
  const taskLabel = taskType === "task1" ? "Task 1" : "Task 2";
  return `To properly assess your writing, delete some words. You are not allowed to write more than ${max} words for ${taskLabel}.`;
}

export function writingWordMinimumMessage(taskType: WritingTaskType): string {
  const min = WRITING_WORD_LIMITS[taskType].min;
  if (taskType === "task2") {
    return `Your essay is below ${min} words. Task 2 requires a minimum of ${min} words — continue writing before submitting.`;
  }
  return `Your response is below ${min} words. Task 1 requires a minimum of ${min} words — continue writing before submitting.`;
}

export function writingCriteriaLabels(taskType: WritingTaskType): string[] {
  const first = getFirstWritingCriterion(taskType);
  return [
    first.label,
    ...SHARED_CRITERIA,
  ];
}

/** Full criteria with weight for submit labels and legends. */
export function criteriaSummaryForTask(taskType: WritingTaskType): string {
  return writingCriteriaLabels(taskType)
    .map((label) => `${label} (${WRITING_CRITERION_WEIGHT_PERCENT}%)`)
    .join(" · ");
}

export function submitLabelForWritingTask(_taskType?: WritingTaskType): string {
  return `Submit for AI score — 4 criteria, ${WRITING_CRITERION_WEIGHT_PERCENT}% each`;
}

/** Plain-text summary for pages with both tasks visible. */
export function dualTaskWritingCriteriaSubtitle(): string {
  const weight = `Each criterion carries ${WRITING_CRITERION_WEIGHT_PERCENT}% of your band score.`;
  const formatTask = (taskType: WritingTaskType, label: string) => {
    const criteria = writingCriteriaLabels(taskType)
      .map((name) => `${name} (${WRITING_CRITERION_WEIGHT_PERCENT}%)`)
      .join("; ");
    return `${label}: ${criteria}`;
  };
  return `${weight} ${formatTask("task1", "Task 1")}. ${formatTask("task2", "Task 2")}.`;
}

export function validateWritingSubmission(
  text: string,
  taskType: WritingTaskType
): { ok: true } | { ok: false; error: string } {
  if (!String(text ?? "").trim()) {
    return { ok: false, error: "Response is empty" };
  }
  if (!canSubmitWriting(text, taskType)) {
    const words = countWritingWords(text);
    const { min, max } = WRITING_WORD_LIMITS[taskType];
    if (words < min) {
      return { ok: false, error: writingWordMinimumMessage(taskType) };
    }
    if (words > max) {
      return { ok: false, error: writingWordLimitExceededMessage(taskType) };
    }
  }
  return { ok: true };
}

export function wordCountRangeLabel(taskType: WritingTaskType): string {
  const { min, max } = WRITING_WORD_LIMITS[taskType];
  return `minimum ${min} · maximum ${max}`;
}
