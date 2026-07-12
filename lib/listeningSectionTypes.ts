/**
 * Official IELTS Listening question-type plan per section (source of truth).
 */

export type SectionQuestionBlockPlan = {
  type: string;
  /** 5 or 10 — always 5 for split sections */
  count: number;
  /** Prompt hint for the AI generator */
  promptHint: string;
};

export type SectionListeningPlan = {
  name: string;
  context: string;
  /** Allowed types in this section (MCQ discouraged for section 1) */
  allowedTypes: string[];
  blocks: SectionQuestionBlockPlan[];
  /** Shown on dashboard cards */
  questionTypeLabel: string;
};

const GAP_FILL_TYPES = new Set([
  "form-completion",
  "note-completion",
  "table-completion",
  "summary-completion",
  "flowchart-completion",
  "sentence-completion",
  "short-answer",
]);

/** @type {Record<number, SectionListeningPlan>} */
export const IELTS_SECTION_PLAN: Record<number, SectionListeningPlan> = {
  1: {
    name: "Conversation",
    context:
      "Everyday social conversation (booking, registration, enquiry). Personal factual information.",
    allowedTypes: [
      "form-completion",
      "note-completion",
      "table-completion",
      "short-answer",
    ],
    questionTypeLabel: "Form + Note/Table Completion",
    blocks: [
      {
        type: "form-completion",
        count: 5,
        promptHint: `Questions 1–5 MUST be form-completion ONLY.
Use a clear form title in the section title (e.g. "Accommodation Booking Form", "Library Registration Form").
Each question "text" is a FORM FIELD LABEL ending with a colon, e.g. "Customer name:", "Phone number:", "Preferred floor:", "Check-in date:", "Room rate:".
Cover: names, phone numbers, addresses, dates, times, prices, room preferences, booking/registration details.
NO multiple-choice. NO A/B/C options. options must be [].`,
      },
      {
        type: "table-completion",
        count: 5,
        promptHint: `Questions 6–10 MUST be table-completion (or note-completion with bullet gaps).
Continue the same booking/registration scenario. Use tableHeaders e.g. ["Item", "Detail"] or note-style factual gaps.
Factual short answers: dates, times, prices, preferences, reference numbers.
NO multiple-choice. options must be [].`,
      },
    ],
  },
  2: {
    name: "Social Monologue",
    context: "One speaker — tour, announcement, community information.",
    allowedTypes: [
      "note-completion",
      "matching",
      "multiple-choice",
      "plan-map-diagram",
      "table-completion",
    ],
    questionTypeLabel: "Multiple Choice + Matching",
    blocks: [
      {
        type: "multiple-choice",
        count: 5,
        promptHint:
          "Questions 11–15: multiple-choice with exactly 3 options (A, B, C). Social/public information monologue.",
      },
      {
        type: "matching",
        count: 5,
        promptHint:
          "Questions 16–20: matching — provide a lettered box (A–E). Each answer MUST be a single letter. Match places/features to descriptions.",
      },
    ],
  },
  3: {
    name: "Academic Discussion",
    context: "Tutor + students — assignment, research, project discussion.",
    allowedTypes: [
      "multiple-choice",
      "matching",
      "sentence-completion",
      "table-completion",
    ],
    questionTypeLabel: "Multiple Choice + Matching",
    blocks: [
      {
        type: "multiple-choice",
        count: 5,
        promptHint:
          "Questions 1–5: multiple-choice with exactly 3 options (A, B, C).",
      },
      {
        type: "matching",
        count: 5,
        promptHint:
          "Questions 6–10: matching or sentence-completion — academic task matching.",
      },
    ],
  },
  4: {
    name: "Academic Lecture",
    context: "Single lecturer — university lecture, continuous monologue.",
    allowedTypes: [
      "note-completion",
      "summary-completion",
      "flowchart-completion",
      "table-completion",
    ],
    questionTypeLabel: "Note + Summary Completion",
    blocks: [
      {
        type: "note-completion",
        count: 5,
        promptHint:
          "Questions 1–5 (within section): lecture notes with gaps (NO speaker labels in transcript).",
      },
      {
        type: "summary-completion",
        count: 5,
        promptHint:
          "Questions 6–10: summary-completion — paragraph summary of lecture with gaps.",
      },
    ],
  },
};

