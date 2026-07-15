import { getTypeForQuestionNumber } from "@/lib/listeningSectionTypes";
import type { ListeningAudioBlock } from "./listeningExam";
import type { ListeningQuestion } from "./types";
import type { ListeningQuestion as UiListeningQuestion } from "@/components/ListeningQuestions";

/** Map compact mock question type → official IELTS type id. */
export function mockQuestionTypeToIelts(
  mockType: ListeningQuestion["type"],
  sectionNumber: number,
  questionNumber: number
): string {
  const planned = getTypeForQuestionNumber(sectionNumber, questionNumber);
  if (mockType === "table") return "table-completion";
  if (mockType === "form") return "form-completion";
  if (mockType === "note") return "note-completion";
  if (mockType === "summary") return "summary-completion";
  if (mockType === "flowchart") return "flowchart-completion";
  if (mockType === "diagram") return "diagram-labelling";
  if (mockType === "mcq") return "multiple-choice";
  if (mockType === "matching" || mockType === "matching-features") {
    if (planned === "sentence-completion") return "sentence-completion";
    if (planned === "plan-map-diagram") return "plan-map-diagram";
    return "matching";
  }
  return planned;
}

/**
 * Derive the UI/instruction type from actual question payloads.
 * Prevents label/content mismatch when block metadata disagrees with questions.
 */
export function resolveEffectiveBlockType(
  questions: ListeningQuestion[],
  plannedType: string
): string {
  if (!questions.length) return plannedType;

  const sample = questions[0];
  if (sample.type === "mcq" && (sample.options?.length ?? 0) >= 2) {
    return "multiple-choice";
  }
  if (sample.type === "table") return "table-completion";
  if (sample.type === "form") return "form-completion";
  if (sample.type === "summary") return "summary-completion";
  if (sample.type === "note") return "note-completion";
  if (sample.type === "flowchart") return "flowchart-completion";
  if (sample.type === "diagram") return "diagram-labelling";
  if (sample.type === "matching" || sample.type === "matching-features") {
    if ((sample.options?.length ?? 0) < 2) return "sentence-completion";
    // Keep plan/map labelling distinct from generic matching when the section plan says so.
    return plannedType === "plan-map-diagram" ? "plan-map-diagram" : "matching";
  }

  return plannedType;
}

function inferMockTypeFromPlan(
  plannedType: string
): ListeningQuestion["type"] {
  switch (plannedType) {
    case "form-completion":
      return "form";
    case "table-completion":
      return "table";
    case "multiple-choice":
      return "mcq";
    case "summary-completion":
      return "summary";
    case "flowchart-completion":
      return "flowchart";
    case "diagram-labelling":
      return "diagram";
    case "note-completion":
      return "note";
    case "matching":
    case "plan-map-diagram":
      return "matching";
    case "sentence-completion":
    case "short-answer":
      return "note";
    default:
      return "note";
  }
}

function chooseCountForMcq(
  questionNumber: number,
  existing?: 1 | 2
): 1 | 2 {
  // Official "Choose TWO" still uses one letter per question number;
  // either-order scoring pairs them. UI chooseCount stays 1.
  if (existing === 2) return 1;
  if (questionNumber === 19 || questionNumber === 20) return 1;
  return existing === 1 ? 1 : 1;
}

/** Enforce section plan on question records at build time (single pipeline). */
export function alignQuestionsToSectionPlan(
  questions: ListeningQuestion[],
  sectionNumber: number,
  mockNumber = 1
): ListeningQuestion[] {
  return questions.map((q) => {
    const planned = getTypeForQuestionNumber(sectionNumber, q.number);
    let type = inferMockTypeFromPlan(planned);

    if (planned === "multiple-choice") {
      type = "mcq";
      const isChooseTwoPair = q.number === 19 || q.number === 20;
      const maxOpts = isChooseTwoPair || q.eitherOrderGroup ? 5 : 3;
      const opts = (q.options ?? []).slice(0, maxOpts);
      return {
        ...q,
        type,
        // One letter per question; pair scored either-order
        chooseCount: 1,
        eitherOrderGroup: isChooseTwoPair
          ? q.eitherOrderGroup ?? `mock${mockNumber}-s2-19-20`
          : undefined,
        options: opts.length >= 2 ? opts : q.options,
      };
    }

    if (planned === "table-completion") {
      return {
        ...q,
        type: "table",
        options: undefined,
        tableHeaders: q.tableHeaders ?? ["Item", "Detail"],
      };
    }

    if (
      planned === "form-completion" ||
      planned === "note-completion" ||
      planned === "summary-completion" ||
      planned === "sentence-completion" ||
      planned === "short-answer" ||
      planned === "flowchart-completion" ||
      planned === "diagram-labelling"
    ) {
      return {
        ...q,
        type,
        options: undefined,
        chooseCount: undefined,
        eitherOrderGroup: undefined,
      };
    }

    if (planned === "matching" || planned === "plan-map-diagram") {
      return {
        ...q,
        type: "matching",
        options: q.options,
        chooseCount: undefined,
        eitherOrderGroup: undefined,
      };
    }

    return q;
  });
}

