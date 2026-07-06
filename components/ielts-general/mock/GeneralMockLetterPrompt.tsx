"use client";

import { LETTER_TYPE_LABELS, type GeneralMockWritingTask1 } from "@/lib/ielts-general/mockExamContent";

export default function GeneralMockLetterPrompt({
  task,
}: {
  task: GeneralMockWritingTask1;
}) {
  const { letter } = task;
  const tone = LETTER_TYPE_LABELS[letter.letterType];

  return (
    <div className="mb-4 rounded-xl border border-[#0d9488]/30 bg-[#0d9488]/5 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#0d9488] px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">
          General Training Task 1
        </span>
        <span className="rounded-full border border-[#0d9488]/40 px-2.5 py-0.5 text-[10px] font-semibold text-[#0d9488]">
          {tone} letter
        </span>
        <span className="text-xs text-slate-500">{letter.label}</span>
      </div>
      <p className="mt-3 text-sm font-medium text-[#0d1b35]">{letter.situation}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        In your letter:
      </p>
      <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
        {letter.bulletPoints.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        Write at least 150 words. Do not describe a chart or graph — this is a letter only.
      </p>
    </div>
  );
}
