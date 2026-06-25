"use client";

import type { PracticeQuestion } from "@/lib/accelerator/normalizePracticeContent";
import {
  isCompletionQuestionType,
  isMcqQuestionType,
} from "@/lib/accelerator/listeningQuestionUtils";

const NAVY = "#0d1b35";

export default function PracticeQuestionField({
  question,
  value,
  onChange,
  showCompletionStyle = false,
}: {
  question: PracticeQuestion;
  value: string;
  onChange: (v: string) => void;
  showCompletionStyle?: boolean;
}) {
  if (isMcqQuestionType(question.questionType ?? question.type)) {
    const opts = question.formattedOptions.filter((o) => o.text.trim());
    if (opts.length < 2) {
      return null;
    }

    return (
      <div className="mt-2 space-y-2">
        {opts.map((opt) => (
          <label
            key={`${question.key}-${opt.letter}`}
            className="flex cursor-pointer items-start gap-2.5 py-1 text-sm text-slate-800"
          >
            <input
              type="radio"
              name={question.key}
              checked={value === opt.value || value === opt.letter}
              onChange={() => onChange(opt.value)}
              className="mt-0.5 shrink-0"
            />
            <span className="leading-relaxed">
              <strong className="mr-1">{opt.letter}</strong>
              {opt.text}
            </span>
          </label>
        ))}
      </div>
    );
  }

  if (
    question.questionType === "true_false_not_given" ||
    question.type === "tfng"
  ) {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {["TRUE", "FALSE", "NOT GIVEN"].map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm"
          >
            <input type="radio" checked={value === opt} onChange={() => onChange(opt)} />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  if (question.questionType === "yes_no_not_given" || question.type === "ynng") {
    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {["YES", "NO", "NOT GIVEN"].map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm"
          >
            <input type="radio" checked={value === opt} onChange={() => onChange(opt)} />
            {opt}
          </label>
        ))}
      </div>
    );
  }

  const useCompletion =
    showCompletionStyle ||
    isCompletionQuestionType(question.questionType ?? question.type);

  if (useCompletion) {
    const cleanLabel = (question.questionText || question.label)
      .replace(/_+/g, "")
      .replace(/:\s*$/, ":")
      .trim();
    return (
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1 py-2.5 text-sm text-slate-800">
        <span className="font-semibold tabular-nums" style={{ color: NAVY }}>
          {question.number}.
        </span>
        <span>{cleanLabel}</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-[140px] flex-1 border-0 border-b border-slate-400 bg-transparent px-1 py-0.5 text-sm focus:border-[#c9972c] focus:outline-none"
          aria-label={`Answer for question ${question.number}`}
        />
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="mt-2 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
      placeholder="Your answer"
    />
  );
}

export function McqQuestionPrompt({ question }: { question: PracticeQuestion }) {
  return (
    <p className="mb-2 text-sm font-medium leading-relaxed text-slate-900">
      <span className="font-bold" style={{ color: NAVY }}>
        {question.number}.
      </span>{" "}
      {question.questionText || question.label}
    </p>
  );
}

export function IeltsFormCompletionHeader({
  startNum,
  endNum,
}: {
  startNum: number;
  endNum: number;
}) {
  const range =
    startNum === endNum ? `Question ${startNum}` : `Questions ${startNum}–${endNum}`;

  return (
    <div className="mb-5 space-y-2">
      <h3 className="text-base font-bold" style={{ color: NAVY }}>
        {range}
      </h3>
      <p className="text-sm font-medium text-slate-800">Complete the form below.</p>
      <p
        className="inline-block rounded px-3 py-2 text-sm font-semibold"
        style={{ backgroundColor: "#fef3c7", color: NAVY }}
      >
        Write <strong>NO MORE THAN TWO WORDS AND/OR A NUMBER</strong> for each answer.
      </p>
    </div>
  );
}

export function IeltsMcqHeader({
  startNum,
  endNum,
  compact = false,
}: {
  startNum: number;
  endNum: number;
  compact?: boolean;
}) {
  const range =
    startNum === endNum ? `Question ${startNum}` : `Questions ${startNum}–${endNum}`;

  return (
    <div
      className={
        compact
          ? "mb-6 space-y-2"
          : "mb-6 mt-8 space-y-2 border-t border-slate-300 pt-6"
      }
    >
      <h3 className="text-base font-bold" style={{ color: NAVY }}>
        {range}
      </h3>
      <p className="text-sm text-slate-700">
        Choose the correct letter, A, B, C or D.
      </p>
    </div>
  );
}

export function PracticeRefreshMessage() {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-center">
      <p className="text-sm font-medium text-slate-700">
        This practice set is being refreshed. Please try again.
      </p>
    </div>
  );
}
