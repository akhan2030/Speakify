"use client";

import { getMaxWordsForQuestionNumber } from "@/lib/listeningSectionTypes";
import ListeningIeltsInstruction from "@/components/ListeningIeltsInstruction";
import ListeningExampleQuestion from "@/components/ListeningExampleQuestion";
import ListeningMapVisual from "@/components/ListeningMapVisual";
import ListeningQuestions from "@/components/ListeningQuestions";
import { buildMockListeningBlockHeader } from "@/lib/mock-test/mockListeningDisplay";
import {
  adaptMockQuestionsForUi,
  mapUiAnswerToMock,
  resolveEffectiveBlockType,
} from "@/lib/mock-test/listeningQuestionAlign";
import type { ListeningAudioBlock } from "@/lib/mock-test/listeningExam";
import type { ListeningQuestion } from "@/lib/mock-test/types";

function matchingRangeFromOptions(count: number): string {
  if (count <= 0) return "A–J";
  const end = String.fromCharCode(64 + Math.min(count, 10));
  return `A–${end}`;
}

export default function MockListeningBlockPanel({
  partNumber,
  block,
  questions,
  answers,
  inputsEnabled,
  onAnswer,
  showSectionBadge = true,
  isFollowOnBlock = false,
}: {
  partNumber: number;
  block: ListeningAudioBlock;
  questions: ListeningQuestion[];
  answers: Record<string, string>;
  inputsEnabled: boolean;
  onAnswer: (id: string, value: string) => void;
  showSectionBadge?: boolean;
  isFollowOnBlock?: boolean;
}) {
  const plannedType =
    block.questionType ??
    buildMockListeningBlockHeader(partNumber, block).questionType;
  const effectiveType = resolveEffectiveBlockType(questions, plannedType);
  const header = buildMockListeningBlockHeader(partNumber, {
    ...block,
    questionType: effectiveType,
  });

  const uiQuestions = adaptMockQuestionsForUi(questions, effectiveType, block);
  const optionCount =
    questions.find((q) => (q.options?.length ?? 0) >= 2)?.options?.length ?? 0;
  const matchingRange = matchingRangeFromOptions(optionCount);
  const chooseCount = questions.some((q) => q.eitherOrderGroup)
    ? 2
    : Math.max(1, ...questions.map((q) => Number(q.chooseCount ?? 1)));
  const maxWords = getMaxWordsForQuestionNumber(partNumber, block.questionStart);

  const spokenExample = (() => {
    if (partNumber !== 1 || block.questionStart !== 1) return null;
    if (effectiveType !== "form-completion") return null;
    const transcript = String(block.transcript ?? "");
    const title = String(block.formTitle ?? block.contentTitle ?? "").trim();
    const name = title.split(/\s*[—–-]\s*/)[0]?.trim();
    if (name && name.length >= 3 && transcript.toLowerCase().includes(name.toLowerCase())) {
      return {
        questionText: `The booking is for ....................... ?`,
        answerText: name,
      };
    }
    return null;
  })();

  const uiAnswers: Record<string | number, string> = {};
  for (const q of questions) {
    uiAnswers[q.number] = answers[q.id] ?? "";
    if (q.type === "mcq" && q.options?.length) {
      const stored = answers[q.id] ?? "";
      const idx = q.options.findIndex(
        (opt) => opt.toLowerCase() === stored.toLowerCase()
      );
      if (idx >= 0) uiAnswers[q.number] = String.fromCharCode(65 + idx);
    }
    if (
      (q.type === "matching" || q.type === "matching-features") &&
      q.options?.length
    ) {
      const stored = (answers[q.id] ?? "").trim();
      if (/^[A-J]$/i.test(stored)) {
        uiAnswers[q.number] = stored.toUpperCase();
      } else {
        const idx = q.options.findIndex(
          (opt) => opt.toLowerCase() === stored.toLowerCase()
        );
        if (idx >= 0) uiAnswers[q.number] = String.fromCharCode(65 + idx);
      }
    }
  }

  return (
    <section
      className={`space-y-4 ${isFollowOnBlock ? "border-t border-slate-300 pt-6" : ""}`}
      aria-label={`${header.rangeLabel} ${header.typeLabel}`}
    >
      <h3 className="text-base font-bold text-[#1a1a1a]">{header.rangeLabel}</h3>

      <ListeningIeltsInstruction
        questionType={effectiveType}
        matchingRange={matchingRange}
        chooseCount={effectiveType === "multiple-choice" ? chooseCount : undefined}
        maxWords={maxWords}
      />

      {spokenExample ? (
        <ListeningExampleQuestion
          questionText={spokenExample.questionText}
          answerText={spokenExample.answerText}
        />
      ) : null}

      {block.mapVisual?.kind === "map" && block.mapVisual.locations.length > 0 ? (
        <ListeningMapVisual map={block.mapVisual} />
      ) : null}

      <ListeningQuestions
        questions={uiQuestions}
        answers={uiAnswers}
        disabled={!inputsEnabled}
        questionType={effectiveType}
        groupTitle={block.contentTitle ?? block.formTitle}
        onChange={(questionId, value) => {
          const mapped = mapUiAnswerToMock(questionId, value, questions);
          onAnswer(mapped.id, mapped.value);
        }}
      />
    </section>
  );
}
