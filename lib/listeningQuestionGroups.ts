import type { ListeningQuestion } from "@/components/ListeningQuestions";

import {

  getSectionQuestionBlocks,

  isGapFillQuestionType,

} from "./listeningSectionTypes";

import { normalizeSectionQuestions } from "./listeningSectionNormalize.js";



export type QuestionGroup = {

  type: string;

  questions: ListeningQuestion[];

  start: number;

  end: number;

};



function normalizeType(type: string) {

  return String(type ?? "")

    .trim()

    .toLowerCase()

    .replace(/_/g, "-");

}



function applyPlanTypesToQuestions(

  questions: ListeningQuestion[],

  sectionNumber: number

): ListeningQuestion[] {

  const blocks = getSectionQuestionBlocks(sectionNumber);



  return questions.map((q) => {

    const qNum = q.questionNumber ?? 0;

    const block = blocks.find((b) => qNum >= b.start && qNum <= b.end);

    const type = normalizeType(block?.type ?? q.type ?? "");

    if (type === "multiple-choice") {
      const raw = q.options ?? [];
      const trimmed = raw.slice(0, 3).map((opt, i) => ({
        label: String(opt.label ?? String.fromCharCode(65 + i)).toUpperCase(),
        text: String(opt.text ?? opt.label ?? opt).trim(),
      }));
      return { ...q, type, options: trimmed };
    }

    if (type === "table-completion") {
      return {
        ...q,
        type,
        options: [],
        tableHeaders: q.tableHeaders ?? ["Item", "Detail"],
      };
    }

    return {

      ...q,

      type,

      options: isGapFillQuestionType(type)

        ? []

        : q.options,

    };

  });

}

/** Instructions/header type derived from actual question payloads (not plan alone). */
export function resolveEffectiveGroupType(group: QuestionGroup): string {
  const sample = group.questions[0];
  if (!sample) return group.type;

  const sampleType = normalizeType(sample.type);
  if (sampleType === "multiple-choice" && (sample.options?.length ?? 0) >= 2) {
    return "multiple-choice";
  }
  if (sampleType === "table-completion") return "table-completion";
  if (isGapFillQuestionType(sampleType)) return sampleType;
  if (sampleType === "matching" && (sample.options?.length ?? 0) >= 2) {
    return "matching";
  }
  if (group.type === "matching") return "sentence-completion";
  return group.type;
}



/**

 * Build groups from the official IELTS section question plan (two blocks per section).

 */

function buildPlanQuestionGroups(

  questions: ListeningQuestion[],

  sectionNumber: number

): QuestionGroup[] {

  const blocks = getSectionQuestionBlocks(sectionNumber);

  const typed = applyPlanTypesToQuestions(questions, sectionNumber);



  return blocks.map((block) => {
    const blockQuestions = typed
      .filter(
        (q) =>
          (q.questionNumber ?? 0) >= block.start &&
          (q.questionNumber ?? 0) <= block.end
      )
      .sort((a, b) => (a.questionNumber ?? 0) - (b.questionNumber ?? 0));

    return {
      type: block.type,
      questions: blockQuestions,
      start: block.start,
      end: block.end,
    };
  });
}



/**

 * Build question groups with global numbering (1–10, 11–20, …).

 */

export function buildQuestionGroups(

  questions: ListeningQuestion[],

  sectionNumber: number

): QuestionGroup[] {

  if (!questions.length) return [];

  const normalized = normalizeSectionQuestions(
    questions,
    sectionNumber
  ) as ListeningQuestion[];

  if (sectionNumber >= 1 && sectionNumber <= 4) {
    return buildPlanQuestionGroups(normalized, sectionNumber);
  }

  const sorted = [...normalized].sort(
    (a, b) => (a.questionNumber ?? 0) - (b.questionNumber ?? 0)
  );



  const globalStart =

    (sectionNumber - 1) * 10 + 1;

  const type = normalizeType(sorted[0]?.type ?? "note-completion");

  return [

    {

      type,

      questions: sorted,

      start: globalStart,

      end: globalStart + sorted.length - 1,

    },

  ];

}


