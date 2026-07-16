"use client";

import Link from "next/link";
import { CEFR_SUB_LEVELS } from "@/lib/course/cefrLevels";

type CourseLevelTone = "beginner" | "intermediate" | "advanced";

const LEVEL_BADGE: Record<string, CourseLevelTone> = {
  A1: "beginner",
  A2: "beginner",
  B1: "intermediate",
  B2: "intermediate",
  C1: "advanced",
  C2: "advanced",
};

const TONE_COLOR: Record<CourseLevelTone, string> = {
  beginner: "#0d9488",
  intermediate: "#c9972c",
  advanced: "#0d1b35",
};

type Props = {
  title?: string;
  subtitle?: string;
  weeksLabel?: string;
  ctaLabel?: string;
};

export default function PathwayLevelGrid({
  title = "Full CEFR pathway",
  subtitle = "Twelve micro-levels from A1.1 to C2.2 — about 4 weeks each.",
  weeksLabel = "4 weeks",
  ctaLabel = "Start this level",
}: Props) {
  return (
    <div className="mt-8">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-[#0d1b35]">{title}</h3>
        <p className="text-sm text-slate-500">{subtitle}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {CEFR_SUB_LEVELS.map((level) => {
          const tone = LEVEL_BADGE[level.cefr] ?? "beginner";
          return (
            <Link
              key={level.slug}
              href={`/courses/english-pathway`}
              className="group rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:border-[#0d9488]/40 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-bold text-white"
                  style={{ backgroundColor: TONE_COLOR[tone] }}
                >
                  {level.code}
                </span>
                <span className="text-[11px] font-medium text-slate-400">
                  {weeksLabel}
                </span>
              </div>
              <p className="mt-2 text-sm font-semibold text-[#0d1b35] group-hover:text-[#0d9488]">
                {level.name}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                {level.description}
              </p>
              <span className="mt-3 inline-block text-xs font-semibold text-[#c9972c]">
                {ctaLabel} →
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
