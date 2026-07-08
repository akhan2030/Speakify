"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";

type TrackWeek = {
  week: number;
  title: string;
  status: "completed" | "current" | "locked";
};

type WeekDay = {
  label: string;
  fullLabel: string;
  dateKey: string;
  fullyComplete: boolean;
  isToday: boolean;
  statusLabel: string;
  completed: number;
  total: number;
};

type TrackData = {
  track: {
    id: string;
    name: string;
    currentWeek: number;
    weekCount: number;
    progressPercent: number;
    weeks: TrackWeek[];
    weekTitle: string;
  };
  weeklyPlan: { thisWeek: WeekDay[] };
};

function WeekTimeline({ weeks }: { weeks: TrackWeek[] }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {weeks.map((w, i) => (
        <div key={w.week} className="flex items-center gap-2">
          <div
            className={`rounded-lg px-3 py-2 text-center text-xs font-semibold ${
              w.status === "current"
                ? "bg-[#0d1b35] text-white"
                : w.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : "bg-slate-100 text-slate-400"
            }`}
          >
            <div>Wk {w.week}</div>
            <div className="mt-0.5">
              {w.status === "completed" ? "✅" : w.status === "current" ? "🔵" : "🔒"}
            </div>
          </div>
          {i < weeks.length - 1 ? <span className="text-slate-300">→</span> : null}
        </div>
      ))}
    </div>
  );
}

export default function ProgrammeProgressPanel({
  onOpenWeeklyPlan,
}: {
  onOpenWeeklyPlan?: () => void;
}) {
  const [data, setData] = useState<TrackData | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/ielts-mission")
      .then((r) => r.json())
      .then((json) => {
        if (!json.error) {
          setData(json);
          setExpandedWeek(json.track?.currentWeek ?? 1);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  const { track, weeklyPlan } = data;
  const at100 = track.progressPercent >= 100;

  return (
    <div className="space-y-6">
      <header className="rounded-xl bg-[#0d1b35] p-6 text-white">
        <p className="text-xs uppercase tracking-wide text-[#c9972c]">Accelerator programme</p>
        <h2 className="mt-1 text-xl font-bold md:text-2xl">
          {track.name} — Week {track.currentWeek} of {track.weekCount}
        </h2>
        <p className="mt-2 text-sm text-slate-300">{track.weekTitle}</p>
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-slate-400">
            <span>Overall progress</span>
            <span>{track.progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#c9972c]"
              style={{ width: `${track.progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-bold text-[#0d1b35]">{track.weekCount}-week roadmap</h3>
        <div className="mt-4">
          <WeekTimeline weeks={track.weeks} />
        </div>
      </section>

      <section className="space-y-3">
        {track.weeks.map((w) => {
          const isLocked = w.status === "locked";
          const isExpanded = expandedWeek === w.week;
          const showDays = w.status === "current" ? weeklyPlan.thisWeek : null;

          return (
            <div
              key={w.week}
              className={`rounded-xl border bg-white shadow-sm ${
                w.status === "current" ? "border-[#c9972c]" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                disabled={isLocked}
                onClick={() => !isLocked && setExpandedWeek(isExpanded ? null : w.week)}
                className="flex w-full items-center justify-between gap-3 p-4 text-left disabled:cursor-not-allowed"
              >
                <div>
                  <p className="text-xs font-semibold uppercase text-[#0d9488]">
                    Week {w.week}
                    {w.status === "current" ? " · Current" : ""}
                    {w.status === "completed" ? " · Done" : ""}
                    {isLocked ? " · Locked" : ""}
                  </p>
                  <h4 className="mt-1 font-bold text-[#0d1b35]">{w.title}</h4>
                </div>
                <span className="text-xl">{isLocked ? "🔒" : isExpanded ? "▲" : "▼"}</span>
              </button>

              {isExpanded && !isLocked && showDays ? (
                <div className="border-t border-slate-100 px-4 pb-4">
                  <div className="mt-3 flex flex-wrap gap-2">
                    {showDays.map((d) => (
                      <div
                        key={d.dateKey}
                        className={`rounded-lg px-3 py-2 text-xs font-medium ${
                          d.isToday
                            ? "bg-[#c9972c]/20 text-[#0d1b35]"
                            : d.fullyComplete
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-50 text-slate-500"
                        }`}
                      >
                        {d.label}{" "}
                        {d.fullyComplete ? "✅" : d.isToday ? "🔵 today" : "⬜"}{" "}
                        <span className="text-slate-400">
                          ({d.completed}/{d.total})
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href="/dashboard/ielts/student/today"
                      className="rounded-lg bg-[#c9972c] px-4 py-2 text-sm font-bold text-[#0d1b35] hover:opacity-95"
                    >
                      Start today&apos;s tasks →
                    </Link>
                    {onOpenWeeklyPlan ? (
                      <button
                        type="button"
                        onClick={onOpenWeeklyPlan}
                        className="rounded-lg border border-[#0d9488] px-4 py-2 text-sm font-semibold text-[#0d9488] hover:bg-[#0d9488]/10"
                      >
                        Weekly plan →
                      </button>
                    ) : (
                      <Link
                        href="/dashboard/ielts/student/progress?tab=weekly"
                        className="rounded-lg border border-[#0d9488] px-4 py-2 text-sm font-semibold text-[#0d9488] hover:bg-[#0d9488]/10"
                      >
                        Weekly plan →
                      </Link>
                    )}
                  </div>
                </div>
              ) : null}

              {isExpanded && !isLocked && w.status === "completed" ? (
                <div className="border-t border-slate-100 px-4 pb-4 pt-2">
                  <p className="text-sm text-green-700">✅ Week {w.week} completed</p>
                </div>
              ) : null}

              {isLocked ? (
                <div className="border-t border-slate-100 px-4 pb-4 pt-2">
                  <p className="text-sm text-slate-500">
                    Complete Week {track.currentWeek} to unlock
                  </p>
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      {at100 ? (
        <section className="rounded-xl border-2 border-[#c9972c] bg-[#c9972c]/10 p-6 text-center">
          <p className="text-3xl">🎓</p>
          <h3 className="mt-2 text-lg font-bold text-[#0d1b35]">Track complete!</h3>
          <p className="mt-1 text-sm text-slate-600">
            You finished the {track.name} programme. Keep practising with mock exams.
          </p>
          <Link
            href="/dashboard/ielts/student/mock-exam"
            className="mt-4 inline-flex rounded-xl bg-[#0d1b35] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#152a4d]"
          >
            Take a mock exam →
          </Link>
        </section>
      ) : null}
    </div>
  );
}
