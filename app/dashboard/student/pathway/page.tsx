"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/student/PageFetchStates";
import { apiGet } from "@/lib/pathway/apiFetch";

type PathwayLevel = {
  id: string;
  slug: string;
  orderIndex: number;
  code: string;
  name: string;
  focusAreas: string;
  weekCount: number;
  status: "completed" | "active" | "locked";
  currentWeek: number | null;
  overallScore: number | null;
  certificate: {
    certificateCode: string;
    title: string;
    issuedAt: string;
  } | null;
  href: string;
};

type PathwayData = {
  student: {
    name: string | null;
    cefrLevel: string;
    targetBand: string | null;
  };
  summary: {
    currentLevelCode: string;
    currentLevelName: string | null;
    currentWeek: number;
    levelsCompleted: number;
    totalLevels: number;
    estimatedWeeksRemaining: number;
    activeSlug: string;
    lessonHref: string | null;
  };
  levels: PathwayLevel[];
  tableMissing?: boolean;
  fallback?: boolean;
};

function StatusBadge({ status }: { status: PathwayLevel["status"] }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
        ✅ Completed
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#c9972c]/20 px-3 py-1 text-xs font-semibold text-[#8a6918]">
        🔓 Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
      🔒 Locked
    </span>
  );
}

function LevelCard({ level, isLast }: { level: PathwayLevel; isLast: boolean }) {
  const isActive = level.status === "active";
  const isCompleted = level.status === "completed";
  const isLocked = level.status === "locked";

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            isActive
              ? "bg-[#c9972c] text-[#0d1b35]"
              : isCompleted
                ? "bg-green-600 text-white"
                : isLocked
                  ? "bg-slate-200 text-slate-500"
                  : "bg-[#0d1b35] text-[#c9972c]"
          }`}
        >
          {level.code}
        </div>
        {!isLast ? (
          <div
            className={`mt-2 w-0.5 flex-1 min-h-[2rem] ${
              isCompleted ? "bg-green-300" : isActive ? "bg-[#c9972c]" : "bg-slate-200"
            }`}
          />
        ) : null}
      </div>

      <div
        className={`mb-6 flex-1 rounded-2xl border bg-white p-5 shadow-sm transition-shadow ${
          isActive
            ? "border-[#c9972c] ring-2 ring-[#c9972c]/20"
            : isLocked
              ? "border-slate-200 opacity-70"
              : "border-slate-200"
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0d9488]">
              Level {level.orderIndex}
            </p>
            <h3 className="mt-1 text-lg font-bold text-[#0d1b35]">{level.name}</h3>
          </div>
          <StatusBadge status={level.status} />
        </div>

        <p className="mt-2 text-sm text-slate-500">
          {level.weekCount} weeks · {level.focusAreas}
        </p>

        {isCompleted ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {level.overallScore != null ? (
              <p className="text-sm font-semibold text-[#0d1b35]">
                Overall score:{" "}
                <span className="text-[#0d9488]">{Math.round(level.overallScore)}%</span>
              </p>
            ) : null}
            <Link
              href={level.href}
              className="inline-flex rounded-xl border border-[#0d1b35] px-4 py-2 text-sm font-semibold text-[#0d1b35] hover:bg-slate-50"
            >
              Download Certificate
            </Link>
          </div>
        ) : null}

        {isActive ? (
          <Link
            href={level.href}
            className="mt-4 inline-flex rounded-xl bg-[#c9972c] px-5 py-2.5 text-sm font-bold text-[#0d1b35] hover:opacity-95"
          >
            Continue Learning →
          </Link>
        ) : null}

        {isLocked ? (
          <p className="mt-4 text-sm text-slate-400">
            Complete previous level to unlock
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function PathwayPage() {
  const [data, setData] = useState<PathwayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet("/api/pathway/progress")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) {
          throw new Error(String(json.error ?? `Failed to load pathway (${r.status})`));
        }
        if (json.fallback && json.error) {
          throw new Error(String(json.error));
        }
        if (json.fallback || Array.isArray(json.levels)) {
          return json as PathwayData;
        }
        if (json.error) {
          throw new Error(json.error);
        }
        return json as PathwayData;
      })
      .then(setData)
      .catch((err: Error) => {
        setData(null);
        setError(err.message ?? "Could not load your pathway");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const levels = data?.levels ?? [];
  const student = data?.student;
  const summary = data?.summary;
  const targetLabel = student?.targetBand?.trim()
    ? student.targetBand
    : "Not set";

  return (
    <PageShell activePage="course" loading={loading} error={error}>
      {!data || !student || !summary ? (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <p className="text-slate-600">No pathway data available.</p>
        </div>
      ) : (
        <>
        {data.fallback ? (
          <p className="bg-amber-50 px-8 py-3 text-sm text-amber-900">
            Showing demo pathway data — sign in to save your progress.
          </p>
        ) : null}
        <header className="bg-[#0d1b35] px-8 py-10 text-[#c9972c]">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#c9972c]/80">
            Speakify English Pathway
          </p>
          <h1 className="mt-2 text-3xl font-bold text-white">Your English Pathway</h1>
          <p className="mt-2 text-sm text-slate-300">
            From where you are — to where you need to be
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <span className="rounded-full bg-[#c9972c] px-4 py-1.5 text-sm font-bold text-[#0d1b35]">
              Current: {summary.currentLevelCode}
            </span>
            {targetLabel ? (
              <span className="text-sm text-slate-200">
                Your goal:{" "}
                <strong className="text-[#c9972c]">IELTS {targetLabel}</strong>
              </span>
            ) : (
              <span className="text-sm text-slate-400">
                Set your target band in Settings
              </span>
            )}
          </div>
        </header>

        <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
          <section className="min-w-0 flex-1">
            {data.tableMissing ? (
              <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Run{" "}
                <code className="rounded bg-amber-100 px-1">
                  supabase/student_level_progress_setup.sql
                </code>{" "}
                in Supabase for full progress tracking.
              </p>
            ) : null}

            <div className="space-y-0">
              {levels.map((level, index) => (
                <LevelCard
                  key={level.slug}
                  level={level}
                  isLast={index === levels.length - 1}
                />
              ))}
            </div>
          </section>

          <aside className="hidden w-72 shrink-0 lg:block">
            <div className="sticky top-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#0d1b35]">Your Journey</h2>

              <dl className="mt-5 space-y-4 text-sm">
                <div>
                  <dt className="text-slate-500">Current level</dt>
                  <dd className="mt-0.5 font-bold text-[#0d1b35]">
                    {summary.currentLevelCode}
                    {summary.currentLevelName
                      ? ` · ${summary.currentLevelName}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Current week</dt>
                  <dd className="mt-0.5 font-bold text-[#0d9488]">
                    Week {summary.currentWeek}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Levels completed</dt>
                  <dd className="mt-0.5 font-bold text-[#0d1b35]">
                    {summary.levelsCompleted} / {summary.totalLevels}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Estimated weeks to goal</dt>
                  <dd className="mt-0.5 font-bold text-[#0d1b35]">
                    ~{summary.estimatedWeeksRemaining} weeks
                  </dd>
                </div>
              </dl>

              {summary.lessonHref ? (
                <Link
                  href={summary.lessonHref}
                  className="mt-6 block w-full rounded-xl bg-[#c9972c] py-3 text-center text-sm font-bold text-[#0d1b35] hover:opacity-95"
                >
                  Continue Today&apos;s Lesson
                </Link>
              ) : (
                <Link
                  href={`/dashboard/student/pathway/${summary.activeSlug}`}
                  className="mt-6 block w-full rounded-xl bg-[#c9972c] py-3 text-center text-sm font-bold text-[#0d1b35] hover:opacity-95"
                >
                  Continue Today&apos;s Lesson
                </Link>
              )}
            </div>
          </aside>
        </div>

        <div className="border-t border-slate-200 bg-white px-6 py-6 lg:hidden">
          <div className="mx-auto max-w-6xl rounded-2xl border border-slate-200 p-5">
            <h2 className="font-bold text-[#0d1b35]">Your Journey</h2>
            <p className="mt-2 text-sm text-slate-600">
              {summary.levelsCompleted} / {summary.totalLevels} levels · Week{" "}
              {summary.currentWeek} · ~{summary.estimatedWeeksRemaining} weeks
              remaining
            </p>
            {summary.lessonHref ? (
              <Link
                href={summary.lessonHref}
                className="mt-4 block rounded-xl bg-[#c9972c] py-3 text-center text-sm font-bold text-[#0d1b35]"
              >
                Continue Today&apos;s Lesson
              </Link>
            ) : null}
          </div>
        </div>
        </>
      )}
    </PageShell>
  );
}
