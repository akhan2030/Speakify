"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import { MissionProgressBar } from "@/components/ielts/MissionTaskCard";

type WeekDay = {
  day: string;
  dateKey: string;
  label: string;
  fullLabel: string;
  subtitle: string;
  completed: number;
  total: number;
  fullyComplete: boolean;
  partial: boolean;
  isToday: boolean;
  isFuture: boolean;
  canComplete: boolean;
  statusLabel: string;
  tasks: Array<{
    id: string;
    title: string;
    minutes: number;
    href: string;
    taskType: string;
    completed: boolean;
  }>;
};

type MissionPlan = {
  track: { name: string; currentWeek: number; weekCount: number };
  weeklyPlan: { thisWeek: WeekDay[]; nextWeek: WeekDay[] };
};

function DayStatusBadge({ day }: { day: WeekDay }) {
  if (day.fullyComplete) {
    return (
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
        ✅ Complete
      </span>
    );
  }
  if (day.isToday) {
    return (
      <span className="rounded-full bg-[#c9972c]/20 px-2 py-0.5 text-xs font-semibold text-[#8a6918]">
        🔵 Today
      </span>
    );
  }
  if (day.partial) {
    return (
      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
        In progress
      </span>
    );
  }
  if (day.isFuture) {
    return (
      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
        Upcoming
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
      Missed
    </span>
  );
}

function WeekSection({
  title,
  days,
  defaultOpenToday,
}: {
  title: string;
  days: WeekDay[];
  defaultOpenToday?: boolean;
}) {
  const [expanded, setExpanded] = useState<string | null>(() => {
    if (defaultOpenToday) {
      return days.find((d) => d.isToday)?.dateKey ?? null;
    }
    return null;
  });

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-[#0d1b35]">{title}</h2>
      <div className="mt-4 space-y-3">
        {days.map((d) => {
          const isOpen = expanded === d.dateKey;
          const totalMinutes = d.tasks.reduce((s, t) => s + t.minutes, 0);
          return (
            <div
              key={d.dateKey}
              className={`rounded-xl border bg-white shadow-sm ${
                d.isToday ? "border-[#c9972c] border-l-4" : "border-slate-200"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : d.dateKey)}
                className="flex w-full items-start justify-between gap-3 p-4 text-left"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-[#0d1b35]">{d.fullLabel}</h3>
                    <DayStatusBadge day={d} />
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{d.subtitle}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {d.completed}/{d.total} tasks · {totalMinutes} min · Skills:{" "}
                    {Array.from(new Set(d.tasks.map((t) => t.taskType))).join(", ")}
                  </p>
                </div>
                <span className="text-slate-400">{isOpen ? "▲" : "▼"}</span>
              </button>

              {isOpen ? (
                <div className="border-t border-slate-100 px-4 pb-4">
                  <MissionProgressBar completed={d.completed} total={d.total} />
                  <ul className="mt-3 space-y-2">
                    {d.tasks.map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="flex items-center gap-2">
                          <span className={task.completed ? "text-green-600" : "text-slate-300"}>
                            {task.completed ? "☑" : "☐"}
                          </span>
                          <span
                            className={
                              task.completed ? "text-slate-400 line-through" : "text-[#0d1b35]"
                            }
                          >
                            {task.title}
                          </span>
                        </span>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-xs text-slate-400">{task.minutes}m</span>
                          {d.canComplete && !task.completed ? (
                            <Link
                              href="/dashboard/ielts/student/today"
                              className="text-xs font-semibold text-[#0d9488] hover:underline"
                            >
                              Do today →
                            </Link>
                          ) : (
                            <Link
                              href={task.href}
                              className="text-xs font-semibold text-[#c9972c] hover:underline"
                            >
                              Open
                            </Link>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                  {d.isToday ? (
                    <Link
                      href="/dashboard/ielts/student/today"
                      className="mt-4 inline-block rounded-lg bg-[#c9972c] px-4 py-2 text-sm font-bold text-[#0d1b35] hover:opacity-95"
                    >
                      Continue today&apos;s mission →
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function WeeklyPlanPage() {
  const [data, setData] = useState<MissionPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/ielts-mission")
      .then((r) => r.json())
      .then((json) => {
        if (!json.error) setData(json);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <PageSpinner />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <Link
        href="/dashboard/ielts/student"
        className="text-sm font-semibold text-[#0d9488] hover:underline"
      >
        ← Dashboard
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">Weekly Plan</h1>
      <p className="mt-1 text-sm text-slate-600">
        {data.track.name} track · Week {data.track.currentWeek} of {data.track.weekCount} ·
        Sunday → Saturday
      </p>

      <WeekSection
        title="This week"
        days={data.weeklyPlan.thisWeek}
        defaultOpenToday
      />
      <WeekSection title="Next week" days={data.weeklyPlan.nextWeek} />
    </main>
  );
}
