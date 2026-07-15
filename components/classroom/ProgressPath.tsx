"use client";

import Link from "next/link";

const STEPS = [
  { key: "lesson-1", label: "Lesson 1" },
  { key: "lesson-2", label: "Lesson 2" },
  { key: "lesson-3", label: "Lesson 3" },
  { key: "lesson-4", label: "Lesson 4" },
  { key: "lesson-5", label: "Lesson 5" },
  { key: "extra-activities", label: "Extra" },
  { key: "quiz", label: "Quiz" },
] as const;

export default function ProgressPath({
  levelSlug,
  unitSlug,
  activeKey,
  completed = [],
}: {
  levelSlug: string;
  unitSlug: string;
  activeKey?: string;
  completed?: string[];
}) {
  const base = `/classroom/${encodeURIComponent(levelSlug)}/${encodeURIComponent(unitSlug)}`;
  const done = new Set(completed);

  return (
    <ol className="flex flex-wrap gap-2">
      {STEPS.map((step, i) => {
        const href = `${base}/${step.key}`;
        const isActive = activeKey === step.key;
        const isDone = done.has(step.key);
        return (
          <li key={step.key}>
            <Link
              href={href}
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                isActive
                  ? "border-slate-900 bg-slate-900 text-white"
                  : isDone
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              <span className="text-[11px] font-semibold opacity-70">
                {i + 1}
              </span>
              {step.label}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
