"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { PageShell } from "@/components/student/PageFetchStates";
import { isProgramStudentPath } from "@/lib/programType";
import { apiGet } from "@/lib/pathway/apiFetch";
import type { WeeklySchedule } from "@/lib/pathway/dailyStudyPlan";

type StudyPlanResponse = {
  weeklySchedule?: WeeklySchedule;
  projectedAchievement?: { projectedDateLabel?: string };
  error?: string;
  fallback?: boolean;
};

const DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function StudyPlanPage() {
  const pathname = usePathname();
  const dashboardHref = isProgramStudentPath(pathname)
    ? "/dashboard/pathway/student"
    : "/dashboard/student";
  const [schedule, setSchedule] = useState<WeeklySchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Record<string, boolean>>({});

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiGet("/api/student/study-plan")
      .then(async (r) => {
        const json = (await r.json()) as StudyPlanResponse;
        if (json.fallback || json.weeklySchedule) {
          return json;
        }
        if (json.error) {
          throw new Error(json.error);
        }
        throw new Error("Study plan data is missing");
      })
      .then((json) => {
        setSchedule(json.weeklySchedule ?? null);
        const initial: Record<string, boolean> = {};
        json.weeklySchedule?.tasks?.forEach((t) => {
          initial[t.id] = t.completed;
        });
        setDone(initial);
      })
      .catch((err: Error) => {
        setSchedule(null);
        setError(err.message ?? "Could not load study plan");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const tasks = schedule?.tasks ?? [];

  return (
    <PageShell activePage="study-plan" loading={loading} error={error}>
      {!schedule ? (
        <div className="flex min-h-[50vh] items-center justify-center p-6">
          <p className="text-slate-600">No study plan available.</p>
        </div>
      ) : (
        <div className="p-6">
          <Link
            href={dashboardHref}
            className="text-sm font-semibold text-[#0d9488] hover:underline"
          >
            ← Dashboard
          </Link>

          <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">Your Study Plan</h1>
          <p className="mt-1 text-sm text-slate-600">
            {schedule.levelName ?? "Your level"} · Week {schedule.currentWeek ?? 1}
            {schedule.targetDate ? ` · Target: ${schedule.targetDate}` : ""}
          </p>

          {schedule.todayPriority ? (
            <div className="mt-6 rounded-2xl border-2 border-[#c9972c] bg-[#c9972c]/10 p-5">
              <p className="text-xs font-bold uppercase text-[#c9972c]">Today&apos;s Priority</p>
              <p className="mt-2 font-bold text-[#0d1b35]">{schedule.todayPriority.label}</p>
              <p className="mt-1 text-sm text-slate-600">
                ~{schedule.todayPriority.estimatedMinutes} min
              </p>
              <Link
                href={schedule.todayPriority.href}
                className="mt-4 inline-block rounded-xl bg-[#c9972c] px-5 py-2.5 text-sm font-bold text-[#0d1b35]"
              >
                Start now →
              </Link>
            </div>
          ) : null}

          {schedule.weakestSkill ? (
            <p className="mt-4 text-sm text-slate-600">
              Weakest skill focus: <strong>{schedule.weakestSkill}</strong>
            </p>
          ) : null}

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task, i) => (
              <div
                key={task.id}
                className={`rounded-2xl border bg-white p-5 shadow-sm ${
                  task.isPriority ? "border-[#c9972c]" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs font-semibold uppercase text-[#0d9488]">
                      {DAY_NAMES[i] ?? task.day}
                    </p>
                    <h2 className="mt-1 font-bold text-[#0d1b35]">{task.label}</h2>
                  </div>
                  <label className="flex items-center gap-1 text-xs">
                    <input
                      type="checkbox"
                      checked={done[task.id] ?? false}
                      onChange={(e) =>
                        setDone((p) => ({ ...p, [task.id]: e.target.checked }))
                      }
                    />
                    Done
                  </label>
                </div>
                <p className="mt-2 text-xs text-slate-500">~{task.estimatedMinutes} min</p>
                <Link
                  href={task.href}
                  className="mt-4 inline-block text-sm font-semibold text-[#0d9488] hover:underline"
                >
                  Open lesson →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </PageShell>
  );
}
