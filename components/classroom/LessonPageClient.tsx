"use client";

import Link from "next/link";
import ProgressPath from "@/components/classroom/ProgressPath";
import LessonSectionRenderer from "@/components/classroom/student/LessonSectionRenderer";
import type { LessonSectionInput } from "@/components/classroom/student/LessonSectionRenderer";

export type LessonSectionView = LessonSectionInput;

export default function LessonPageClient({
  levelSlug,
  unitSlug,
  lessonNumber,
  title,
  sections,
}: {
  levelSlug: string;
  unitSlug: string;
  lessonNumber: number;
  title: string;
  sections: LessonSectionView[];
}) {
  const base = `/classroom/${encodeURIComponent(levelSlug)}/${encodeURIComponent(unitSlug)}`;
  const activeKey =
    lessonNumber > 0 ? `lesson-${lessonNumber}` : "extra-activities";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8a6a1f]">
            {levelSlug.toUpperCase()} · {unitSlug}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{title}</h1>
        </div>
        <Link
          href={base}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
        >
          Unit home
        </Link>
      </div>

      <ProgressPath
        levelSlug={levelSlug}
        unitSlug={unitSlug}
        activeKey={activeKey}
      />

      {sections.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 text-slate-600">
          Lesson content is not on disk yet. Add{" "}
          <code className="rounded bg-slate-100 px-1">
            {lessonNumber > 0
              ? `lesson-${lessonNumber}.json`
              : "extra-activities.json"}
          </code>{" "}
          under content/classroom.
        </div>
      ) : (
        <div className="space-y-4">
          {sections.map((section, idx) => (
            <LessonSectionRenderer
              key={`${section.sectionType ?? section.type ?? "s"}-${idx}`}
              section={section}
            />
          ))}
        </div>
      )}
    </div>
  );
}
