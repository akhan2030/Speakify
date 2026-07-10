"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GT_LETTER_PROMPT_BANK,
  GT_TASK2_PROMPT_BANK,
  LETTER_TYPE_LABELS,
  getSessionGeneralLetterQuestion,
  getSessionGeneralTask2Question,
  setGeneralLetterById,
  setGeneralTask2ById,
  type GeneralLetterQuestion,
  type GeneralTask2Question,
} from "@/lib/ielts-general/writingTaskData";
import WritingCriteriaLegend from "@/components/writing/WritingCriteriaLegend";
import {
  canSubmitWriting,
  countWritingWords,
  getWritingWordLimits,
  truncateToWritingWordLimit,
  wordCountRangeLabel,
  writingWordLimitExceededMessage,
  writingWordMinimumMessage,
} from "@/lib/ielts/writingCriteria";

function countWords(text: string) {
  return countWritingWords(text);
}

type Props = {
  taskType: "task1" | "task2";
  essay: string;
  onEssayChange: (value: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  formClassName?: string;
  submitLabel?: string;
  hidePromptPicker?: boolean;
  letterQuestion?: GeneralLetterQuestion;
  task2Question?: GeneralTask2Question;
  onQuestionChange?: (meta: {
    questionPrompt: string;
    letterType?: GeneralLetterQuestion["letterType"];
    essayType?: string;
  }) => void;
};

export default function GeneralWritingPracticeForm({
  taskType,
  essay,
  onEssayChange,
  loading,
  error,
  onSubmit,
  formClassName = "mt-8 space-y-6",
  submitLabel = "Get Band Score",
  hidePromptPicker = false,
  letterQuestion: letterQuestionProp,
  task2Question: task2QuestionProp,
  onQuestionChange,
}: Props) {
  const [letterQuestion, setLetterQuestion] = useState<GeneralLetterQuestion | null>(
    letterQuestionProp ?? null
  );
  const [task2Question, setTask2Question] = useState<GeneralTask2Question | null>(
    task2QuestionProp ?? null
  );

  useEffect(() => {
    if (taskType === "task1") {
      const letter = letterQuestionProp ?? getSessionGeneralLetterQuestion();
      setLetterQuestion(letter);
      onQuestionChange?.({
        questionPrompt: letter.prompt,
        letterType: letter.letterType,
      });
    } else {
      const task2 = task2QuestionProp ?? getSessionGeneralTask2Question();
      setTask2Question(task2);
      onQuestionChange?.({
        questionPrompt: task2.prompt,
        essayType: task2.essayType,
      });
    }
  }, [taskType, letterQuestionProp, task2QuestionProp, onQuestionChange]);

  const words = useMemo(() => countWords(essay), [essay]);
  const { min: minWords, max: maxWords } = getWritingWordLimits(taskType);
  const belowMinimum = words > 0 && words < minWords;
  const atWordLimit = words === maxWords;
  const canSubmit = canSubmitWriting(essay, taskType);

  const wordCountClass =
    words === 0
      ? "text-slate-500"
      : belowMinimum
        ? "text-[#E24B4A]"
        : atWordLimit
          ? "text-amber-700"
          : "text-green-600";

  function handleEssayChange(value: string) {
    onEssayChange(truncateToWritingWordLimit(value, taskType));
  }

  function handleLetterSelect(index: number) {
    const next = GT_LETTER_PROMPT_BANK[index % GT_LETTER_PROMPT_BANK.length];
    if (!next) return;
    setGeneralLetterById(next.id);
    setLetterQuestion(next);
    onEssayChange("");
    onQuestionChange?.({
      questionPrompt: next.prompt,
      letterType: next.letterType,
    });
  }

  function handleTask2Select(index: number) {
    const next = GT_TASK2_PROMPT_BANK[index % GT_TASK2_PROMPT_BANK.length];
    if (!next) return;
    setGeneralTask2ById(next.id);
    setTask2Question(next);
    onEssayChange("");
    onQuestionChange?.({
      questionPrompt: next.prompt,
      essayType: next.essayType,
    });
  }

  if (taskType === "task1" && !letterQuestion) {
    return (
      <div className="mt-8 flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9972c]/30 border-t-[#c9972c]" />
      </div>
    );
  }

  if (taskType === "task2" && !task2Question) {
    return (
      <div className="mt-8 flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9972c]/30 border-t-[#c9972c]" />
      </div>
    );
  }

  const isLetter = taskType === "task1";

  return (
    <form onSubmit={onSubmit} className={formClassName}>
      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-[#0d1b35] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            IELTS General Training — {isLetter ? "Task 1: Letter" : "Task 2: Essay"}
          </span>
          {!hidePromptPicker ? (
            isLetter ? (
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-medium">Letter scenario:</span>
                <select
                  value={GT_LETTER_PROMPT_BANK.findIndex((q) => q.id === letterQuestion!.id)}
                  onChange={(e) => handleLetterSelect(Number(e.target.value))}
                  disabled={loading}
                  className="max-w-[220px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-[#0d1b35] focus:border-[#c9972c] focus:outline-none"
                >
                  {GT_LETTER_PROMPT_BANK.map((q, i) => (
                    <option key={q.id} value={i}>
                      {LETTER_TYPE_LABELS[q.letterType]} — {q.title}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <span className="font-medium">Essay topic:</span>
                <select
                  value={GT_TASK2_PROMPT_BANK.findIndex((q) => q.id === task2Question!.id)}
                  onChange={(e) => handleTask2Select(Number(e.target.value))}
                  disabled={loading}
                  className="max-w-[220px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-[#0d1b35] focus:border-[#c9972c] focus:outline-none"
                >
                  {GT_TASK2_PROMPT_BANK.map((q, i) => (
                    <option key={q.id} value={i}>
                      {q.label} — {q.title}
                    </option>
                  ))}
                </select>
              </label>
            )
          ) : isLetter ? (
            <span className="rounded-full bg-[#c9972c]/10 px-2.5 py-1 text-xs font-semibold text-[#c9972c]">
              {LETTER_TYPE_LABELS[letterQuestion!.letterType]}
            </span>
          ) : (
            <span className="rounded-full bg-[#0d9488]/10 px-2.5 py-1 text-xs font-semibold text-[#0d9488]">
              {task2Question!.label}
            </span>
          )}
        </div>

        {isLetter ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <strong>General Training Task 1</strong> is always a letter — not a graph, chart, or
              table report (that is Academic only).
            </div>
            <div className="rounded-lg border border-[#c9972c]/30 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Letter type
              </p>
              <p className="mt-1 text-base font-bold text-[#c9972c]">
                {LETTER_TYPE_LABELS[letterQuestion!.letterType]}
              </p>
            </div>
            <p className="text-sm leading-relaxed text-[#0d1b35]">{letterQuestion!.situation}</p>
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">
                Write a letter to {letterQuestion!.writeTo}. In your letter, you should:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                {letterQuestion!.bulletPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
              <p className="text-xs font-semibold uppercase text-slate-500">Begin your letter as follows:</p>
              <p className="mt-1 font-medium text-[#0d1b35]">{letterQuestion!.beginAs}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <strong>General Training Task 2</strong> is an essay ({wordCountRangeLabel("task2")})
              on an everyday topic — same essay format as Academic Task 2, but different prompt style.
            </div>
            <div className="mt-4 rounded-lg border border-[#0d9488]/30 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Essay type
              </p>
              <p className="mt-1 text-base font-bold text-[#0d9488]">{task2Question!.label}</p>
            </div>
            <p className="mt-1 text-sm font-semibold text-[#0d1b35]">{task2Question!.title}</p>
            <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#0d1b35]">
              {task2Question!.prompt}
            </div>
          </>
        )}
      </div>

      <div>
        <label htmlFor={`general-writing-response-${taskType}`} className="text-sm font-semibold text-[#0d1b35]">
          {isLetter ? "Your letter" : "Your essay"}
        </label>
        <textarea
          id={`general-writing-response-${taskType}`}
          value={essay}
          onChange={(e) => handleEssayChange(e.target.value)}
          placeholder={
            isLetter
              ? "Dear Sir or Madam,\n\nI am writing to…\n\nYours faithfully,"
              : "Write your essay here. Introduction → body paragraphs → conclusion…"
          }
          rows={14}
          disabled={loading}
          className="mt-2 min-h-[320px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c]/30 disabled:bg-slate-50"
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <p className={`text-sm font-medium ${wordCountClass}`}>
            Word count: <span className="font-bold">{words}</span>
            <span className="text-slate-400"> / {wordCountRangeLabel(taskType)}</span>
          </p>
          {canSubmit ? (
            <span className="text-xs font-medium text-green-600">✓ Ready to submit</span>
          ) : null}
        </div>

        {belowMinimum ? (
          <div className="mt-3 rounded-xl border border-[#E24B4A]/40 bg-red-50 px-4 py-3 text-sm text-[#E24B4A]">
            {writingWordMinimumMessage(taskType)}
          </div>
        ) : null}

        {atWordLimit ? (
          <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {writingWordLimitExceededMessage(taskType)}
          </div>
        ) : null}
      </div>

      <WritingCriteriaLegend taskType={taskType} />

      {error ? <p className="text-sm text-[#E24B4A]">{error}</p> : null}

      <button
        type="submit"
        disabled={loading || !canSubmit}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9972c] py-3 font-semibold text-[#0d1b35] shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#0d1b35]/30 border-t-[#0d1b35]" />
            Evaluating...
          </>
        ) : (
          submitLabel
        )}
      </button>
      {!canSubmit ? (
        <p className="text-center text-xs text-slate-500">
          Write between {minWords} and {maxWords} words to enable scoring
        </p>
      ) : null}
    </form>
  );
}
