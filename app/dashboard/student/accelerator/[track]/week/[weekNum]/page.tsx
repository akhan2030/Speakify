"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import {
  ACCELERATOR_TRACKS,
  computeTrackProgress,
  dayProgressKey,
  getWeekDays,
  isValidTrack,
  loadProgress,
  saveProgress,
  weekComplete,
  type AcceleratorDay,
  type AcceleratorTrackId,
} from "@/lib/accelerator/tracks";

const DAY_ICONS: Record<string, string> = {
  monday: "📖",
  tuesday: "✏️",
  wednesday: "🗣️",
  thursday: "🔄",
  friday: "📝",
};

function DayCard({
  day,
  completed,
  highlighted,
  onMarkComplete,
}: {
  day: AcceleratorDay;
  weekNum: number;
  trackId: AcceleratorTrackId;
  completed: boolean;
  highlighted: boolean;
  onMarkComplete: () => void;
}) {
  return (
    <div
      className={`rounded-2xl border bg-white p-5 shadow-sm ${
        highlighted ? "border-[#c9972c] ring-2 ring-[#c9972c]/20" : "border-slate-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-[#0d9488]">
            {day.dayName}
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-bold text-[#0d1b35]">
            <span>{DAY_ICONS[day.key]}</span>
            {day.label}
          </h2>
          <p className="mt-2 text-sm text-slate-600">{day.theme}</p>
          <p className="mt-1 text-xs text-slate-400">~{day.estimatedMinutes} minutes</p>
        </div>
        {completed ? (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
            ✓ Done
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={day.href}
          className="rounded-xl bg-[#0d9488] px-5 py-2.5 text-sm font-bold text-white hover:opacity-95"
        >
          Open module →
        </Link>
        {!completed ? (
          <button
            type="button"
            onClick={onMarkComplete}
            className="rounded-xl border border-[#c9972c] px-5 py-2.5 text-sm font-bold text-[#8a6918] hover:bg-[#c9972c]/10"
          >
            Mark complete
          </button>
        ) : null}
      </div>
    </div>
  );
}

function WeeklyContentInner() {
  const params = useParams();
  const searchParams = useSearchParams();
  const trackParam = String(params.track);
  const weekParam = Number(params.weekNum);
  const dayFilter = searchParams.get("day");

  const trackId: AcceleratorTrackId = isValidTrack(trackParam) ? trackParam : "plus";
  const track = ACCELERATOR_TRACKS[trackId];
  const weekNum = Number.isFinite(weekParam)
    ? Math.min(Math.max(weekParam, 1), track.weekCount)
    : 1;

  const [completedDays, setCompletedDays] = useState<Record<string, boolean>>({});
  const [currentWeek, setCurrentWeek] = useState(1);
  const [ready, setReady] = useState(false);

  const refreshProgress = useCallback(() => {
    const progress = loadProgress(trackId);
    const computed = computeTrackProgress(trackId, progress.completedDays);
    setCompletedDays(progress.completedDays);
    setCurrentWeek(computed.currentWeek);
    setReady(true);
  }, [trackId]);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

  const markDayComplete = (dayKey: string) => {
    const progress = loadProgress(trackId);
    const key = dayProgressKey(weekNum, dayKey);
    progress.completedDays[key] = true;

    if (weekComplete(trackId, weekNum, progress.completedDays)) {
      const computed = computeTrackProgress(trackId, progress.completedDays);
      progress.currentWeek = computed.currentWeek;
    }

    saveProgress(progress);
    refreshProgress();
  };

  if (!ready) return <PageSpinner />;

  const locked = weekNum > currentWeek;
  const days = getWeekDays(trackId, weekNum);
  const weekTitle = track.weekTitles[weekNum - 1] ?? `Week ${weekNum}`;
  const filteredDays = dayFilter
    ? days.filter((d) => d.key === dayFilter)
    : days;

  if (locked) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-4xl">🔒</p>
        <h2 className="mt-4 text-lg font-bold text-[#0d1b35]">Week {weekNum} is locked</h2>
        <p className="mt-2 text-sm text-slate-600">
          Complete Week {currentWeek} first to unlock this content.
        </p>
        <Link
          href={`/dashboard/student/accelerator/${trackId}/week/${currentWeek}`}
          className="mt-6 inline-block rounded-xl bg-[#c9972c] px-5 py-2.5 text-sm font-bold text-[#0d1b35]"
        >
          Go to Week {currentWeek}
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link
        href={`/dashboard/student/accelerator/${trackId}`}
        className="text-sm font-semibold text-[#0d9488] hover:underline"
      >
        ← {track.name} Track
      </Link>

      <header className="mt-4 rounded-2xl bg-[#0d1b35] px-6 py-5 text-white">
        <p className="text-xs uppercase text-[#c9972c]">
          Week {weekNum} of {track.weekCount}
        </p>
        <h1 className="mt-1 text-2xl font-bold">{weekTitle}</h1>
        <p className="mt-2 text-sm text-slate-300">
          IELTS-specific daily tasks — Monday through Friday
        </p>
      </header>

      <div className="mt-6 space-y-4">
        {filteredDays.map((day) => (
          <DayCard
            key={day.key}
            day={day}
            weekNum={weekNum}
            trackId={trackId}
            completed={Boolean(completedDays[dayProgressKey(weekNum, day.key)])}
            highlighted={dayFilter === day.key}
            onMarkComplete={() => markDayComplete(day.key)}
          />
        ))}
      </div>

      {!dayFilter ? (
        <div className="mt-8 rounded-xl border border-[#0d9488]/30 bg-[#0d9488]/10 px-4 py-3 text-sm text-[#0d1b35]">
          <strong>Tip:</strong> Complete each day in order. Friday&apos;s mini-mock covers
          one IELTS section — use your module results to track improvement.
        </div>
      ) : null}
    </div>
  );
}

export default function AcceleratorWeekPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <div className="flex min-h-screen bg-slate-50">
        <StudentSidebar activePage="accelerator" />
        <main className="ml-[200px] min-h-screen flex-1 p-6">
          <WeeklyContentInner />
        </main>
      </div>
    </Suspense>
  );
}
