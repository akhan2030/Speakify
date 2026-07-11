import type { ListeningExamPart } from "./listeningExam";
import type { ListeningQuestion } from "./types";
import { getTypeForQuestionNumber } from "../listeningSectionTypes";
import {
  enrichBreakMessage,
  defaultFormTitle,
} from "./mockListeningDisplay";
import { alignQuestionsToSectionPlan } from "./listeningQuestionAlign";
import { pickSpeakersForSection } from "../listeningSpeakerAssignment.js";
import { bindSpeakersForMultiVoice } from "../listeningMultiVoiceBind.js";

type QSpec = [
  number,
  ListeningQuestion["type"],
  string,
  string,
  string[]?,
];

type BlockSpec = {
  questionStart: number;
  questionEnd: number;
  prepMessage?: string;
  breakMessage?: string;
  transcript: string;
  voice: string;
  questionType?: string;
  formTitle?: string;
};

export type CompactListeningVariant = {
  mockNumber: number;
  introTexts: [string, string, string, string];
  blocks: BlockSpec[];
  questions: QSpec[];
};

function q(
  num: number,
  section: 1 | 2 | 3 | 4,
  type: ListeningQuestion["type"],
  prompt: string,
  correct: string,
  options?: string[]
): ListeningQuestion {
  return {
    id: `mock-l${section}-q${num}`,
    number: num,
    section,
    type,
    prompt,
    correct,
    options,
  };
}

export function buildListeningPartsFromVariant(
  variant: CompactListeningVariant
): ListeningExamPart[] {
  const partNums = [1, 2, 3, 4] as const;
  return partNums.map((partNumber) => {
    const partQuestions = variant.questions
      .filter(([num]) => {
        if (partNumber === 1) return num <= 10;
        if (partNumber === 2) return num >= 11 && num <= 20;
        if (partNumber === 3) return num >= 21 && num <= 30;
        return num >= 31;
      })
      .map(([num, type, prompt, correct, options]) =>
        q(num, partNumber, type, prompt, correct, options)
      );

    const alignedQuestions = alignQuestionsToSectionPlan(partQuestions, partNumber);

    const partBlocks = variant.blocks.filter((b) => {
      const start = b.questionStart;
      if (partNumber === 1) return start <= 10;
      if (partNumber === 2) return start >= 11 && start <= 20;
      if (partNumber === 3) return start >= 21 && start <= 30;
      return start >= 31;
    });

    const speakerPick = pickSpeakersForSection(
      partNumber,
      { testSeed: `mock-${variant.mockNumber}-s${partNumber}` } as {
        excludeNames?: string[];
        testSeed?: string;
      }
    );

    const partTranscript = partBlocks.map((b) => b.transcript).join("\n");
    const boundSpeakers = bindSpeakersForMultiVoice(
      partTranscript,
      partNumber,
      speakerPick.speakers
    );

    return {
      partNumber,
      introText: variant.introTexts[partNumber - 1],
      speakers: boundSpeakers as ListeningExamPart["speakers"],
      blocks: partBlocks.map((b, blockIndex) => {
        const questionType =
          b.questionType ?? getTypeForQuestionNumber(partNumber, b.questionStart);
        const formTitle =
          b.formTitle ??
          (questionType === "form-completion" ? defaultFormTitle(partNumber) : undefined);
        const tableHeaders =
          questionType === "table-completion"
            ? (["Item", "Detail"] as const)
            : undefined;

        let prepMessage = b.prepMessage;
        let breakMessage = b.breakMessage;

        if (blockIndex > 0 && breakMessage) {
          breakMessage = enrichBreakMessage(
            { ...b, questionType },
            partNumber,
            breakMessage
          );
        } else if (blockIndex > 0) {
          const range = `${b.questionStart} to ${b.questionEnd}`;
          breakMessage = enrichBreakMessage(
            { ...b, questionType },
            partNumber,
            `You now have 30 seconds to look at Questions ${range}.`
          );
        }

        return {
          questionStart: b.questionStart,
          questionEnd: b.questionEnd,
          prepMessage,
          breakMessage,
          transcript: b.transcript,
          sectionNumber: partNumber,
          voice: b.voice,
          questionType,
          formTitle,
          tableHeaders: tableHeaders ? [...tableHeaders] : undefined,
        };
      }),
      questions: alignedQuestions,
    };
  });
}
