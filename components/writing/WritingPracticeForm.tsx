"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TASK1_QUESTIONS,
  TASK2_QUESTIONS,
  getSessionTask1Question,
  getSessionTask2Question,
  setTask1QuestionIndex,
  setTask2QuestionIndex,
  type Task1Question,
  type Task2Question,
} from "@/lib/ielts/writingTaskData";
import WritingTaskVisual from "@/components/writing/WritingTaskVisual";

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

const VISUAL_TYPE_LABELS: Record<Task1Question["visualType"], string> = {
  bar: "Bar chart",
  line: "Line graph",
  pie: "Pie chart",
  table: "Table",
  map: "Map",
  process: "Process diagram",
};

type Props = {
  taskType: "task1" | "task2";
  onTaskTypeChange: (task: "task1" | "task2") => void;
  essay: string;
  onEssayChange: (value: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
  hideTaskToggle?: boolean;
  formClassName?: string;
  submitLabel?: string;
};

export default function WritingPracticeForm({
  taskType,
  onTaskTypeChange,
  essay,
  onEssayChange,
  loading,
  error,
  onSubmit,
  hideTaskToggle = false,
  formClassName = "mt-8 space-y-6",
  submitLabel = "Get Band Score",
}: Props) {
  const [task1Question, setTask1Question] = useState<Task1Question | null>(null);
  const [task2Question, setTask2Question] = useState<Task2Question | null>(null);

  useEffect(() => {
    setTask1Question(getSessionTask1Question());
    setTask2Question(getSessionTask2Question());
  }, []);

  const words = useMemo(() => countWords(essay), [essay]);
  const minWords = taskType === "task1" ? 150 : 250;
  const belowMinimum = words > 0 && words < minWords;
  const meetsMinimum = words >= minWords;

  const wordCountClass =
    words === 0 ? "text-slate-500" : belowMinimum ? "text-[#E24B4A]" : "text-green-600";

  function handleTask1Select(index: number) {
    setTask1QuestionIndex(index);
    setTask1Question(TASK1_QUESTIONS[index % TASK1_QUESTIONS.length]);
    onEssayChange("");
  }

  function handleTask2Select(index: number) {
    setTask2QuestionIndex(index);
    setTask2Question(TASK2_QUESTIONS[index % TASK2_QUESTIONS.length]);
    onEssayChange("");
  }

  if (!task1Question || !task2Question) {
    return (
      <div className="mt-8 flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-[#c9972c]/30 border-t-[#c9972c]" />
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={formClassName}>
      {!hideTaskToggle ? (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onTaskTypeChange("task1")}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
              taskType === "task1"
                ? "bg-[#c9972c] text-[#0d1b35]"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Task 1
            <span className="mt-0.5 block text-xs font-normal opacity-80">Report writing · min. 150 words</span>
          </button>
          <button
            type="button"
            onClick={() => onTaskTypeChange("task2")}
            disabled={loading}
            className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
              taskType === "task2"
                ? "bg-[#c9972c] text-[#0d1b35]"
                : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            Task 2
            <span className="mt-0.5 block text-xs font-normal opacity-80">Essay writing · min. 250 words</span>
          </button>
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 shadow-sm">
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-[#0d1b35] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
            IELTS Academic — Writing {taskType === "task1" ? "Task 1" : "Task 2"}
          </span>
          {taskType === "task1" ? (
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium">Visual type:</span>
              <select
                value={TASK1_QUESTIONS.findIndex((q) => q.id === task1Question.id)}
                onChange={(e) => handleTask1Select(Number(e.target.value))}
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-[#0d1b35] focus:border-[#c9972c] focus:outline-none"
              >
                {TASK1_QUESTIONS.map((q, i) => (
                  <option key={q.id} value={i}>
                    {VISUAL_TYPE_LABELS[q.visualType]}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <span className="font-medium">Essay type:</span>
              <select
                value={TASK2_QUESTIONS.findIndex((q) => q.id === task2Question.id)}
                onChange={(e) => handleTask2Select(Number(e.target.value))}
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-[#0d1b35] focus:border-[#c9972c] focus:outline-none"
              >
                {TASK2_QUESTIONS.map((q, i) => (
                  <option key={q.id} value={i}>
                    {q.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <div className="mt-4 whitespace-pre-line text-sm leading-relaxed text-[#0d1b35]">
          {taskType === "task1" ? task1Question.prompt : task2Question.prompt}
        </div>

        {taskType === "task1" ? (
          <div className="mt-5">
            <WritingTaskVisual question={task1Question} />
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-[#0d9488]/30 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Essay type</p>
            <p className="mt-1 text-base font-bold text-[#0d9488]">{task2Question.label}</p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor={`writing-response-${taskType}`} className="text-sm font-semibold text-[#0d1b35]">
          Your response
        </label>
        <textarea
          id={`writing-response-${taskType}`}
          value={essay}
          onChange={(e) => onEssayChange(e.target.value)}
          placeholder={
            taskType === "task1"
              ? "Write your report here. Begin with an overview of the main trends…"
              : "Write your essay here. State your position clearly in the introduction…"
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
            {taskType === "task2" ? (
              <>
                Your essay is below 250 words. Task 2 requires a minimum of 250 words — continue
                writing before submitting.
              </>
            ) : (
              <>
                Your report is below 150 words. Task 1 requires a minimum of 150 words — continue
                writing before submitting.
              </>
            )}
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
      {!meetsMinimum ? (
        <p className="text-center text-xs text-slate-500">
          Write at least {minWords} words to enable scoring
        </p>
      ) : null}
    </form>
  );
}
