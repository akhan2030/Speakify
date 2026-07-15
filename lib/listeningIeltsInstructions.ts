import { wordLimitPhrase } from "@/lib/listeningAuthenticityContract";

export type InstructionPart = {
  text: string;
  emphasis?: "limit" | "normal";
};

function normalizeType(type: string) {
  return String(type ?? "")
    .trim()
    .toLowerCase()
    .replace(/_/g, "-");
}

function limitParts(
  maxWords: 1 | 2 | 3,
  includeNumber = true
): InstructionPart[] {
  return [
    {
      text: wordLimitPhrase(maxWords, { includeNumber }),
      emphasis: "limit",
    },
  ];
}

/**
 * Official IELTS instruction text parts for a question type.
 */
export function getOfficialInstructionParts(
  questionType: string,
  options?: {
    chooseCount?: number;
    /** Override default word limit (1 / 2 / 3) */
    maxWords?: 1 | 2 | 3;
    matchingRange?: string;
  }
): InstructionPart[] {
  const type = normalizeType(questionType);
  const choose = options?.chooseCount ?? 1;
  const maxWords = options?.maxWords ?? (type === "short-answer" ? 3 : 2);
  const matchingRange = options?.matchingRange ?? "A–G";

  switch (type) {
    case "form-completion":
      return [
        { text: "Complete the form below.\nWrite " },
        ...limitParts(maxWords),
        { text: " for each answer." },
      ];
    case "note-completion":
      return [
        { text: "Complete the notes below.\nWrite " },
        ...limitParts(maxWords),
        { text: " for each answer." },
      ];
    case "table-completion":
      return [
        { text: "Complete the table below.\nWrite " },
        ...limitParts(maxWords),
        { text: " for each answer." },
      ];
    case "summary-completion":
      return [
        { text: "Complete the summary below.\nWrite " },
        ...limitParts(maxWords),
        { text: " for each answer." },
      ];
    case "sentence-completion":
      return [
        { text: "Complete the sentences below.\nWrite " },
        ...limitParts(maxWords),
        { text: " for each answer." },
      ];
    case "short-answer":
      return [
        { text: "Answer the questions below.\nWrite " },
        ...limitParts(maxWords),
        { text: " for each answer." },
      ];
    case "multiple-choice":
      if (choose > 1) {
        return [
          {
            text: `Choose ${choose === 2 ? "TWO" : String(choose)} letters, A–E.\nAnswers may be written in either order.`,
          },
        ];
      }
      return [{ text: "Choose the correct letter, A, B or C." }];
    case "matching":
      return [
        {
          text: `Choose the correct answer from the box and write the correct letter, ${matchingRange}, next to the questions.`,
        },
      ];
    case "plan-map-diagram":
    case "map-labelling":
      return [
        {
          text: `Label the map below. Choose the correct letter, ${matchingRange}, for each answer.`,
        },
      ];
    case "plan-labelling":
      return [
        {
          text: `Label the plan below. Choose the correct letter, ${matchingRange}, for each answer.`,
        },
      ];
    case "diagram-labelling":
      return [
        {
          text: `Label the diagram below. Choose the correct letter, ${matchingRange}, for each answer.`,
        },
      ];
    case "flowchart-completion":
      return [
        { text: "Complete the flow chart below.\nWrite " },
        ...limitParts(maxWords, false),
        { text: " for each answer." },
      ];
    default:
      return [
        { text: "Write " },
        ...limitParts(maxWords),
        { text: " for each answer." },
      ];
  }
}

/** Human-readable label for a question type id (matches rendered questions). */
export function formatQuestionTypeLabel(questionType: string): string {
  const type = normalizeType(questionType);
  const labels: Record<string, string> = {
    "form-completion": "Form Completion",
    "note-completion": "Note Completion",
    "table-completion": "Table Completion",
    "summary-completion": "Summary Completion",
    "sentence-completion": "Sentence Completion",
    "short-answer": "Short Answer",
    "multiple-choice": "Multiple Choice",
    matching: "Matching",
    "plan-map-diagram": "Map Labelling",
    "map-labelling": "Map Labelling",
    "plan-labelling": "Plan Labelling",
    "diagram-labelling": "Diagram Labelling",
    "flowchart-completion": "Flowchart Completion",
  };
  return (
    labels[type] ??
    questionType.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

export function getGlobalQuestionRange(sectionNumber: number) {
  const start = (sectionNumber - 1) * 10 + 1;
  const end = sectionNumber * 10;
  return { start, end, label: `${start}–${end}` };
}

/**
 * Short official instruction line shown on preview/break screens.
 */
/** Single-line prep banner: announcement + official question-type rule. */
export function buildPrepBannerMessage(
  lead: string,
  detail: string | undefined,
  questionType?: string
): string {
  const main = detail?.trim() ? `${lead} ${detail}`.trim() : lead.trim();
  const instruction = questionType
    ? getBreakInstructionLine(questionType)
    : "";
  return instruction ? `${main} — ${instruction}` : main;
}

export function getBreakInstructionLine(questionType: string): string {
  const type = normalizeType(questionType);
  switch (type) {
    case "multiple-choice":
      return "Choose the correct letter, A, B or C.";
    case "matching":
      return "Choose the correct letter from the box.";
    case "plan-map-diagram":
    case "map-labelling":
    case "plan-labelling":
    case "diagram-labelling":
      return "Label the map. Choose the correct letter for each answer.";
    case "short-answer":
      return "Write NO MORE THAN THREE WORDS AND/OR A NUMBER.";
    case "form-completion":
    case "note-completion":
    case "table-completion":
    case "summary-completion":
    case "sentence-completion":
    case "flowchart-completion":
    default:
      return "Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.";
  }
}
