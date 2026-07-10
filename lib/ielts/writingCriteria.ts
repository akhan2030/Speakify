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

export type WritingWordCountZone = "empty" | "practice" | "exam_ready" | "over_limit";

export function getWritingWordCountZone(
  text: string,
  taskType: WritingTaskType
): WritingWordCountZone {
  const words = countWritingWords(text);
  const { min, max } = WRITING_WORD_LIMITS[taskType];
  if (words === 0) return "empty";
  if (words > max) return "over_limit";
  if (words < min) return "practice";
  return "exam_ready";
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
  const { max } = WRITING_WORD_LIMITS[taskType];
  return words > 0 && words <= max;
}

export function writingWordLimitExceededMessage(taskType: WritingTaskType): string {
  const max = WRITING_WORD_LIMITS[taskType].max;
  const taskLabel = taskType === "task1" ? "Task 1" : "Task 2";
  return `To properly assess your writing, delete some words. You are not allowed to write more than ${max} words for ${taskLabel}.`;
}

export function writingWordMinimumMessage(taskType: WritingTaskType): string {
  const min = WRITING_WORD_LIMITS[taskType].min;
  const first = getFirstWritingCriterion(taskType);
  const taskLabel = taskType === "task1" ? "Task 1" : "Task 2";
  return `${taskLabel} requires at least ${min} words in the real IELTS exam. You can still submit shorter drafts for feedback — ${first.sectionHeading} will reflect the short length.`;
}

export function writingUnderMinimumNoticeParts(taskType: WritingTaskType) {
  const min = WRITING_WORD_LIMITS[taskType].min;
  const first = getFirstWritingCriterion(taskType);
  const taskLabel = taskType === "task1" ? "Task 1" : "Task 2";
  return {
    taskLabel,
    minWords: min,
    criterionLabel: first.sectionHeading,
  };
}

export function writingUnderMinimumNotice(taskType: WritingTaskType): string {
  const { taskLabel, minWords, criterionLabel } =
    writingUnderMinimumNoticeParts(taskType);
  return `${taskLabel} requires at least ${minWords} words in the real IELTS exam. You can still submit shorter drafts for feedback — ${criterionLabel} will reflect the short length.`;
}

export function writingWordMaximumReachedMessage(taskType: WritingTaskType): string {
  const max = WRITING_WORD_LIMITS[taskType].max;
  const taskLabel = taskType === "task1" ? "Task 1" : "Task 2";
  return `You've reached the ${max}-word limit for ${taskLabel} on this platform. You can submit now, but cannot add more words.`;
}

export function writingWordRequirementsSummary(taskType: WritingTaskType): string {
  const { min, max } = WRITING_WORD_LIMITS[taskType];
  const taskLabel = taskType === "task1" ? "Task 1" : "Task 2";
  return `${taskLabel}: IELTS requires at least ${min} words · maximum ${max} words here`;
}

export function writingWordCountStatusMessage(
  text: string,
  taskType: WritingTaskType
): string {
  const words = countWritingWords(text);
  const { min, max } = WRITING_WORD_LIMITS[taskType];
  const zone = getWritingWordCountZone(text, taskType);

  if (zone === "empty") return "Write something to get feedback";
  if (zone === "over_limit") {
    return `${words} words — delete ${words - max} to submit`;
  }
  if (zone === "practice") {
    return `${words} words — ${min - words} below IELTS minimum`;
  }
  if (words === max) return `${words} words — at platform maximum`;
  return `${words} words — meets IELTS minimum`;
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

export function submitLabelForWritingTask(taskType?: WritingTaskType): string {
  if (!taskType) {
    return `Submit for AI score — 4 criteria, ${WRITING_CRITERION_WEIGHT_PERCENT}% each`;
  }
  return submitLabelForWritingSubmission("", taskType);
}

export function submitLabelForWritingSubmission(
  text: string,
  taskType: WritingTaskType
): string {
  const zone = getWritingWordCountZone(text, taskType);
  const first = getFirstWritingCriterion(taskType);

  if (zone === "empty") return "Submit for feedback";
  if (zone === "practice") {
    return `Submit for feedback (under length — ${first.sectionHeading} affected)`;
  }
  if (zone === "over_limit") return "Delete words to submit";
  return `Submit for AI score — 4 criteria, ${WRITING_CRITERION_WEIGHT_PERCENT}% each`;
}

export function writingSubmitHintMessage(
  text: string,
  taskType: WritingTaskType
): string {
  const zone = getWritingWordCountZone(text, taskType);
  const { min, max } = WRITING_WORD_LIMITS[taskType];

  if (zone === "empty") return "Write something to get AI feedback";
  if (zone === "over_limit") {
    return `Delete words to submit — maximum ${max} words allowed on this platform`;
  }
  if (zone === "practice") {
    return `Below IELTS minimum (${min} words) — feedback still available`;
  }
  return `Meets IELTS minimum (${min}+ words) · do not exceed ${max} words`;
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
): { ok: true; underMinimum: boolean } | { ok: false; error: string } {
  if (!String(text ?? "").trim()) {
    return { ok: false, error: "Response is empty" };
  }
  const words = countWritingWords(text);
  const { max } = WRITING_WORD_LIMITS[taskType];
  if (words > max) {
    return { ok: false, error: writingWordLimitExceededMessage(taskType) };
  }
  return {
    ok: true,
    underMinimum: belowWritingWordMinimum(text, taskType),
  };
}

export function wordCountRangeLabel(taskType: WritingTaskType): string {
  const { min, max } = WRITING_WORD_LIMITS[taskType];
  return `IELTS min ${min} · max ${max}`;
}
