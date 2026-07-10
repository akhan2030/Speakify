"use client";

import {
  ExamHighlightQuestionText,
  HighlightableInlineText,
} from "@/components/exam/ExamHighlightSection";

type HeadingOption = { key: string; label: string };

type MatchingQuestion = {
  id: string;
  text: string;
  paragraphId?: string;
  headings?: HeadingOption[];
};

export default function MatchingHeadingsPanel({
  headings,
  questions,
  answers,
  onChange,
}: {
  headings: HeadingOption[];
  questions: MatchingQuestion[];
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c9972c]">
          List of Headings
        </p>
        <ul className="mt-3 space-y-2">
          {headings.map((heading) => (
            <li
              key={heading.key}
              className="text-sm leading-snug text-slate-700"
            >
              <span className="font-bold text-[#0d1b35]">{heading.key}.</span>{" "}
              <HighlightableInlineText
                blockId={`mh-heading-${heading.key}`}
                text={heading.label}
              />
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Choose a heading for each paragraph
        </p>
        {questions.map((question, index) => (
          <div
            key={question.id}
            className="rounded-lg border border-slate-200 bg-white p-4"
          >
            <label className="block text-sm font-semibold text-[#0d1b35]">
              <ExamHighlightQuestionText
                blockId={`mh-q-${question.id}`}
                number={index + 1}
                text={question.text}
              />
            </label>
            <select
              value={answers[question.id] ?? ""}
              onChange={(e) => onChange(question.id, e.target.value)}
              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              <option value="">Select a heading…</option>
              {headings.map((heading) => (
                <option key={heading.key} value={heading.key}>
                  {heading.key}. {heading.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
