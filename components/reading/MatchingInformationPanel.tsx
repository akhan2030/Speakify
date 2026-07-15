"use client";

import {
  ExamHighlightQuestionText,
} from "@/components/exam/ExamHighlightSection";

type ParagraphOption = { key: string; label: string };

type MatchingInfoQuestion = {
  id: string;
  text: string;
  options?: ParagraphOption[];
};

export default function MatchingInformationPanel({
  paragraphLetters,
  questions,
  answers,
  onChange,
  feedback,
}: {
  paragraphLetters: string[];
  questions: MatchingInfoQuestion[];
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
  feedback?: Record<string, { correct: boolean; correctAnswer: string }> | null;
}) {
  const letters =
    paragraphLetters.length > 0
      ? paragraphLetters
      : Array.from(
          new Set(
            questions.flatMap((q) => (q.options ?? []).map((o) => o.key))
          )
        ).sort();

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c9972c]">
          Which paragraph contains the following information?
        </p>
        <p className="mt-2 text-xs text-slate-600">
          Write the correct letter, {letters[0] ?? "A"}–
          {letters[letters.length - 1] ?? "G"}. You may use any letter more
          than once.
        </p>
        <p className="mt-2 text-xs font-semibold text-slate-500">
          Paragraphs: {letters.join(", ")}
        </p>
      </div>

      <div className="space-y-3">
        {questions.map((question, index) => {
          const result = feedback?.[question.id];
          return (
            <div
              key={question.id}
              className={`rounded-lg border bg-white p-4 ${
                result
                  ? result.correct
                    ? "border-green-300"
                    : "border-red-300"
                  : "border-slate-200"
              }`}
            >
              <label className="block text-sm font-semibold text-[#0d1b35]">
                <ExamHighlightQuestionText
                  blockId={`mi-q-${question.id}`}
                  number={index + 1}
                  text={question.text}
                />
              </label>
              <select
                value={answers[question.id] ?? ""}
                onChange={(e) => onChange(question.id, e.target.value)}
                disabled={Boolean(feedback)}
                className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
              >
                <option value="">Select a paragraph…</option>
                {letters.map((letter) => (
                  <option key={letter} value={letter}>
                    {letter}
                  </option>
                ))}
              </select>
              {result ? (
                <p
                  className={`mt-2 text-xs font-semibold ${
                    result.correct ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {result.correct
                    ? `Correct — Paragraph ${result.correctAnswer}`
                    : `Incorrect — correct answer: Paragraph ${result.correctAnswer}`}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
