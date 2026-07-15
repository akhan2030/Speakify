"use client";

import { useState } from "react";

export type ReflectionRatings = {
  speaking: number;
  reading: number;
  writing: number;
  listening: number;
};

export type SelfReflectionProps = {
  title?: string;
  instruction?: string;
  prompt?: string;
  initialRatings?: Partial<ReflectionRatings>;
  initialNote?: string;
  onChange?: (data: { ratings: ReflectionRatings; note: string }) => void;
};

const SKILLS: { key: keyof ReflectionRatings; label: string }[] = [
  { key: "speaking", label: "Speaking" },
  { key: "reading", label: "Reading" },
  { key: "writing", label: "Writing" },
  { key: "listening", label: "Listening" },
];

export default function SelfReflection({
  title = "Self-reflection",
  instruction = "Rate yourself from 1 (need more practice) to 5 (confident today).",
  prompt = "What will you practise next time?",
  initialRatings,
  initialNote = "",
  onChange,
}: SelfReflectionProps) {
  const [ratings, setRatings] = useState<ReflectionRatings>({
    speaking: initialRatings?.speaking ?? 3,
    reading: initialRatings?.reading ?? 3,
    writing: initialRatings?.writing ?? 3,
    listening: initialRatings?.listening ?? 3,
  });
  const [note, setNote] = useState(initialNote);

  function setRating(key: keyof ReflectionRatings, value: number) {
    const next = { ...ratings, [key]: value };
    setRatings(next);
    onChange?.({ ratings: next, note });
  }

  function setNoteValue(value: string) {
    setNote(value);
    onChange?.({ ratings, note: value });
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6a1f]">
        Reflection
      </p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-sm text-slate-600">{instruction}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {SKILLS.map(({ key, label }) => (
          <div
            key={key}
            className="rounded-xl border border-slate-100 bg-[#f7f4ef] p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-slate-800">{label}</span>
              <span className="text-sm font-medium text-[#8a6a1f]">
                {ratings[key]} / 5
              </span>
            </div>
            <div className="mt-3 flex gap-1.5" role="group" aria-label={`${label} rating`}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(key, n)}
                  aria-pressed={ratings[key] === n}
                  className={`h-10 flex-1 rounded-lg text-sm font-medium transition-colors ${
                    ratings[key] === n
                      ? "bg-[#8a6a1f] text-white"
                      : ratings[key] > n
                        ? "bg-[#d4c4a0]/60 text-slate-800"
                        : "border border-slate-200 bg-white text-slate-500 hover:border-[#8a6a1f]"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <label className="mt-5 block">
        <span className="text-sm font-semibold text-slate-800">{prompt}</span>
        <textarea
          value={note}
          onChange={(e) => setNoteValue(e.target.value)}
          rows={3}
          placeholder="Write a short note…"
          className="mt-2 w-full rounded-xl border border-slate-200 bg-[#fcfbf8] px-3 py-2.5 text-sm outline-none focus:border-[#8a6a1f] focus:ring-1 focus:ring-[#8a6a1f]"
        />
      </label>
    </section>
  );
}
