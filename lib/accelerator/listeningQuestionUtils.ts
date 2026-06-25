import type { PracticeQuestion } from "./normalizePracticeContent";

const MCQ_TYPES = new Set([
  "mcq",
  "multiple_choice",
  "multiple choice",
  "multiple_choice_and_matching",
]);

export function isMcqQuestionType(type: string): boolean {
  const t = type.replace(/_/g, " ").toLowerCase();
  return MCQ_TYPES.has(type) || t.includes("multiple choice");
}

export function isCompletionQuestionType(type: string): boolean {
  if (isMcqQuestionType(type)) return false;
  const t = type.replace(/_/g, " ").toLowerCase();
  return (
    t.includes("completion") ||
    t.includes("form") ||
    t.includes("note") ||
    t.includes("sentence") ||
    t === "short answer" ||
    t === "text"
  );
}

export type QuestionGroup = {
  kind: "completion" | "mcq" | "other";
  questions: PracticeQuestion[];
  startNum: number;
  endNum: number;
};

export function groupListeningQuestions(
  questions: PracticeQuestion[]
): QuestionGroup[] {
  const groups: QuestionGroup[] = [];

  for (const q of questions) {
    const kind = isMcqQuestionType(q.questionType ?? q.type)
      ? "mcq"
      : isCompletionQuestionType(q.questionType ?? q.type)
        ? "completion"
        : "other";

    const last = groups[groups.length - 1];
    if (last && last.kind === kind) {
      last.questions.push(q);
      last.endNum = Number(q.number);
    } else {
      groups.push({
        kind,
        questions: [q],
        startNum: Number(q.number),
        endNum: Number(q.number),
      });
    }
  }

  return groups;
}

export function mcqRangeLabel(group: QuestionGroup): string {
  if (group.startNum === group.endNum) {
    return `Question ${group.startNum}`;
  }
  return `Questions ${group.startNum}-${group.endNum}`;
}
