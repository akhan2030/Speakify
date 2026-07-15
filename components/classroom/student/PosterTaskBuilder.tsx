"use client";

import { useState } from "react";

export type PosterTaskBuilderProps = {
  title?: string;
  instruction?: string;
  defaultSlogan?: string;
  defaultBullets?: [string, string, string] | string[];
  onChange?: (data: { slogan: string; bullets: string[] }) => void;
};

export default function PosterTaskBuilder({
  title = "Lesson 5 · Poster task",
  instruction = "Create a simple classroom poster. Add a slogan and three clear points.",
  defaultSlogan = "",
  defaultBullets = ["", "", ""],
  onChange,
}: PosterTaskBuilderProps) {
  const [slogan, setSlogan] = useState(defaultSlogan);
  const [bullets, setBullets] = useState<string[]>([
    defaultBullets[0] ?? "",
    defaultBullets[1] ?? "",
    defaultBullets[2] ?? "",
  ]);

  function updateBullet(index: number, value: string) {
    const next = [...bullets];
    next[index] = value;
    setBullets(next);
    onChange?.({ slogan, bullets: next });
  }

  function updateSlogan(value: string) {
    setSlogan(value);
    onChange?.({ slogan: value, bullets });
  }

  return (
    <section className="grid gap-5 lg:grid-cols-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6a1f]">
          Task
        </p>
        <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
          {title}
        </h3>
        <p className="mt-2 text-sm text-slate-600">{instruction}</p>

        <label className="mt-5 block">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Slogan
          </span>
          <input
            type="text"
            value={slogan}
            onChange={(e) => updateSlogan(e.target.value)}
            placeholder="Your poster slogan…"
            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#8a6a1f] focus:ring-1 focus:ring-[#8a6a1f]"
          />
        </label>

        <div className="mt-4 space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Three key points
          </span>
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              type="text"
              value={bullets[i]}
              onChange={(e) => updateBullet(i, e.target.value)}
              placeholder={`Point ${i + 1}`}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#8a6a1f] focus:ring-1 focus:ring-[#8a6a1f]"
            />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-[#d4c4a0] bg-[#fcfbf8] p-6 sm:p-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-[#8a6a1f]">
          Poster preview
        </p>
        <h4 className="mt-4 text-center text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
          {slogan.trim() || "Your slogan here"}
        </h4>
        <ul className="mt-8 space-y-4">
          {bullets.map((b, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-base leading-relaxed text-slate-800"
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8a6a1f] text-xs font-semibold text-white">
                {i + 1}
              </span>
              <span className={b.trim() ? "" : "italic text-slate-400"}>
                {b.trim() || `Key point ${i + 1}`}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-center text-xs text-slate-500">
          Speakify Classroom · Share with your group
        </p>
      </div>
    </section>
  );
}
