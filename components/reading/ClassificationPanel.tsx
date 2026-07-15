"use client";

import { ExamHighlightQuestionText } from "@/components/exam/ExamHighlightSection";

type CategoryOption = { key: string; label: string };

type ClassificationQuestion = {
  id: string;
  text: string;
  options?: CategoryOption[];
};

export default function ClassificationPanel({
  categories,
  questions,
  answers,
  onChange,
  feedback,
}: {
  categories: CategoryOption[];
  questions: ClassificationQuestion[];
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
  feedback?: Record<string, { correct: boolean; correctAnswer: string }> | null;
}) {
  const list =
    categories.length > 0
      ? categories
      : Array.from(
          new Map(
            questions.flatMap((q) =>
              (q.options ?? []).map((o) => [
                o.key,
                { key: o.key, label: o.label.replace(/^[A-D]\.\s*/, "") },
              ])
            )
          ).values()
        );

  const first = list[0]?.key ?? "A";
  const last = list[list.length - 1]?.key ?? "D";

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c9972c]">
          Classification
        </p>
        <p className="mt-2 text-xs text-slate-600">
          Classify each statement. Write the correct letter, {first}–{last}.
          You may use any letter more than once.
        </p>
        <ul className="mt-3 space-y-1.5">
          {list.map((cat) => (
            <li key={cat.key} className="text-sm text-slate-700">
              <span className="font-bold text-[#0d1b35]">{cat.key}</span>
              {" — "}
              {cat.label}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        {questions.map((question, index) => {
          const result = feedback?.[question.id];
          const correctLabel =
            list.find((c) => c.key === result?.correctAnswer)?.label ??
            result?.correctAnswer;
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
                  blockId={`cl-q-${question.id}`}
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
                <option value="">Select a category…</option>
                {list.map((cat) => (
                  <option key={cat.key} value={cat.key}>
                    {cat.key}. {cat.label}
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
                    ? `Correct — ${result.correctAnswer}${
                        correctLabel && correctLabel !== result.correctAnswer
                          ? ` (${correctLabel})`
                          : ""
                      }`
                    : `Incorrect — correct answer: ${result.correctAnswer}${
                        correctLabel && correctLabel !== result.correctAnswer
                          ? ` (${correctLabel})`
                          : ""
                      }`}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
