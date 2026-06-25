"use client";

import { useEffect, useState } from "react";
import type { NormalizedReadingPassage } from "@/lib/accelerator/normalizePracticeContent";
import PracticeQuestionField, { QuestionPrompt } from "@/components/accelerator/PracticeQuestionField";

const NAVY = "#0d1b35";

export default function PracticeReadingPanel({
  passages,
  answers,
  onChange,
}: {
  passages: NormalizedReadingPassage[];
  answers: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const [passageIdx, setPassageIdx] = useState(0);
  const passage = passages[passageIdx];

  useEffect(() => {
    for (const p of passages) {
      for (const q of p.questions) {
        console.log("[Accelerator] Reading question payload:", {
          passageId: p.id,
          key: q.key,
          type: q.type,
          label: q.label,
          options: q.options,
          validationErrors: q.validationErrors,
          raw: q.raw,
        });
      }
    }
  }, [passages]);

  if (!passages.length) {
    return (
      <p className="text-sm text-slate-600">
        No reading passages found in this test. The content may need to be regenerated.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {passages.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPassageIdx(i)}
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              i === passageIdx ? "bg-[#c9972c] text-[#0d1b35]" : "bg-slate-100 text-slate-600"
            }`}
          >
            Passage {p.id}
            {p.validationErrors.length ? " ⚠" : ""}
          </button>
        ))}
      </div>

      {passage ? (
        <>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="font-bold" style={{ color: NAVY }}>
              {passage.title}
            </h3>
            {passage.validationErrors.length ? (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Passage validation: {passage.validationErrors.join("; ")}
              </div>
            ) : null}
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
              {passage.text || "Passage text not available."}
            </p>
          </div>

          <div className="space-y-5">
            {passage.questions.map((q) => (
              <div key={q.key}>
                <QuestionPrompt question={q} />
                <PracticeQuestionField
                  question={q}
                  value={answers[q.key] ?? ""}
                  onChange={(v) => onChange(q.key, v)}
                />
              </div>
            ))}
          </div>
        </>
      ) : null}

      {passages.length > 1 ? (
        <div className="flex justify-between gap-3">
          <button
            type="button"
            disabled={passageIdx === 0}
            onClick={() => setPassageIdx((i) => i - 1)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:opacity-40"
          >
            ← Previous passage
          </button>
          <button
            type="button"
            disabled={passageIdx >= passages.length - 1}
            onClick={() => setPassageIdx((i) => i + 1)}
            className="rounded-lg bg-[#c9972c] px-4 py-2 text-sm font-bold text-[#0d1b35] disabled:opacity-40"
          >
            Next passage →
          </button>
        </div>
      ) : null}
    </div>
  );
}
