"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import {
  MissionCompleteBanner,
  MissionProgressBar,
  MissionTaskCard,
  type MissionTaskItem,
} from "@/components/ielts/MissionTaskCard";

type MissionData = {
  todayDate: string;
  dayName: string;
  subtitle: string;
  tasks: MissionTaskItem[];
  completedCount: number;
  totalCount: number;
  remainingMinutes: number;
  allComplete: boolean;
  isToday: boolean;
  streak: { current: number; longest: number };
  tomorrow: {
    dayName: string;
    subtitle: string;
    tasks: Array<{ id: string; title: string; minutes: number; taskType: string }>;
    totalMinutes: number;
  };
};

export default function TodayMissionPage() {
  const [data, setData] = useState<MissionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [celebrate, setCelebrate] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/student/ielts-mission");
    const json = await res.json();
    if (!json.error) setData(json);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleTask(task: MissionTaskItem) {
    if (!data?.isToday) return;
    setTogglingId(task.id);
    try {
      const res = await fetch("/api/student/ielts-mission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          action: task.completed ? "uncomplete" : "complete",
          timeSpentMinutes: task.minutes,
        }),
      });
      const json = await res.json();
      if (json.error) return;

      if (json.missionComplete && !data.allComplete) {
        setCelebrate(true);
      }

      setData((prev) =>
        prev
          ? {
              ...prev,
              tasks: prev.tasks.map((t) =>
                t.id === task.id ? { ...t, completed: !t.completed } : t
              ),
              completedCount: json.completedCount,
              totalCount: json.totalCount,
              remainingMinutes: json.remainingMinutes,
              allComplete: json.allComplete,
              streak: {
                current: json.streak?.currentStreak ?? prev.streak.current,
                longest: json.streak?.longestStreak ?? prev.streak.longest,
              },
            }
          : prev
      );
    } finally {
      setTogglingId(null);
    }
  }

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

      <header className="mt-4 rounded-xl border-l-4 border-l-[#c9972c] border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#c9972c]">
          Today&apos;s Mission
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#0d1b35]">
          {data.dayName} — {data.todayDate}
        </h1>
        <p className="mt-2 text-sm text-slate-600">{data.subtitle}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="font-semibold text-[#c9972c]">
            🔥 {data.streak.current}-day streak
          </span>
          <span className="text-slate-500">~{data.remainingMinutes} min remaining</span>
        </div>
      </header>

      {data.allComplete || celebrate ? (
        <div className="mt-6">
          <MissionCompleteBanner
            streak={data.streak.current}
            tomorrowDayName={data.tomorrow.dayName}
          />
        </div>
      ) : null}

      <section className="mt-6">
        <MissionProgressBar completed={data.completedCount} total={data.totalCount} />
        <ul className="mt-4 space-y-3">
          {data.tasks.map((task) => (
            <MissionTaskCard
              key={task.id}
              task={task}
              canToggle={data.isToday}
              toggling={togglingId === task.id}
              onToggle={toggleTask}
            />
          ))}
        </ul>
      </section>

      {!data.allComplete ? (
        <p className="mt-4 text-center text-sm text-slate-500">
          Tap ☐ to mark done · or open a task to study first
        </p>
      ) : null}

      <section className="mt-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-[#0d1b35]">Tomorrow&apos;s preview</h2>
        <p className="mt-1 text-sm font-medium text-[#0d9488]">{data.tomorrow.dayName}</p>
        <p className="text-sm text-slate-600">{data.tomorrow.subtitle}</p>
        <ul className="mt-3 space-y-1 text-sm text-slate-700">
          {data.tomorrow.tasks.map((t) => (
            <li key={t.id} className="flex justify-between gap-2">
              <span>{t.title}</span>
              <span className="shrink-0 text-xs text-slate-400">{t.minutes}m</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-500">
          Total: {data.tomorrow.totalMinutes} minutes
        </p>
        <Link
          href="/dashboard/ielts/student/progress?tab=programme&view=weekly"
          className="mt-4 inline-block text-sm font-semibold text-[#0d9488] hover:underline"
        >
          View full weekly plan →
        </Link>
      </section>
    </main>
  );
}
