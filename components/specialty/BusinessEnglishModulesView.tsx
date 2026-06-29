"use client";

import { useEffect, useState } from "react";
import { getSpecialtyProgram } from "@/lib/specialtyPrograms";
import {
  formatWeekRange,
  lessonStatusLabel,
  type BusinessEnglishLesson,
  type BusinessEnglishModule,
} from "@/lib/businessEnglishLms";

function LessonRow({
  lesson,
  accent,
  accentLight,
}: {
  lesson: BusinessEnglishLesson;
  accent: string;
  accentLight: string;
}) {
  const isAvailable = lesson.status === "available";
  const isCompleted = lesson.status === "completed";
  const isLocked = lesson.status === "locked";

  return (
    <li className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Lesson {lesson.order_number}
          </p>
          <p className="mt-1 font-semibold text-[#0d1b35]">{lesson.title}</p>
          {lesson.description ? (
            <p className="mt-1 text-sm text-slate-600">{lesson.description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-xs font-semibold text-slate-500">
            {lesson.duration_minutes} min
          </span>
          <span
            className="rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: isCompleted
                ? "#dcfce7"
                : isAvailable
                  ? accentLight
                  : "#f1f5f9",
              color: isCompleted ? "#166534" : isAvailable ? accent : "#64748b",
            }}
          >
            {lessonStatusLabel(lesson.status)}
          </span>
        </div>
      </div>
      <button
        type="button"
        disabled={isLocked}
        className="mt-3 w-full rounded-lg py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        style={{ backgroundColor: isLocked ? "#94a3b8" : accent }}
      >
        {isLocked ? "Locked" : isCompleted ? "Review lesson" : "Open lesson"}
      </button>
    </li>
  );
}

function ModuleCard({
  module,
  accent,
  accentLight,
}: {
  module: BusinessEnglishModule;
  accent: string;
  accentLight: string;
}) {
  const availableCount = module.lessons.filter((l) => l.status === "available").length;
  const completedCount = module.lessons.filter((l) => l.status === "completed").length;
  const moduleStatus =
    completedCount === module.lessons.length && module.lessons.length > 0
      ? "Complete"
      : availableCount > 0 || completedCount > 0
        ? "In progress"
        : "Up next";

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Module {module.module_number}
          </p>
          <h2 className="mt-1 text-xl font-bold text-[#0d1b35]">{module.title}</h2>
          <p className="mt-2 text-sm text-slate-600">{module.description}</p>
          <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Programme
              </dt>
              <dd className="mt-0.5 font-medium text-[#0d1b35]">Business English</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Level
              </dt>
              <dd className="mt-0.5 font-medium text-[#0d1b35]">{module.cefr_level}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Schedule
              </dt>
              <dd className="mt-0.5 font-medium text-[#0d1b35]">
                {formatWeekRange(module.week_start, module.week_end)}
              </dd>
            </div>
          </dl>
        </div>
        <span
          className="rounded-full px-3 py-1 text-xs font-semibold"
          style={{ backgroundColor: accentLight, color: accent }}
        >
          {moduleStatus}
        </span>
      </div>

      <ul className="mt-6 space-y-3">
        {module.lessons.map((lesson) => (
          <LessonRow
            key={lesson.id}
            lesson={lesson}
            accent={accent}
            accentLight={accentLight}
          />
        ))}
      </ul>
    </article>
  );
}

export default function BusinessEnglishModulesView() {
  const program = getSpecialtyProgram("business_english");
  const [modules, setModules] = useState<BusinessEnglishModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/business-english/modules");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load modules");
        setModules(json.modules ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load modules");
        setModules([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      <div>
        <h1 className="text-2xl font-extrabold text-[#0d1b35]">Skill modules</h1>
        <p className="mt-2 text-slate-600">
          Your {program.name} curriculum — lessons unlock as you progress.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading modules…</p>
      ) : error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : modules.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white px-4 py-6 text-sm text-slate-600">
          No modules are available yet. Check back soon.
        </p>
      ) : (
        <div className="space-y-6">
          {modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              accent={program.accent}
              accentLight={program.accentLight}
            />
          ))}
        </div>
      )}
    </div>
  );
}
