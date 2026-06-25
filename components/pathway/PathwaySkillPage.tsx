"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import PathwayTaskCard from "@/components/pathway/PathwayTaskCard";
import {
  attachTaskProgress,
  usePathwayStudent,
} from "@/components/pathway/usePathwayStudent";
import { getContentEngine } from "@/lib/programs";
import { getProgramTerminology, type PathwaySkill } from "@/lib/programs/terminology";

const SKILL_LABELS: Record<PathwaySkill, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  reading: "Reading",
  listening: "Listening",
  speaking: "Speaking",
  writing: "Writing",
  pronunciation: "Pronunciation",
};

const SKILL_ICONS: Record<PathwaySkill, string> = {
  grammar: "🔤",
  vocabulary: "📚",
  reading: "📖",
  listening: "🎧",
  speaking: "🎤",
  writing: "✍",
  pronunciation: "🗣",
};

export default function PathwaySkillPage({ skill }: { skill: PathwaySkill }) {
  const ctx = usePathwayStudent();
  const terms = getProgramTerminology("pathway");
  const [refreshKey, setRefreshKey] = useState(0);

  const tasks = useMemo(() => {
    void refreshKey;
    const engine = getContentEngine("english_pathway");
    return attachTaskProgress(engine.getSkillUnits(ctx.levelId, skill, ctx.week));
  }, [ctx.levelId, ctx.week, skill, refreshKey]);

  const completedCount = tasks.filter((t) => t.completed).length;
  const skillProgress = ctx.skillProgress[skill] ?? 0;

  if (ctx.loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-500">
        Loading {SKILL_LABELS[skill]}…
      </div>
    );
  }

  return (
    <div>
      <Link
        href="/dashboard/pathway/student"
        className="text-sm font-semibold text-[#0d9488] hover:underline"
      >
        ← Dashboard
      </Link>

      <header className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c9972c]">
              {terms.programName} · {SKILL_LABELS[skill]}
            </p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-[#0d1b35]">
              <span>{SKILL_ICONS[skill]}</span>
              {SKILL_LABELS[skill]} Practice
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              {ctx.levelName} · Week {ctx.week}/{ctx.weekCount} · Level-specific
              general English tasks (not IELTS exam format)
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">{terms.progressLabel}</p>
            <p className="text-3xl font-bold text-[#0d9488]">{skillProgress}%</p>
            <p className="text-xs text-slate-500">
              {completedCount}/{tasks.length} units this week
            </p>
          </div>
        </div>
      </header>

      <section className="mt-6 grid gap-4">
        {tasks.map((task) => (
          <PathwayTaskCard
            key={task.id}
            task={task}
            skillHref={`/dashboard/pathway/student/${skill}`}
            onComplete={() => setRefreshKey((k) => k + 1)}
          />
        ))}
      </section>

      {tasks.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          No tasks for this week yet. Check back when your weekly plan updates.
        </p>
      ) : null}
    </div>
  );
}
