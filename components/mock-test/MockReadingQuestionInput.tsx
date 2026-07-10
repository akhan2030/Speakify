"use client";

import {
  HighlightableInlineText,
  HighlightableMcqOption,
  HighlightableRadioOption,
  HighlightableTfngOptions,
} from "@/components/exam/ExamHighlightSection";
import type { ReadingQuestion as RQ } from "@/lib/mock-test/types";
import { blockClipboard } from "@/lib/mock-test/utils";

const TFNG = ["TRUE", "FALSE", "NOT GIVEN"];
const YNNG = ["YES", "NO", "NOT GIVEN"];

export type ReadingQuestion = RQ;

export default function MockReadingQuestionInput({
  question,
  value,
  onChange,
}: {
  question: ReadingQuestion;
  value: string;
  onChange: (value: string) => void;
}) {
  if (question.kind === "multiple-choice" && question.options) {
    return (
      <div className="mt-2 space-y-2">
        {question.options.map((option) => (
          <HighlightableMcqOption
            key={option.key}
            blockId={`mock-rq-${question.id}-opt-${option.key}`}
            letter={option.key}
            text={option.label}
            name={question.id}
            checked={value === option.key}
            onSelect={() => onChange(option.key)}
            className="border-slate-200 bg-white hover:bg-slate-50"
          />
        ))}
      </div>
    );
  }

  if (question.kind === "true-false-not-given") {
    return (
      <HighlightableTfngOptions
        blockIdPrefix={`mock-rq-tfng-${question.id}`}
        name={question.id}
        options={TFNG}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (question.kind === "yes-no-not-given") {
    return (
      <HighlightableTfngOptions
        blockIdPrefix={`mock-rq-ynng-${question.id}`}
        name={question.id}
        options={YNNG}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (question.kind === "matching-headings" && question.headings) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        <option value="">Select heading…</option>
        {question.headings.map((h) => (
          <option key={h.key} value={h.key}>
            {h.key}. {h.label}
          </option>
        ))}
      </select>
    );
  }

  if (question.wordBank?.length) {
    return (
      <div>
        <p className="mb-2 text-xs text-slate-500">
          Word bank:{" "}
          <HighlightableInlineText
            blockId={`mock-rq-${question.id}-wordbank`}
            text={question.wordBank.join(" · ")}
          />
        </p>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
        >
          <option value="">Select word…</option>
          {question.wordBank.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...blockClipboard}
      className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
      placeholder="Your answer"
    />
  );
}
