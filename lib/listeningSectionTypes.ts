/**
 * Official IELTS Listening question-type plan per section (source of truth).
 * Modelled on British Council / Cambridge papers (form/notes, map+MCQ+choose TWO,
 * notes+flowchart, summary+diagram+notes).
 */

export type SectionQuestionBlockPlan = {
  type: string;
  /** Questions in this block (sum of blocks in a section = 10) */
  count: number;
  /** Prompt hint for the AI generator */
  promptHint: string;
  /** For MCQ blocks: 1 = A/B/C single, 2 = choose TWO */
  chooseCount?: 1 | 2;
  /** Default word-limit for gap-fill in this block */
  maxWords?: 1 | 2 | 3;
};

export type SectionListeningPlan = {
  name: string;
  context: string;
  allowedTypes: string[];
  blocks: SectionQuestionBlockPlan[];
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
  "diagram-labelling",
]);

/** @type {Record<number, SectionListeningPlan>} */
export const IELTS_SECTION_PLAN: Record<number, SectionListeningPlan> = {
  1: {
    name: "Conversation",
    context:
      "Everyday social conversation (booking, registration, enquiry, second-hand sale). Personal factual information.",
    allowedTypes: [
      "form-completion",
      "note-completion",
      "table-completion",
      "short-answer",
    ],
    questionTypeLabel: "Form/Note Completion",
    blocks: [
      {
        type: "form-completion",
        count: 5,
        maxWords: 1,
        promptHint: `Questions 1–5: form OR note completion. Write NO MORE THAN ONE WORD AND/OR A NUMBER.
Include an Example row in the notes (not scored). Clear subheading (e.g. Bedside tables / Registration Form).
Separate First name and Surname when names are tested; spell surnames letter-by-letter in the audio.
NO multiple-choice. options must be [].`,
      },
      {
        type: "note-completion",
        count: 5,
        maxWords: 1,
        promptHint: `Questions 6–10: note completion continuing the same conversation.
Write NO MORE THAN ONE WORD AND/OR A NUMBER. Subheadings allowed (e.g. Dressing table / Seller's details).
Factual gaps: materials, sizes, prices, condition, street names.
NO multiple-choice. options must be [].`,
      },
    ],
  },
  2: {
    name: "Social Monologue",
    context: "One speaker — facility tour, centre information, map walkthrough.",
    allowedTypes: [
      "plan-map-diagram",
      "multiple-choice",
      "note-completion",
      "matching",
    ],
    questionTypeLabel: "Map Labelling + Multiple Choice",
    blocks: [
      {
        type: "plan-map-diagram",
        count: 7,
        promptHint: `Questions 11–17: map/plan labelling. Provide locations A–J (include unused distractors).
Each answer MUST be a single letter A–J. List what each question labels (e.g. Bike racks, Café).`,
      },
      {
        type: "multiple-choice",
        count: 3,
        chooseCount: 1,
        promptHint: `Questions 18–20: multiple choice.
Q18: Choose ONE letter A, B or C (exactly 3 options).
Q19–20: Choose TWO letters A–E (same option list). Answers may be in either order — mark both correct if the set matches.`,
      },
    ],
  },
  3: {
    name: "Academic Discussion",
    context: "Tutor + students — assignment, research, publication process.",
    allowedTypes: [
      "note-completion",
      "flowchart-completion",
      "matching",
      "multiple-choice",
      "sentence-completion",
    ],
    questionTypeLabel: "Notes + Flow-chart Completion",
    blocks: [
      {
        type: "note-completion",
        count: 5,
        maxWords: 2,
        promptHint: `Questions 21–25: note/checklist completion. Write NO MORE THAN TWO WORDS.
Academic process checklist (e.g. abstract, keywords, final draft, style guide).
NO multiple-choice. options must be [].`,
      },
      {
        type: "flowchart-completion",
        count: 5,
        maxWords: 2,
        promptHint: `Questions 26–30: flow-chart completion. Write NO MORE THAN TWO WORDS.
Each box is a PROCESS STEP with a blank, e.g. "Submit _____", "Await _____ email", "Peer _____".
NEVER write full questions like "Which ethical consideration…?".
NO multiple-choice. options must be [].`,
      },
    ],
  },
  4: {
    name: "Academic Lecture",
    context: "Single lecturer — university lecture, continuous monologue.",
    allowedTypes: [
      "summary-completion",
      "diagram-labelling",
      "note-completion",
      "table-completion",
      "flowchart-completion",
    ],
    questionTypeLabel: "Summary + Diagram + Notes",
    blocks: [
      {
        type: "summary-completion",
        count: 3,
        maxWords: 2,
        promptHint: `Questions 31–33: summary completion. Write NO MORE THAN TWO WORDS.
A short paragraph summary of the lecture with 3 gaps. options must be [].`,
      },
      {
        type: "diagram-labelling",
        count: 3,
        maxWords: 2,
        promptHint: `Questions 34–36: diagram labelling. Write NO MORE THAN TWO WORDS.
Label parts of a diagram/process (layers, stages). Some labels may be given. options must be [].`,
      },
      {
        type: "note-completion",
        count: 4,
        maxWords: 2,
        promptHint: `Questions 37–40: note and/or table completion. Write NO MORE THAN TWO WORDS.
Problems list and/or comparison table (e.g. conventional vs organic). options must be [].`,
      },
    ],
  },
};

