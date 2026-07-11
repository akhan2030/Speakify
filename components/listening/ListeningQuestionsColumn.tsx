"use client";

import { useMemo } from "react";
import ListeningIeltsInstruction from "@/components/ListeningIeltsInstruction";
import { ExamHighlightSection } from "@/components/exam/ExamHighlightSection";
import type { TextHighlight } from "@/lib/examHighlight";
import ListeningQuestions, {
  type ListeningQuestion,
} from "@/components/ListeningQuestions";
import { getGlobalQuestionRange } from "@/lib/listeningIeltsInstructions";
import { getMcqChooseCountForQuestions } from "@/lib/listeningQuestionContent.js";
import {
  resolveEffectiveGroupType,
  type QuestionGroup,
} from "@/lib/listeningQuestionGroups";

export function ListeningQuestionsColumn({
  groups,
  answers,
  onChange,
  disabled,
  highlightAnswered,
  sectionNumber,
  hideInstructionBlock = false,
  sectionTitle,
  answerKey = "id",
  highlights = [],
  onHighlightsChange,
}: {
  groups: QuestionGroup[];
  answers: Record<string | number, string>;
  onChange: (id: number | string, value: string) => void;
  disabled: boolean;
  highlightAnswered: boolean;
  sectionNumber: number;
  hideInstructionBlock?: boolean;
  sectionTitle?: string;
  /** Use "questionNumber" for full mock (global Q1–40 keys) */
  answerKey?: "id" | "questionNumber";
  highlights?: TextHighlight[];
  onHighlightsChange?: (next: TextHighlight[]) => void;
}) {
  const answeredIds = useMemo(() => {
    const ids = new Set<number | string>();
    for (const group of groups) {
      for (const q of group.questions) {
        const key =
          answerKey === "questionNumber"
            ? (q.questionNumber ?? q.id)
            : q.id;
        if (String(answers[key] ?? "").trim()) ids.add(q.id);
      }
    }
    return ids;
  }, [answers, groups, answerKey]);

  const globalRange = getGlobalQuestionRange(sectionNumber);

  const resolveChange = (q: ListeningQuestion, value: string) => {
    const key =
      answerKey === "questionNumber"
        ? (q.questionNumber ?? q.id)
        : q.id;
    onChange(key, value);
  };

  const resolveValue = (q: ListeningQuestion) => {
    const key =
      answerKey === "questionNumber"
        ? (q.questionNumber ?? q.id)
        : q.id;
    return answers[key] ?? "";
  };

  return (
    <ExamHighlightSection
      sectionId={`listening-section-${sectionNumber}`}
      highlights={highlights}
      onHighlightsChange={onHighlightsChange ?? (() => {})}
      showToolbar={Boolean(onHighlightsChange)}
      className="space-y-8"
      toolbarClassName="mb-2"
    >
      <div>
        <h2 className="text-lg font-bold text-[#0d1b35]">
          Questions {globalRange.label}
        </h2>
      </div>
      {groups.map((group) => {
        const effectiveType = resolveEffectiveGroupType(group);
        return (
        <div key={`${group.type}-${group.start}`} className="space-y-4">
          {group.type === "form-completion" && sectionTitle ? (
            <h3 className="text-base font-bold text-[#0d1b35]">{sectionTitle}</h3>
          ) : null}
          <h3 className="text-sm font-bold uppercase tracking-widest text-[#c9972c]">
            QUESTIONS {group.start}–{group.end}
          </h3>
          {!hideInstructionBlock ? (
            <ListeningIeltsInstruction
              questionType={effectiveType}
              chooseCount={
                effectiveType === "multiple-choice"
                  ? getMcqChooseCountForQuestions(group.questions)
                  : undefined
              }
            />
          ) : null}
          <div className="w-full">
            <ListeningQuestions
              questions={group.questions}
              answers={Object.fromEntries(
                group.questions.map((q) => [q.id, resolveValue(q)])
              )}
              onChange={(id, value) => {
                const q = group.questions.find((x) => x.id === id);
                if (q) resolveChange(q, value);
              }}
              disabled={disabled}
              questionType={effectiveType}
              highlightAnswered={highlightAnswered}
              answeredIds={answeredIds}
            />
          </div>
        </div>
        );
      })}
    </ExamHighlightSection>
  );
}