export function adaptMockQuestionsForUi(
  questions: ListeningQuestion[],
  ieltsType: string,
  block?: Pick<ListeningAudioBlock, "tableHeaders">
): UiListeningQuestion[] {
  const headers = block?.tableHeaders ?? questions[0]?.tableHeaders;

  return questions.map((q) => {
    const effective = resolveEffectiveBlockType([q], ieltsType);

    if (effective === "multiple-choice" && q.options?.length) {
      const isChooseTwoPair =
        Boolean(q.eitherOrderGroup) || q.number === 19 || q.number === 20;
      const opts = q.options.slice(0, isChooseTwoPair ? 5 : 3).map((text, i) => ({
        label: String.fromCharCode(65 + i),
        text,
      }));
      return {
        id: q.number,
        questionNumber: q.number,
        type: "multiple-choice",
        text: q.prompt,
        options: opts,
        // One letter per question; block instruction says Choose TWO
        chooseCount: 1,
      };
    }

    if (effective === "table-completion") {
      return {
        id: q.number,
        questionNumber: q.number,
        type: "table-completion",
        text: q.prompt,
        tableHeaders: headers ?? ["Item", "Detail"],
      };
    }

    if (
      (effective === "matching" || effective === "plan-map-diagram") &&
      (q.options?.length ?? 0) >= 2
    ) {
      return {
        id: q.number,
        questionNumber: q.number,
        type: effective === "plan-map-diagram" ? "plan-map-diagram" : "matching",
        text: q.prompt,
        options: q.options!.map((text, i) => ({
          label: String.fromCharCode(65 + i),
          text,
        })),
      };
    }

    const gapText =
      (effective === "note-completion" ||
        effective === "flowchart-completion" ||
        effective === "diagram-labelling") &&
      !q.prompt.includes("___")
        ? `${q.prompt} ___`
        : q.prompt;

    return {
      id: q.number,
      questionNumber: q.number,
      type: effective,
      text: gapText,
    };
  });
}

/** Map UI answer keys (question numbers) back to mock answer ids; resolve MCQ letters → text. */
export function mapUiAnswerToMock(
  questionId: number | string,
  value: string,
  questions: ListeningQuestion[]
): { id: string; value: string } {
  const q = questions.find((row) => row.number === Number(questionId));
  if (!q) {
    return { id: String(questionId), value };
  }

  if (q.type === "mcq" && q.options?.length && /^[A-E]$/i.test(value.trim())) {
    const letter = value.trim().toUpperCase();
    // Choose-TWO / letter-keyed answers stay as letters for either-order scoring
    if (/^[A-E]$/i.test(String(q.correct ?? "").trim()) || (q.chooseCount ?? 1) > 1) {
      return { id: q.id, value: letter };
    }
    const idx = letter.charCodeAt(0) - 65;
    const text = q.options[idx];
    if (text) return { id: q.id, value: text };
  }

  if (
    (q.type === "matching" || q.type === "matching-features") &&
    /^[A-J]$/i.test(value.trim())
  ) {
    return { id: q.id, value: value.trim().toUpperCase() };
  }

  return { id: q.id, value };
}

export type AlignValidationIssue = {
  partNumber: number;
  questionNumber: number;
  message: string;
};

export function validateQuestionRenderAlignment(
  partNumber: number,
  block: ListeningAudioBlock,
  questions: ListeningQuestion[]
): AlignValidationIssue[] {
  const issues: AlignValidationIssue[] = [];
  const planned = block.questionType ?? getTypeForQuestionNumber(partNumber, block.questionStart);
  const effective = resolveEffectiveBlockType(questions, planned);

  if (effective !== planned) {
    const allowed =
      (planned === "matching" && effective === "sentence-completion") ||
      (planned === "plan-map-diagram" && effective === "matching");
    if (!allowed) {
      issues.push({
        partNumber,
        questionNumber: block.questionStart,
        message: `block declares "${planned}" but questions render as "${effective}"`,
      });
    }
  }

  for (const q of questions) {
    if (planned === "multiple-choice") {
      const isChooseTwoPair =
        Boolean(q.eitherOrderGroup) || q.number === 19 || q.number === 20;
      const expected = isChooseTwoPair ? 5 : 3;
      const count = q.options?.length ?? 0;
      if (count !== expected) {
        issues.push({
          partNumber,
          questionNumber: q.number,
          message: `MCQ${isChooseTwoPair ? " (choose-TWO pair)" : ""} must have exactly ${expected} options (has ${count})`,
        });
      }
      if (isChooseTwoPair && !q.eitherOrderGroup) {
        issues.push({
          partNumber,
          questionNumber: q.number,
          message: `choose-TWO MCQ must set eitherOrderGroup`,
        });
      }
    }
    if (planned === "matching" || planned === "plan-map-diagram") {
      const count = q.options?.length ?? 0;
      const minOpts = planned === "plan-map-diagram" ? 8 : 2;
      if (count < minOpts) {
        issues.push({
          partNumber,
          questionNumber: q.number,
          message: `${planned} must include a lettered option box of at least ${minOpts} (has ${count})`,
        });
      }
      if (!/^[A-J]$/i.test(String(q.correct ?? "").trim())) {
        issues.push({
          partNumber,
          questionNumber: q.number,
          message: `${planned} answer must be a letter A–J (got "${q.correct}")`,
        });
      }
    }
    if (
      (planned === "form-completion" ||
        planned === "note-completion" ||
        planned === "table-completion" ||
        planned === "summary-completion" ||
        planned === "flowchart-completion" ||
        planned === "diagram-labelling") &&
      (q.options?.length ?? 0) > 0
    ) {
      issues.push({
        partNumber,
        questionNumber: q.number,
        message: `${planned} must not include answer options`,
      });
    }
  }

  return issues;
}
