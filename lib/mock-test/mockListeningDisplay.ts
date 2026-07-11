import {
  formatQuestionTypeLabel,
  getBreakInstructionLine,
} from "@/lib/listeningIeltsInstructions";
import {
  getSectionPlan,
  getTypeForQuestionNumber,
} from "@/lib/listeningSectionTypes";
import type { ListeningAudioBlock, ListeningExamPart } from "./listeningExam";
import type { ListeningQuestion } from "./types";
import { validateQuestionRenderAlignment } from "./listeningQuestionAlign";

export function resolveBlockQuestionType(
  partNumber: number,
  block: Pick<ListeningAudioBlock, "questionStart" | "questionEnd" | "questionType">
): string {
  return (
    block.questionType ??
    getTypeForQuestionNumber(partNumber, block.questionStart)
  );
}

export function formatMockListeningRange(start: number, end: number): string {
  return start === end ? `Question ${start}` : `Questions ${start}–${end}`;
}

export function buildMockListeningBlockHeader(
  partNumber: number,
  block: Pick<ListeningAudioBlock, "questionStart" | "questionEnd" | "questionType">
) {
  const questionType = resolveBlockQuestionType(partNumber, block);
  return {
    sectionLabel: `Section ${partNumber} of 4`,
    rangeLabel: formatMockListeningRange(block.questionStart, block.questionEnd),
    typeLabel: formatQuestionTypeLabel(questionType),
    questionType,
  };
}

export function enrichBreakMessage(
  block: Pick<ListeningAudioBlock, "questionStart" | "questionEnd" | "questionType">,
  partNumber: number,
  baseMessage: string
): string {
  const questionType = resolveBlockQuestionType(partNumber, block);
  const instruction = getBreakInstructionLine(questionType);
  const trimmed = baseMessage.trim();
  if (!instruction) return trimmed;
  if (trimmed.toLowerCase().includes(instruction.toLowerCase().slice(0, 24))) {
    return trimmed;
  }
  return `${trimmed} — ${instruction}`;
}

export function defaultFormTitle(partNumber: number): string | undefined {
  if (partNumber !== 1) return undefined;
  return getSectionPlan(1).blocks[0]?.promptHint.includes("form")
    ? "Registration Form"
    : undefined;
}

export type MockListeningBlockGroup = {
  block: ListeningAudioBlock;
  questions: ListeningQuestion[];
};

export function getVisibleListeningBlockGroups(
  part: ListeningExamPart,
  step: "intro" | "prep" | "audio" | "break" | "check",
  blockIdx: number
): MockListeningBlockGroup[] {
  if (step === "intro") return [];

  if (step === "check") {
    return part.blocks.map((block) => ({
      block,
      questions: part.questions.filter(
        (q) => q.number >= block.questionStart && q.number <= block.questionEnd
      ),
    }));
  }

  const block = part.blocks[blockIdx];
  if (!block) return [];

  return [
    {
      block,
      questions: part.questions.filter(
        (q) => q.number >= block.questionStart && q.number <= block.questionEnd
      ),
    },
  ];
}

export type MockListeningValidationIssue = {
  mockNumber: number;
  partNumber: number;
  message: string;
};

export function validateMockListeningParts(
  parts: ListeningExamPart[],
  mockNumber = 1
): MockListeningValidationIssue[] {
  const issues: MockListeningValidationIssue[] = [];

  for (const part of parts) {
    if (!part.blocks.length) {
      issues.push({
        mockNumber,
        partNumber: part.partNumber,
        message: "missing audio blocks",
      });
      continue;
    }

    for (const block of part.blocks) {
      const blockQuestions = part.questions.filter(
        (q) => q.number >= block.questionStart && q.number <= block.questionEnd
      );
      const questionType = resolveBlockQuestionType(part.partNumber, block);
      if (!questionType) {
        issues.push({
          mockNumber,
          partNumber: part.partNumber,
          message: `block Q${block.questionStart}–${block.questionEnd} missing questionType`,
        });
      }

      for (const alignIssue of validateQuestionRenderAlignment(
        part.partNumber,
        block,
        blockQuestions
      )) {
        issues.push({
          mockNumber,
          partNumber: alignIssue.partNumber,
          message: `Q${alignIssue.questionNumber}: ${alignIssue.message}`,
        });
      }

      if (
        part.partNumber === 1 &&
        block.questionStart === 1 &&
        questionType === "form-completion"
      ) {
        const q1 = part.questions.find((q) => q.number === 1);
        const q2 = part.questions.find((q) => q.number === 2);
        const p1 = (q1?.prompt ?? "").toLowerCase();
        const p2 = (q2?.prompt ?? "").toLowerCase();
        if (!p1.includes("first name")) {
          issues.push({
            mockNumber,
            partNumber: 1,
            message: "Q1 must be First name (not combined name field)",
          });
        }
        if (!p2.includes("surname") && !p2.includes("family name")) {
          issues.push({
            mockNumber,
            partNumber: 1,
            message: "Q2 must be Surname or Family name",
          });
        }
        const transcript = block.transcript;
        if (!/[A-Za-z]-[A-Za-z]-[A-Za-z]/.test(transcript)) {
          issues.push({
            mockNumber,
            partNumber: 1,
            message: "Section 1 form audio must spell surname letter-by-letter",
          });
        }
        if (
          transcript.toLowerCase().includes("delegate name") ||
          p1.includes("full name")
        ) {
          issues.push({
            mockNumber,
            partNumber: 1,
            message: "Section 1 must not use combined full/delegate name field",
          });
        }
      }
    }

    if (part.partNumber <= 3 && part.blocks.length < 2) {
      issues.push({
        mockNumber,
        partNumber: part.partNumber,
        message: "sections 1–3 require two question-type blocks",
      });
    }

    if (part.partNumber === 1 && part.blocks.length >= 2) {
      const t0 = resolveBlockQuestionType(part.partNumber, part.blocks[0]);
      const t1 = resolveBlockQuestionType(part.partNumber, part.blocks[1]);
      if (t0 === t1) {
        issues.push({
          mockNumber,
          partNumber: 1,
          message: "Section 1 blocks must use different question types",
        });
      }
    }
  }

  return issues;
}
