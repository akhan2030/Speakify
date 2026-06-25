"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import { getContentEngine } from "@/lib/programs";
import { pathwaySkillHref } from "@/lib/programs/pathway/engine";
import {
  assessmentInfo,
  levelProgressPercent,
  resolveNextLevel,
} from "@/lib/pathway/dashboardData";
import type { PathwaySkill } from "@/lib/programs/terminology";
import type { SkillProgressMap } from "@/lib/programs/types";

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className="h-full rounded-full bg-[#0d9488]"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

function SkillRow({ label, percent, href }: { label: string; percent: number; href: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-[#0d1b35]">{label}</span>
        <span className="font-bold text-[#0d9488]">{percent}%</span>
      </div>
      <div className="mt-3">
        <ProgressBar percent={percent} />
      </div>
    </Link>
  );
}

const SKILL_LABELS: Record<PathwaySkill, string> = {
  grammar: "Grammar",
  vocabulary: "Vocabulary",
  reading: "Reading",
  listening: "Listening",
  speaking: "Speaking",
  writing: "Writing",
  pronunciation: "Pronunciation",
};

export default function PathwayProgressPage() {
  const [loading, setLoading] = useState(true);
  const [pathway, setPathway] = useState<{
    summary?: {
      currentLevelCode: string;
      currentLevelName: string | null;
      currentWeek: number;
      levelsCompleted: number;
      totalLevels: number;
    };
    levels?: Array<{ code: string; name: string; status: string; overallScore?: number | null }>;
  } | null>(null);
  const [skills, setSkills] = useState<SkillProgressMap | null>(null);
  const [graduationReadiness, setGraduationReadiness] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [progressRes, dashboardRes] = await Promise.all([
          fetch("/api/pathway/progress", { credentials: "include", cache: "no-store" }).then(
            (r) => r.json()
          ),
          fetch("/api/pathway/dashboard", { credentials: "include", cache: "no-store" }).then(
            (r) => r.json()
          ),
        ]);

        if (cancelled) return;

        setPathway(progressRes);
        const engine = getContentEngine("english_pathway");
        setSkills(
          dashboardRes.skillProgress ??
            engine.getDefaultSkillProgress(dashboardRes.levelId ?? "b1_1")
        );
        setGraduationReadiness(dashboardRes.graduationReadiness ?? 0);
        setStreak(dashboardRes.streak?.current_streak ?? dashboardRes.streak ?? 0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <PageSpinner />
      </div>
    );
  }

  const summary = pathway?.summary;
  const levels = pathway?.levels ?? [];
  const currentCode = summary?.currentLevelCode ?? "B1.1";
  const currentName = summary?.currentLevelName ?? "Intermediate I";
  const currentWeek = summary?.currentWeek ?? 1;
  const weekCount = 5;
  const levelProgress = levelProgressPercent(currentWeek, weekCount);
  const { nextMeta } = resolveNextLevel(currentCode);
  const assessment = assessmentInfo(currentWeek, weekCount, currentCode);
  const completedLevels = levels.filter((l) => l.status === "completed");

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-6">
      <header className="mb-8">
        <Link
          href="/dashboard/pathway/student"
          className="text-sm font-semibold text-[#0d9488] hover:underline"
        >
          ← Dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-[#0d1b35] sm:text-3xl">Skill Progress</h1>
        <p className="mt-2 text-sm text-slate-600">
          {currentCode} — {currentName} · Week {currentWeek} of {weekCount}
        </p>
      </header>

      <section className="rounded-xl border border-[#0d9488]/30 bg-white p-6 shadow-sm">
        <h2 className="text-base font-bold text-[#0d1b35]">Level progress</h2>
        <p className="mt-1 text-sm text-slate-500">
          Working toward {nextMeta?.code ?? "graduation"} — {levelProgress}% complete
        </p>
        <div className="mt-4">
          <ProgressBar percent={levelProgress} />
        </div>
        <p className="mt-4 text-sm text-slate-600">
          {summary?.levelsCompleted ?? 0} of {summary?.totalLevels ?? 10} pathway levels completed
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-base font-bold text-[#0d1b35]">Skills (CEFR progress)</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {skills
            ? (Object.keys(SKILL_LABELS) as PathwaySkill[]).map((key) => (
                <SkillRow
                  key={key}
                  label={SKILL_LABELS[key]}
                  percent={skills[key]}
                  href={pathwaySkillHref(key)}
                />
              ))
            : null}
        </div>
      </section>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#0d1b35]">Level completion history</h2>
          {completedLevels.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              No levels completed yet — keep going!
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {completedLevels.map((level) => (
                <li
                  key={level.code}
                  className="flex items-center justify-between rounded-lg bg-green-50 px-4 py-3 text-sm"
                >
                  <span className="font-semibold text-green-900">
                    ✅ {level.code} — {level.name}
                  </span>
                  {level.overallScore != null ? (
                    <span className="font-bold text-green-700">
                      {Math.round(level.overallScore)}%
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-bold text-[#0d1b35]">Graduation readiness</h2>
          <p className="mt-2 font-semibold text-[#0d9488]">{assessment.title}</p>
          <p className="mt-1 text-sm text-slate-500">{assessment.subtitle}</p>
          <div className="mt-4">
            <ProgressBar percent={graduationReadiness || assessment.progress} />
          </div>
          <p className="mt-2 text-sm text-slate-600">{graduationReadiness}% overall readiness</p>
        </section>
      </div>

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Study streak</p>
          <p className="mt-2 text-2xl font-bold text-[#c9972c]">{streak} days</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-500">Grammar progress</p>
          <p className="mt-2 text-2xl font-bold text-[#0d9488]">{skills?.grammar ?? 0}%</p>
        </div>
      </section>
    </main>
  );
}