export function getSectionPlan(sectionNumber: number): SectionListeningPlan {
  return (
    IELTS_SECTION_PLAN[sectionNumber] ?? IELTS_SECTION_PLAN[1]
  );
}

/** Zero-based offset within the full test (0, 10, 20, 30) — for local ids only. */
export function getGlobalQuestionBase(sectionNumber: number) {
  return (Number(sectionNumber) - 1) * 10;
}

/** First global question number in this section (1, 11, 21, 31). */
export function getSectionFirstQuestionNumber(sectionNumber: number) {
  return getGlobalQuestionBase(sectionNumber) + 1;
}

export type SectionQuestionBlock = {
  type: string;
  start: number;
  end: number;
};

/** Global question numbers for each block in a section */
export function getSectionQuestionBlocks(
  sectionNumber: number
): SectionQuestionBlock[] {
  const plan = getSectionPlan(sectionNumber);
  const firstQuestion = getSectionFirstQuestionNumber(sectionNumber);
  let offset = 0;

  return plan.blocks.map((block) => {
    const start = firstQuestion + offset;
    const end = start + block.count - 1;
    offset += block.count;
    return { type: block.type, start, end };
  });
}

export function getPrimaryQuestionType(sectionNumber: number): string {
  return getSectionPlan(sectionNumber).blocks[0]?.type ?? "form-completion";
}

export function getSecondaryQuestionType(sectionNumber: number): string {
  return (
    getSectionPlan(sectionNumber).blocks[1]?.type ??
    getPrimaryQuestionType(sectionNumber)
  );
}

export function getTypeForQuestionNumber(
  sectionNumber: number,
  questionNumber: number
): string {
  const blocks = getSectionQuestionBlocks(sectionNumber);
  const hit = blocks.find(
    (b) => questionNumber >= b.start && questionNumber <= b.end
  );
  return hit?.type ?? getPrimaryQuestionType(sectionNumber);
}

export function isGapFillQuestionType(type: string): boolean {
  return GAP_FILL_TYPES.has(
    String(type ?? "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
  );
}

export function buildSectionQuestionTypeRules(sectionNumber: number): string {
  const plan = getSectionPlan(sectionNumber);
  const blocks = getSectionQuestionBlocks(sectionNumber);

  const blockRules = blocks
    .map((b, i) => {
      const hint = plan.blocks[i]?.promptHint ?? "";
      return `- Questions ${b.start}–${b.end}: type "${b.type}" (REQUIRED)\n  ${hint}`;
    })
    .join("\n");

  const sectionBreak =
    sectionNumber <= 3
      ? "\n- Insert [SECTION BREAK] in the transcript between the two question blocks"
      : "";

  return `Section ${sectionNumber} — ${plan.context}
Allowed question types: ${plan.allowedTypes.join(", ")}
${blockRules}${sectionBreak}
- Section 1 must NOT use multiple-choice questions.
- Gap-fill types must have options: []`;
}

type RawQuestion = {
  id?: number;
  questionNumber?: number;
  type?: string;
  text?: string;
  options?: unknown[];
  answer?: string;
  wordLimit?: string;
  explanation?: string;
  tableHeaders?: string[];
  [key: string]: unknown;
};

/** Force each question to the IELTS-planned type; strip MCQ options from gap-fill tasks. */
export function enforceSectionQuestionTypes(
  questions: RawQuestion[],
  sectionNumber: number
): RawQuestion[] {
  const base = getGlobalQuestionBase(sectionNumber);

  return questions.map((q, index) => {
    const rawNum = Number(q.questionNumber);
    const inGlobalRange =
      rawNum >= base + 1 && rawNum <= base + 10;
    const questionNumber = inGlobalRange ? rawNum : base + index + 1;
    const type = getTypeForQuestionNumber(sectionNumber, questionNumber);
    const gap = isGapFillQuestionType(type);

    let tableHeaders = q.tableHeaders;
    if (type === "table-completion" && !Array.isArray(tableHeaders)) {
      tableHeaders = ["Item", "Detail"];
    }

    return {
      ...q,
      questionNumber,
      type,
      options: gap ? [] : type === "multiple-choice" ? q.options ?? [] : [],
      tableHeaders,
    };
  });
}
