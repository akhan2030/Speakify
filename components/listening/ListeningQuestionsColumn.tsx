"use client";

import { useMemo } from "react";
import ListeningIeltsInstruction from "@/components/ListeningIeltsInstruction";
import ListeningExampleQuestion from "@/components/ListeningExampleQuestion";
import ListeningMapVisual from "@/components/ListeningMapVisual";
import { ExamHighlightSection } from "@/components/exam/ExamHighlightSection";
import type { TextHighlight } from "@/lib/examHighlight";
import ListeningQuestions, {
  type ListeningQuestion,
} from "@/components/ListeningQuestions";
import { getGlobalQuestionRange } from "@/lib/listeningIeltsInstructions";
import { getMaxWordsForQuestionNumber } from "@/lib/listeningSectionTypes";
import { getMcqChooseCountForQuestions } from "@/lib/listeningQuestionContent.js";
import {
  resolveEffectiveGroupType,
  type QuestionGroup,
} from "@/lib/listeningQuestionGroups";
import { buildListeningMapVisual } from "@/lib/mock-test/listeningMapVisual";

function matchingRangeFromOptions(count: number): string {
  if (count <= 0) return "A–J";
  const end = String.fromCharCode(64 + Math.min(count, 10));
  return `A–${end}`;
}

function optionTexts(questions: ListeningQuestion[]): string[] {
  const withOpts = questions.find((q) => (q.options?.length ?? 0) >= 2);
  if (!withOpts?.options?.length) return [];
  return withOpts.options
    .map((o) => String(o.text ?? o.label ?? "").trim())
    .filter(Boolean);
}

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
  mapTitle,
  example,
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
  /** Optional title for auto-built Section 2 maps */
  mapTitle?: string;
  /** Spoken example from the same recording (Section 1) */
  example?: { questionText?: string; answerText?: string; answer?: string } | null;
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
        const texts = optionTexts(group.questions);
        const matchingRange = matchingRangeFromOptions(texts.length);
        const mapVisual =
          effectiveType === "plan-map-diagram" && texts.length >= 2
            ? buildListeningMapVisual(
                mapTitle?.trim() ||
                  sectionTitle?.trim() ||
                  `Section ${sectionNumber} — Site Map`,
                texts
              )
            : null;

        return (
          <div key={`${group.type}-${group.start}`} className="space-y-4">
            <h3 className="text-base font-bold text-[#1a1a1a]">
              Questions {group.start}–{group.end}
            </h3>
            {!hideInstructionBlock ? (
              <ListeningIeltsInstruction
                questionType={effectiveType}
                chooseCount={
                  effectiveType === "multiple-choice"
                    ? getMcqChooseCountForQuestions(group.questions)
                    : undefined
                }
                matchingRange={matchingRange}
                maxWords={getMaxWordsForQuestionNumber(
                  sectionNumber,
                  group.start
                )}
              />
            ) : null}
            {sectionNumber === 1 &&
            group.start === 1 &&
            effectiveType === "form-completion" &&
            (example?.answerText || example?.answer) ? (
              <ListeningExampleQuestion
                questionText={example.questionText}
                answerText={example.answerText || example.answer}
              />
            ) : null}
            {mapVisual ? <ListeningMapVisual map={mapVisual} /> : null}
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
                groupTitle={
                  group.type === "form-completion" ? sectionTitle : undefined
                }
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
