"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageShell } from "@/components/student/PageFetchStates";
import { apiGet } from "@/lib/pathway/apiFetch";

type DayRow = {
  dayType: string;
  dayName: string;
  dayLabel: string;
  icon: string;
  theme: string;
  lessonTitle: string;
  estimatedMinutes: number;
  contentBadge: "new" | "review";
  completed: boolean;
  href: string;
};

type WeekCard = {
  id: string;
  weekNumber: number;
  title: string;
  state: "past" | "current" | "future";
  locked: boolean;
  expanded: boolean;
  daysCompleted: number;
  totalDays: number;
  complete: boolean;
  days: DayRow[];
};

type LevelPayload = {
  level: {
    slug: string;
    code: string;
    headerTitle: string;
    displayName: string;
    weekCount: number;
  };
  progress: {
    currentWeek: number;
    weeksComplete: number;
    weekCount: number;
    progressPercent: number;
    overallScore: number | null;
  };
  weeks: WeekCard[];
  tests: {
    showMidLevelTest: boolean;
    showGraduationTest: boolean;
    midLevelHref: string;
    graduationHref: string;
  };
};

function ContentBadge({ badge }: { badge: "new" | "review" }) {
  if (badge === "review") {
    return (
      <span className="rounded-full bg-[#c9972c]/20 px-2 py-0.5 text-[10px] font-bold uppercase text-[#8a6918]">
        30% Review
      </span>
    );
  }
  return (
    <span className="rounded-full bg-[#0d9488]/15 px-2 py-0.5 text-[10px] font-bold uppercase text-[#0d9488]">
      New Content
    </span>
  );
}

function DayRowLink({
  day,
  locked,
}: {
  day: DayRow;
  locked: boolean;
}) {
  const inner = (
    <>
      <span className="text-xl">{day.icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-[#0d1b35]">
            {day.dayName}: {day.dayLabel}
          </span>
          <ContentBadge badge={day.contentBadge} />
        </div>
        <p className="mt-0.5 truncate text-sm text-slate-600">{day.lessonTitle}</p>
        <p className="mt-0.5 text-xs text-slate-400">{day.estimatedMinutes} min</p>
      </div>
      {day.completed ? (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0d9488] text-sm text-white">
          ✓
        </span>
      ) : locked ? (
        <span className="text-slate-300">🔒</span>
      ) : (
        <span className="text-sm text-[#c9972c]">→</span>
      )}
    </>
  );

  if (locked) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 opacity-60">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={day.href}
      className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors hover:border-[#0d9488]/40 hover:bg-[#0d9488]/5"
    >
      {inner}
    </Link>
  );
}

function WeekUnitCard({
  week,
  expanded,
  onToggle,
}: {
  week: WeekCard;
  expanded: boolean;
  onToggle: () => void;
}) {
  const isFuture = week.state === "future" || week.locked;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border shadow-sm ${
        week.state === "current"
          ? "border-[#c9972c] ring-1 ring-[#c9972c]/30"
          : "border-slate-200"
      } ${isFuture ? "opacity-80" : ""}`}
    >
      {isFuture ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-slate-900/5">
          <span className="rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-slate-500 shadow">
            🔒 Locked
          </span>
        </div>
      ) : null}

      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 bg-[#0d1b35] px-5 py-4 text-left"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#c9972c]/80">
            Week {week.weekNumber}
          </p>
          <h3 className="mt-0.5 font-bold text-white">{week.title}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-300">
            {week.daysCompleted}/{week.totalDays} days
          </span>
          <span className="text-[#c9972c]">{expanded ? "▾" : "▸"}</span>
        </div>
      </button>

      {expanded ? (
        <div className="space-y-2 bg-slate-50 p-4">
          {week.days.map((day) => (
            <DayRowLink key={day.dayType} day={day} locked={isFuture} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default function PathwayLevelPage() {
  const params = useParams();
  const levelId = String(params.levelId);
  const [data, setData] = useState<LevelPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({});

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet(`/api/pathway/level/${levelId}`)
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) {
          throw new Error(String(json.error ?? `Failed to load level (${r.status})`));
        }
        if (json.fallback && !json.level) {
          throw new Error(String(json.error ?? "Sign in to load this level"));
        }
        if (json.fallback || json.level) {
          return json as LevelPayload;
        }
        if (json.error) {
          throw new Error(json.error);
        }
        throw new Error("Level data is missing");
      })
      .then((json) => {
        setData(json);
        const initial: Record<number, boolean> = {};
        (json.weeks ?? []).forEach((w: WeekCard) => {
          initial[w.weekNumber] = w.expanded;
        });
        setExpandedWeeks(initial);
      })
      .catch((err: Error) => {
        setData(null);
        setError(err.message ?? "Failed to load level");
      })
      .finally(() => {
        setLoading(false);
        setPreparing(false);
      });
  }, [levelId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <PageShell
        activePage="course"
        loading
        error={null}
        loadingMessage={preparing ? "Preparing your lessons..." : "Loading..."}
      >
        {null}
      </PageShell>
    );
  }

  if (error || !data?.level || !data?.progress) {
    return <PageShell activePage="course" loading={false} error={error ?? "Level not found"}>{null}</PageShell>;
  }

  const { level, progress, weeks = [], tests } = data;

  return (
    <PageShell activePage="course" loading={false} error={null}>
      <header className="border-b border-slate-200 bg-white px-8 py-8">
          <Link
            href="/dashboard/student/pathway"
            className="text-sm font-semibold text-[#0d9488] hover:underline"
          >
            ← Your English Pathway
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#0d1b35] text-sm font-bold text-[#c9972c]">
                {level.code}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#0d1b35]">
                  {level.headerTitle}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {progress.weeksComplete} of {progress.weekCount} weeks complete
                  {progress.overallScore != null
                    ? ` · Overall score: ${Math.round(Number(progress.overallScore))}%`
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {tests?.showMidLevelTest ? (
                <Link
                  href={tests.midLevelHref}
                  className="rounded-xl border-2 border-[#0d1b35] px-5 py-2.5 text-sm font-bold text-[#0d1b35] hover:bg-slate-50"
                >
                  Take Mid-Level Test
                </Link>
              ) : null}
              {tests?.showGraduationTest ? (
                <Link
                  href={tests.graduationHref}
                  className="rounded-xl bg-[#c9972c] px-5 py-2.5 text-sm font-bold text-[#0d1b35] hover:opacity-95"
                >
                  Take Graduation Test
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-6 max-w-xl">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[#0d1b35]">
                Week {progress.currentWeek} of {progress.weekCount} complete
              </span>
              <span className="text-slate-500">{progress.progressPercent}%</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#c9972c] transition-all"
                style={{ width: `${progress.progressPercent}%` }}
              />
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-3xl space-y-4 px-6 py-8">
          {(weeks ?? []).map((week) => (
            <WeekUnitCard
              key={week.id}
              week={week}
              expanded={expandedWeeks[week.weekNumber] ?? week.expanded}
              onToggle={() =>
                setExpandedWeeks((prev) => ({
                  ...prev,
                  [week.weekNumber]: !prev[week.weekNumber],
                }))
              }
            />
          ))}
        </div>
    </PageShell>
  );
}
