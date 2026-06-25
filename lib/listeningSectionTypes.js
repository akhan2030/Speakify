/**
 * Official IELTS Listening question-type plan per section (Node + shared generator).
 */

const GAP_FILL_TYPES = new Set([
  "form-completion",
  "note-completion",
  "table-completion",
  "summary-completion",
  "flowchart-completion",
  "sentence-completion",
  "short-answer",
]);

/** @type {Record<number, object>} */
export const IELTS_SECTION_PLAN = {
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
    questionTypeLabel: "Note Completion + Matching",
    blocks: [
      {
        type: "note-completion",
        count: 5,
        promptHint:
          "Questions 1–5 (within section): note-completion — facility/tour notes with gaps.",
      },
      {
        type: "matching",
        count: 5,
        promptHint:
          "Questions 6–10: matching — match places/features to descriptions (provide matching options list in questions).",
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

export function getSectionPlan(sectionNumber) {
  return IELTS_SECTION_PLAN[sectionNumber] ?? IELTS_SECTION_PLAN[1];
}

export function getGlobalQuestionBase(sectionNumber) {
  return (Number(sectionNumber) - 1) * 10;
}

/** First global question number in this section (1, 11, 21, 31). */
export function getSectionFirstQuestionNumber(sectionNumber) {
  return getGlobalQuestionBase(sectionNumber) + 1;
}

export function getSectionQuestionBlocks(sectionNumber) {
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

export function getPrimaryQuestionType(sectionNumber) {
  return getSectionPlan(sectionNumber).blocks[0]?.type ?? "form-completion";
}

export function getSecondaryQuestionType(sectionNumber) {
  return (
    getSectionPlan(sectionNumber).blocks[1]?.type ??
    getPrimaryQuestionType(sectionNumber)
  );
}

export function getTypeForQuestionNumber(sectionNumber, questionNumber) {
  const blocks = getSectionQuestionBlocks(sectionNumber);
  const hit = blocks.find(
    (b) => questionNumber >= b.start && questionNumber <= b.end
  );
  return hit?.type ?? getPrimaryQuestionType(sectionNumber);
}

export function isGapFillQuestionType(type) {
  return GAP_FILL_TYPES.has(
    String(type ?? "")
      .trim()
      .toLowerCase()
      .replace(/_/g, "-")
  );
}

export function buildSectionQuestionTypeRules(sectionNumber) {
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

export function enforceSectionQuestionTypes(questions, sectionNumber) {
  const base = getGlobalQuestionBase(sectionNumber);

  return questions.map((q, index) => {
    const questionNumber = Number(q.questionNumber) || base + index + 1;
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