export function getSectionPlan(sectionNumber: number): SectionListeningPlan {
  return IELTS_SECTION_PLAN[sectionNumber] ?? IELTS_SECTION_PLAN[1];
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
  chooseCount?: 1 | 2;
  maxWords?: 1 | 2 | 3;
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
    return {
      type: block.type,
      start,
      end,
      chooseCount: block.chooseCount,
      maxWords: block.maxWords,
    };
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

export function getMaxWordsForQuestionNumber(
  sectionNumber: number,
  questionNumber: number
): 1 | 2 | 3 {
  const blocks = getSectionQuestionBlocks(sectionNumber);
  const hit = blocks.find(
    (b) => questionNumber >= b.start && questionNumber <= b.end
  );
  return hit?.maxWords ?? (sectionNumber === 1 ? 1 : 2);
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
    blocks.length >= 2
      ? "\n- Insert [SECTION BREAK] in the transcript between consecutive question blocks (30-second look time between parts)."
      : "";

  return `Section ${sectionNumber} — ${plan.context}
Allowed question types: ${plan.allowedTypes.join(", ")}
${blockRules}${sectionBreak}
- Section 1 must NOT use multiple-choice questions.
- Gap-fill types must have options: [].
- Flexible answer keys: use slash alternates (65/sixty-five), optional parentheses ((the) manuscript), and unit variants (1.25 metres/1.25 m).`;
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
  chooseCount?: number;
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
    const inGlobalRange = rawNum >= base + 1 && rawNum <= base + 10;
    const questionNumber = inGlobalRange ? rawNum : base + index + 1;
    const type = getTypeForQuestionNumber(sectionNumber, questionNumber);
    const gap = isGapFillQuestionType(type);
    const maxWords = getMaxWordsForQuestionNumber(sectionNumber, questionNumber);

    let tableHeaders = q.tableHeaders;
    if (type === "table-completion" && !Array.isArray(tableHeaders)) {
      tableHeaders = ["Item", "Detail"];
    }

    // S2 Q19–20: Choose TWO letters — one letter per question, either order
    let chooseCount = q.chooseCount;
    let eitherOrderGroup =
      typeof q.eitherOrderGroup === "string" ? q.eitherOrderGroup : undefined;
    if (
      type === "multiple-choice" &&
      sectionNumber === 2 &&
      (questionNumber === 19 || questionNumber === 20)
    ) {
      chooseCount = 1;
      eitherOrderGroup = eitherOrderGroup || `s${sectionNumber}-19-20`;
    } else if (type === "multiple-choice" && chooseCount == null) {
      chooseCount = 1;
    }

    return {
      ...q,
      questionNumber,
      type,
      chooseCount: gap ? undefined : chooseCount,
      eitherOrderGroup: gap ? undefined : eitherOrderGroup,
      wordLimit:
        q.wordLimit ??
        (gap
          ? `NO MORE THAN ${maxWords === 1 ? "ONE" : maxWords === 3 ? "THREE" : "TWO"} WORD${maxWords === 1 ? "" : "S"} AND/OR A NUMBER`
          : undefined),
      options: gap
        ? []
        : type === "multiple-choice" ||
            type === "matching" ||
            type === "plan-map-diagram"
          ? q.options ?? []
          : [],
      tableHeaders,
    };
  });
}
