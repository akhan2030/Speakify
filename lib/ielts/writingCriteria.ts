export type WritingTaskType = "task1" | "task2";

export type FirstWritingCriterion = {
  abbrev: "TA" | "TR";
  label: "Task Achievement" | "Task Response";
  sectionHeading: "Task Achievement" | "Task Response";
};

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

/** Subtitle for pages with both tasks visible. */
export function dualTaskWritingCriteriaSubtitle(): string {
  return "Task 1: TA, CC, LR, GRA · Task 2: TR, CC, LR, GRA";
}

export function criteriaSummaryForTask(taskType: WritingTaskType): string {
  const first = getFirstWritingCriterion(taskType);
  return `${first.abbrev}, CC, LR, GRA`;
}
