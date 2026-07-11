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
  if (mockType === "mcq") return "multiple-choice";
  if (mockType === "matching" || mockType === "matching-features") {
    return planned === "sentence-completion" ? "sentence-completion" : "matching";
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
  if (sample.type === "matching" || sample.type === "matching-features") {
    return (sample.options?.length ?? 0) >= 2 ? "matching" : "sentence-completion";
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

/** Enforce section plan on question records at build time (single pipeline). */
export function alignQuestionsToSectionPlan(
  questions: ListeningQuestion[],
  sectionNumber: number
): ListeningQuestion[] {
  return questions.map((q) => {
    const planned = getTypeForQuestionNumber(sectionNumber, q.number);
    let type = inferMockTypeFromPlan(planned);

    if (planned === "multiple-choice") {
      type = "mcq";
      const opts = (q.options ?? []).slice(0, 3);
      return {
        ...q,
        type,
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
      planned === "short-answer"
    ) {
      return { ...q, type, options: undefined };
    }

    if (planned === "matching" || planned === "plan-map-diagram") {
      return {
        ...q,
        type: "matching",
        options: q.options,
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
      const opts = q.options.slice(0, 3).map((text, i) => ({
        label: String.fromCharCode(65 + i),
        text,
      }));
      return {
        id: q.number,
        questionNumber: q.number,
        type: "multiple-choice",
        text: q.prompt,
        options: opts,
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

    if (effective === "matching" && (q.options?.length ?? 0) >= 2) {
      return {
        id: q.number,
        questionNumber: q.number,
        type: "matching",
        text: q.prompt,
        options: q.options!.map((text, i) => ({
          label: String.fromCharCode(65 + i),
          text,
        })),
      };
    }

    const gapText =
      effective === "note-completion" && !q.prompt.includes("___")
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

  if (q.type === "mcq" && q.options?.length && /^[A-C]$/i.test(value.trim())) {
    const idx = value.trim().toUpperCase().charCodeAt(0) - 65;
    const text = q.options[idx];
    if (text) return { id: q.id, value: text };
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
      planned === "matching" && effective === "sentence-completion";
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
      const count = q.options?.length ?? 0;
      if (count !== 3) {
        issues.push({
          partNumber,
          questionNumber: q.number,
          message: `MCQ must have exactly 3 options (has ${count})`,
        });
      }
    }
    if (
      (planned === "form-completion" ||
        planned === "note-completion" ||
        planned === "table-completion" ||
        planned === "summary-completion") &&
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
