"use client";

import { useState } from "react";

export type WritingTaskProps = {
  title?: string;
  prompt: string;
  targetWords?: number;
  teacherReviewNote?: string;
  checklist?: string[];
  initialValue?: string;
  onChange?: (value: string) => void;
};

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export default function WritingTask({
  title = "Writing",
  prompt,
  targetWords = 120,
  teacherReviewNote = "Your teacher will review this in class. Save or copy your draft before you leave.",
  checklist = [],
  initialValue = "",
  onChange,
}: WritingTaskProps) {
  const [text, setText] = useState(initialValue);
  const words = countWords(text);
  const nearTarget = words >= Math.floor(targetWords * 0.8);
  const atTarget = words >= targetWords;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6a1f]">
        Writing
      </p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{prompt}</p>

      <div className="mt-4 flex items-center justify-between gap-3 text-sm">
        <span className="text-slate-500">Target: ~{targetWords} words</span>
        <span
          className={`font-medium ${
            atTarget
              ? "text-emerald-700"
              : nearTarget
                ? "text-[#8a6a1f]"
                : "text-slate-600"
          }`}
        >
          {words} word{words === 1 ? "" : "s"}
        </span>
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange?.(e.target.value);
        }}
        rows={10}
        placeholder="Write your response here…"
        className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fcfbf8] px-4 py-3 text-[15px] leading-7 text-slate-900 outline-none focus:border-[#8a6a1f] focus:ring-1 focus:ring-[#8a6a1f]"
      />

      {checklist.length > 0 ? (
        <div className="mt-4">
          <p className="text-sm font-semibold text-slate-800">Checklist</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            {checklist.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <aside className="mt-4 rounded-xl border border-[#d4c4a0] bg-[#f7f4ef] px-4 py-3 text-sm text-slate-700">
        <span className="font-semibold text-[#8a6a1f]">Teacher review · </span>
        {teacherReviewNote}
      </aside>
    </section>
  );
}
