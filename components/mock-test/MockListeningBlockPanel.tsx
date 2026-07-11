"use client";

import ListeningIeltsInstruction from "@/components/ListeningIeltsInstruction";
import ListeningQuestions from "@/components/ListeningQuestions";
import { buildMockListeningBlockHeader } from "@/lib/mock-test/mockListeningDisplay";
import {
  adaptMockQuestionsForUi,
  mapUiAnswerToMock,
  resolveEffectiveBlockType,
} from "@/lib/mock-test/listeningQuestionAlign";
import type { ListeningAudioBlock } from "@/lib/mock-test/listeningExam";
import type { ListeningQuestion } from "@/lib/mock-test/types";

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
  }

  return (
    <section
      className={`space-y-4 ${isFollowOnBlock ? "border-t border-slate-200 pt-6" : ""}`}
      aria-label={`${header.rangeLabel} ${header.typeLabel}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        {showSectionBadge ? (
          <span className="rounded-full bg-[#0d1b35]/10 px-3 py-1 text-xs font-semibold text-[#0d1b35]">
            {header.sectionLabel}
          </span>
        ) : null}
        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
          {header.rangeLabel}
        </span>
        <span className="rounded-full bg-[#c9972c]/20 px-3 py-1 text-xs font-semibold text-[#0d1b35]">
          {header.typeLabel}
        </span>
      </div>

      {block.formTitle ? (
        <h3 className="text-base font-bold text-[#0d1b35]">{block.formTitle}</h3>
      ) : null}

      <ListeningIeltsInstruction questionType={effectiveType} />

      <ListeningQuestions
        questions={uiQuestions}
        answers={uiAnswers}
        disabled={!inputsEnabled}
        questionType={effectiveType}
        onChange={(questionId, value) => {
          const mapped = mapUiAnswerToMock(questionId, value, questions);
          onAnswer(mapped.id, mapped.value);
        }}
      />
    </section>
  );
}
