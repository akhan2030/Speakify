"use client";

import type { PracticeQuestion } from "@/lib/accelerator/normalizePracticeContent";
import {
  isCompletionQuestionType,
  isMcqQuestionType,
} from "@/lib/accelerator/listeningQuestionUtils";
import {
  ExamHighlightQuestionText,
  HighlightableInlineText,
  HighlightableMcqOption,
  HighlightableTfngOptions,
} from "@/components/exam/ExamHighlightSection";
import { GtHighlightableCompletionPrompt } from "@/components/exam/GtReadingQuestionField";

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
          <HighlightableMcqOption
            key={`${question.key}-${opt.letter}`}
            blockId={`acc-mcq-${question.key}-opt-${opt.letter}`}
            letter={opt.letter}
            text={opt.text}
            name={question.key}
            checked={value === opt.value || value === opt.letter}
            onSelect={() => onChange(opt.value)}
          />
        ))}
      </div>
    );
  }

  if (
    question.questionType === "true_false_not_given" ||
    question.type === "tfng"
  ) {
    return (
      <HighlightableTfngOptions
        blockIdPrefix={`acc-tfng-${question.key}`}
        name={question.key}
        options={["TRUE", "FALSE", "NOT GIVEN"]}
        value={value}
        onChange={onChange}
      />
    );
  }

  if (question.questionType === "yes_no_not_given" || question.type === "ynng") {
    return (
      <HighlightableTfngOptions
        blockIdPrefix={`acc-ynng-${question.key}`}
        name={question.key}
        options={["YES", "NO", "NOT GIVEN"]}
        value={value}
        onChange={onChange}
      />
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
        <GtHighlightableCompletionPrompt
          blockId={`acc-completion-${question.key}`}
          number={question.number}
          text={cleanLabel}
        />
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
      <ExamHighlightQuestionText
        blockId={`acc-q-${question.key}`}
        number={question.number}
        text={question.questionText || question.label}
      />
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
      <p className="text-sm font-medium text-slate-800">
        <HighlightableInlineText
          blockId={`acc-form-header-${startNum}`}
          text="Complete the form below."
        />
      </p>
      <p
        className="inline-block rounded px-3 py-2 text-sm font-semibold"
        style={{ backgroundColor: "#fef3c7", color: NAVY }}
      >
        <HighlightableInlineText
          blockId={`acc-form-limit-${startNum}`}
          text="Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer."
        />
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
        <HighlightableInlineText
          blockId={`acc-mcq-header-${startNum}`}
          text="Choose the correct letter, A, B, C or D."
        />
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
