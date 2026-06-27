"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GENERAL_LETTER_QUESTIONS,
  GENERAL_TASK2_QUESTIONS,
  LETTER_TYPE_LABELS,
  getSessionGeneralLetterQuestion,
  getSessionGeneralTask2Question,
  setGeneralLetterQuestionIndex,
  setGeneralTask2QuestionIndex,
  type GeneralLetterQuestion,
  type GeneralTask2Question,
} from "@/lib/ielts-general/writingTaskData";

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
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
  onQuestionChange,
}: Props) {
  const [letterQuestion, setLetterQuestion] = useState<GeneralLetterQuestion | null>(null);
  const [task2Question, setTask2Question] = useState<GeneralTask2Question | null>(null);

  useEffect(() => {
    if (taskType === "task1") {
      const letter = getSessionGeneralLetterQuestion();
      setLetterQuestion(letter);
      onQuestionChange?.({
        questionPrompt: letter.prompt,
        letterType: letter.letterType,
      });
    } else {
      const task2 = getSessionGeneralTask2Question();
      setTask2Question(task2);
      onQuestionChange?.({
        questionPrompt: task2.prompt,
        essayType: task2.essayType,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load prompt once per task type mount
  }, [taskType]);

  const words = useMemo(() => countWords(essay), [essay]);
  const minWords = taskType === "task1" ? 150 : 250;
  const belowMinimum = words > 0 && words < minWords;
  const meetsMinimum = words >= minWords;

  const wordCountClass =
    words === 0 ? "text-slate-500" : belowMinimum ? "text-[#E24B4A]" : "text-green-600";

  function handleLetterSelect(index: number) {
    setGeneralLetterQuestionIndex(index);
    const next = GENERAL_LETTER_QUESTIONS[index % GENERAL_LETTER_QUESTIONS.length];
    setLetterQuestion(next);
    onEssayChange("");
    onQuestionChange?.({
      questionPrompt: next.prompt,
      letterType: next.letterType,
    });
  }

  function handleTask2Select(index: number) {
    setGeneralTask2QuestionIndex(index);
    const next = GENERAL_TASK2_QUESTIONS[index % GENERAL_TASK2_QUESTIONS.length];
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
          {isLetter ? (
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium">Letter scenario:</span>
              <select
                value={GENERAL_LETTER_QUESTIONS.findIndex((q) => q.id === letterQuestion!.id)}
                onChange={(e) => handleLetterSelect(Number(e.target.value))}
                disabled={loading}
                className="max-w-[220px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-[#0d1b35] focus:border-[#c9972c] focus:outline-none"
              >
                {GENERAL_LETTER_QUESTIONS.map((q, i) => (
                  <option key={q.id} value={i}>
                    {LETTER_TYPE_LABELS[q.letterType]} — {q.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium">Essay topic:</span>
              <select
                value={GENERAL_TASK2_QUESTIONS.findIndex((q) => q.id === task2Question!.id)}
                onChange={(e) => handleTask2Select(Number(e.target.value))}
                disabled={loading}
                className="max-w-[220px] rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-[#0d1b35] focus:border-[#c9972c] focus:outline-none"
              >
                {GENERAL_TASK2_QUESTIONS.map((q, i) => (
                  <option key={q.id} value={i}>
                    {q.label} — {q.prompt.slice(0, 48)}…
                  </option>
                ))}
              </select>
            </label>
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
              <p className="text-xs font-semibold uppercase text-slate-500">In your letter, you should:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-slate-700">
                {letterQuestion!.bulletPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <strong>General Training Task 2</strong> is an essay (250+ words) on an everyday topic
              — same essay format as Academic Task 2, but different prompt style.
            </div>
            <div className="mt-4 rounded-lg border border-[#0d9488]/30 bg-white px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Essay type
              </p>
              <p className="mt-1 text-base font-bold text-[#0d9488]">{task2Question!.essayType}</p>
            </div>
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
          onChange={(e) => onEssayChange(e.target.value)}
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
            <span className="text-slate-400"> / minimum {minWords}</span>
          </p>
          {meetsMinimum ? (
            <span className="text-xs font-medium text-green-600">✓ Minimum reached</span>
          ) : null}
        </div>

        {belowMinimum ? (
          <div className="mt-3 rounded-xl border border-[#E24B4A]/40 bg-red-50 px-4 py-3 text-sm text-[#E24B4A]">
            {isLetter
              ? "Your letter is below 150 words. Task 1 requires at least 150 words."
              : "Your essay is below 250 words. Task 2 requires at least 250 words."}
          </div>
        ) : null}
      </div>

      {error ? <p className="text-sm text-[#E24B4A]">{error}</p> : null}

      <button
        type="submit"
        disabled={loading || !meetsMinimum}
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
    </form>
  );
}
