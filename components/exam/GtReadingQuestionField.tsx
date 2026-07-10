"use client";

import {
  HighlightableInlineText,
  HighlightableMcqOption,
  HighlightableRadioOption,
  HighlightableTfngOptions,
} from "@/components/exam/ExamHighlightSection";
import type { GtReadingQuestion } from "@/lib/ielts-general/readingContent";
import {
  gtUsesDropdown,
  gtUsesOptionPicker,
  normalizeGtOptions,
} from "@/lib/ielts-general/readingQuestionView";

const TFNG = ["TRUE", "FALSE", "NOT GIVEN"] as const;

export default function GtReadingQuestionField({
  question,
  value,
  onChange,
  disabled,
}: {
  question: GtReadingQuestion;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  if (question.type === "true_false_not_given") {
    return (
      <HighlightableTfngOptions
        blockIdPrefix={`gt-tfng-${question.id}`}
        name={question.id}
        options={TFNG}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="gap-3"
      />
    );
  }

  const options = normalizeGtOptions(question.options);

  if (gtUsesOptionPicker(question.type) && options.length) {
    if (gtUsesDropdown(question.type)) {
      return (
        <select
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          className="mt-2 w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
        >
          <option value="">Select an option…</option>
          {options.map((opt, i) => (
            <option key={`${question.id}-opt-${i}`} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    }

    return (
      <div className="mt-2 space-y-2">
        {options.map((opt, i) => {
          const letter = String.fromCharCode(65 + i);
          const hasLetterPrefix = /^\s*[A-H][\.\)]\s/i.test(opt);
          return hasLetterPrefix ? (
            <HighlightableMcqOption
              key={`${question.id}-opt-${i}`}
              blockId={`gt-mcq-${question.id}-opt-${letter}`}
              letter={letter}
              text={opt.replace(/^\s*[A-H][\.\)]\s*/i, "")}
              name={question.id}
              checked={value === opt}
              disabled={disabled}
              onSelect={() => onChange(opt)}
              className={
                value === opt ? "border-[#0d9488] bg-[#0d9488]/10" : "border-slate-200"
              }
            />
          ) : (
            <HighlightableRadioOption
              key={`${question.id}-opt-${i}`}
              blockId={`gt-mcq-${question.id}-opt-${i}`}
              name={question.id}
              label={opt}
              checked={value === opt}
              disabled={disabled}
              onSelect={() => onChange(opt)}
              className={
                value === opt ? "border-[#0d9488] bg-[#0d9488]/10" : "border-slate-200"
              }
            />
          );
        })}
      </div>
    );
  }

  return (
    <input
      type="text"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      placeholder="Your answer"
      className="mt-2 w-full max-w-md rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
    />
  );
}

/** Highlightable completion-style prompt (label before blank). */
export function GtHighlightableCompletionPrompt({
  blockId,
  number,
  text,
}: {
  blockId: string;
  number: number | string;
  text: string;
}) {
  return (
    <span className="text-sm text-slate-800">
      <span className="font-semibold tabular-nums text-[#0d1b35]">{number}. </span>
      <HighlightableInlineText blockId={blockId} text={text} />
    </span>
  );
}
