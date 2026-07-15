"use client";

import { useState } from "react";

export type FillBlankProps = {
  id?: string | number;
  prompt: string;
  answer: string | string[];
  blankToken?: string;
  showAnswer?: boolean;
  onResult?: (correct: boolean) => void;
};

function answersMatch(value: string, answer: string | string[]): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  const list = Array.isArray(answer) ? answer : [answer];
  return list.some((a) => a.trim().toLowerCase() === normalized);
}

/** Replace first blank marker (______ or ___) with an inline input slot indicator. */
function splitPrompt(prompt: string, blankToken = "______"): string[] {
  if (prompt.includes(blankToken)) {
    return prompt.split(blankToken);
  }
  if (prompt.includes("___")) {
    return prompt.split("___");
  }
  return [prompt, ""];
}

export default function FillBlank({
  id,
  prompt,
  answer,
  blankToken = "______",
  showAnswer = false,
  onResult,
}: FillBlankProps) {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const parts = splitPrompt(prompt, blankToken);
  const correct = answersMatch(value, answer);
  const reveal = submitted || showAnswer;

  function handleCheck() {
    setSubmitted(true);
    onResult?.(answersMatch(value, answer));
  }

  function handleReset() {
    setValue("");
    setSubmitted(false);
  }

  const inputClass = reveal
    ? correct
      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
      : submitted
        ? "border-red-400 bg-red-50 text-red-900"
        : "border-slate-300 bg-white"
    : "border-slate-300 bg-white focus:border-[#8a6a1f] focus:ring-1 focus:ring-[#8a6a1f]";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      {id != null ? (
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Q{id}
        </p>
      ) : null}

      <p className="mt-1 flex flex-wrap items-baseline gap-x-1 gap-y-2 text-base leading-relaxed text-slate-900">
        <span>{parts[0]}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (submitted) setSubmitted(false);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCheck();
          }}
          className={`inline-block min-w-[8rem] max-w-full rounded-md border px-2.5 py-1.5 text-center text-sm outline-none sm:min-w-[10rem] ${inputClass}`}
          aria-label="Fill in the blank"
          placeholder="…"
        />
        {parts[1] ? <span>{parts.slice(1).join(blankToken)}</span> : null}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {!submitted ? (
          <button
            type="button"
            onClick={handleCheck}
            disabled={!value.trim()}
            className="rounded-md bg-[#8a6a1f] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Check
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
              correct ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {correct ? "Correct" : "Not quite — try again"}
          </span>
        ) : null}

        {showAnswer ? (
          <span className="text-sm text-emerald-700">
            Answer: {Array.isArray(answer) ? answer.join(" / ") : answer}
          </span>
        ) : null}
      </div>
    </div>
  );
}
