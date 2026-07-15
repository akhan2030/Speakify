"use client";

import { useState } from "react";

export type MCQBlockProps = {
  id: string | number;
  prompt: string;
  options: string[];
  correctAnswer: string;
  showAnswer?: boolean;
  onResult?: (correct: boolean) => void;
};

export default function MCQBlock({
  id,
  prompt,
  options,
  correctAnswer,
  showAnswer = false,
  onResult,
}: MCQBlockProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const reveal = submitted || showAnswer;
  const isCorrect =
    selected !== null &&
    selected.trim().toLowerCase() === correctAnswer.trim().toLowerCase();

  function handleSubmit() {
    if (!selected) return;
    setSubmitted(true);
    const ok =
      selected.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
    onResult?.(ok);
  }

  function handleReset() {
    setSelected(null);
    setSubmitted(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        Q{id}
      </p>
      <p className="mt-1 text-base font-medium leading-relaxed text-slate-900">
        {prompt}
      </p>

      <fieldset className="mt-4 space-y-2" disabled={submitted && !showAnswer}>
        <legend className="sr-only">Options</legend>
        {options.map((option) => {
          const chosen = selected === option;
          let style =
            "border-slate-200 bg-[#f7f4ef] hover:border-slate-300 hover:bg-white";

          if (reveal && chosen) {
            style = isCorrect
              ? "border-emerald-500 bg-emerald-50 text-emerald-900"
              : "border-red-400 bg-red-50 text-red-900";
          } else if (
            reveal &&
            showAnswer &&
            option.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
          ) {
            style = "border-emerald-500 bg-emerald-50 text-emerald-900";
          } else if (chosen) {
            style = "border-[#8a6a1f] bg-white ring-1 ring-[#8a6a1f]";
          }

          return (
            <label
              key={option}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${style}`}
            >
              <input
                type="radio"
                name={`mcq-${id}`}
                value={option}
                checked={chosen}
                onChange={() => {
                  setSelected(option);
                  if (submitted) setSubmitted(false);
                }}
                className="mt-0.5 accent-[#8a6a1f]"
              />
              <span>{option}</span>
            </label>
          );
        })}
      </fieldset>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!submitted ? (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!selected}
            className="rounded-md bg-[#8a6a1f] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Check answer
          </button>
        ) : (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Try again
          </button>
        )}

        {submitted ? (
          <span
            className={`text-sm font-medium ${
              isCorrect ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {isCorrect ? "Correct" : "Not quite — try again"}
          </span>
        ) : null}

        {showAnswer && !submitted ? (
          <span className="text-sm text-emerald-700">
            Answer: {correctAnswer}
          </span>
        ) : null}
      </div>
    </div>
  );
}
