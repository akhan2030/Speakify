"use client";

import { ExamHighlightQuestionText } from "@/components/exam/ExamHighlightSection";

type EndingOption = { key: string; label: string };

type MseQuestion = {
  id: string;
  text: string;
};

export default function MatchingSentenceEndingsPanel({
  endings,
  questions,
  answers,
  onChange,
  feedback,
}: {
  endings: EndingOption[];
  questions: MseQuestion[];
  answers: Record<string, string>;
  onChange: (id: string, value: string) => void;
  feedback?: Record<string, { correct: boolean; correctAnswer: string }> | null;
}) {
  const usedKeys = new Set(
    Object.entries(answers)
      .filter(([, value]) => Boolean(value))
      .map(([, value]) => value)
  );

  const first = endings[0]?.key ?? "A";
  const last = endings[endings.length - 1]?.key ?? "H";

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c9972c]">
          List of Endings
        </p>
        <p className="mt-2 text-xs text-slate-600">
          Complete each sentence with the correct ending. Choose from the box
          below and write the correct letter, {first}–{last}. There are more
          endings than sentences. You may use each letter once only.
        </p>
        <ul className="mt-3 space-y-1.5">
          {endings.map((ending) => {
            const used = usedKeys.has(ending.key) && !feedback;
            return (
              <li
                key={ending.key}
                className={`text-sm ${
                  used ? "text-slate-400 line-through" : "text-slate-700"
                }`}
              >
                <span className="font-bold text-[#0d1b35]">{ending.key}</span>
                {" — "}
                {ending.label}
                {used ? (
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    used
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="space-y-3">
        {questions.map((question, index) => {
          const result = feedback?.[question.id];
          const selected = answers[question.id] ?? "";
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
                  blockId={`mse-q-${question.id}`}
                  number={index + 1}
                  text={question.text}
                />
              </label>
              <select
                value={selected}
                onChange={(e) => onChange(question.id, e.target.value)}
                disabled={Boolean(feedback)}
                className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm disabled:bg-slate-50"
              >
                <option value="">Select an ending…</option>
                {endings.map((ending) => {
                  const takenByOther =
                    usedKeys.has(ending.key) && selected !== ending.key;
                  return (
                    <option
                      key={ending.key}
                      value={ending.key}
                      disabled={takenByOther}
                    >
                      {ending.key}. {ending.label}
                      {takenByOther ? " (used)" : ""}
                    </option>
                  );
                })}
              </select>
              {result ? (
                <p
                  className={`mt-2 text-xs font-semibold ${
                    result.correct ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {result.correct
                    ? `Correct — Ending ${result.correctAnswer}`
                    : `Incorrect — correct answer: Ending ${result.correctAnswer}`}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
