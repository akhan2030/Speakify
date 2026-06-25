"use client";

import Link from "next/link";

export type MissionTaskItem = {
  id: string;
  title: string;
  minutes: number;
  href: string;
  taskType: string;
  missionKey?: string;
  completed: boolean;
};

export function MissionProgressBar({
  completed,
  total,
}: {
  completed: number;
  total: number;
}) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-500">
        <span>
          {completed}/{total} tasks completed
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#c9972c] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function MissionTaskCard({
  task,
  canToggle,
  toggling,
  onToggle,
}: {
  task: MissionTaskItem;
  canToggle?: boolean;
  toggling?: boolean;
  onToggle?: (task: MissionTaskItem) => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {canToggle ? (
          <button
            type="button"
            disabled={toggling}
            onClick={() => onToggle?.(task)}
            className={`shrink-0 text-xl leading-none ${task.completed ? "text-green-600" : "text-slate-300 hover:text-[#c9972c]"}`}
            aria-label={task.completed ? "Mark incomplete" : "Mark complete"}
          >
            {task.completed ? "☑" : "☐"}
          </button>
        ) : (
          <span className={task.completed ? "text-green-600" : "text-slate-400"}>
            {task.completed ? "☑" : "☐"}
          </span>
        )}
        <div className="min-w-0">
          <p
            className={`font-medium ${task.completed ? "text-slate-400 line-through" : "text-[#0d1b35]"}`}
          >
            {task.title}
          </p>
          <p className="text-xs text-slate-500">
            {task.minutes} min · {task.taskType}
          </p>
        </div>
      </div>
      <Link
        href={task.href}
        className="shrink-0 rounded-lg bg-[#c9972c] px-3 py-1.5 text-xs font-bold text-[#0d1b35] hover:opacity-95"
      >
        {task.completed ? "Review" : "Start"}
      </Link>
    </li>
  );
}

export function MissionCompleteBanner({
  streak,
  tomorrowDayName,
}: {
  streak: number;
  tomorrowDayName: string;
}) {
  return (
    <div className="rounded-xl border border-green-300 bg-green-50 p-6 text-center">
      <p className="text-xl font-bold text-green-700">Today&apos;s mission complete! 🎉</p>
      <p className="mt-2 text-sm text-slate-600">
        {streak > 0 ? (
          <>
            🔥 {streak}-day streak — keep it going!
          </>
        ) : (
          "Great work today!"
        )}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        Come back tomorrow for {tomorrowDayName}&apos;s tasks
      </p>
    </div>
  );
}
