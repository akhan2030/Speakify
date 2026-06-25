"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/student/PageFetchStates";
import {
  ACCELERATOR_TRACKS,
  computeTrackProgress,
  getWeekDays,
  isValidTrack,
  loadProgress,
  type AcceleratorTrackId,
} from "@/lib/accelerator/tracks";

function WeekCard({
  trackId,
  weekNum,
  title,
  currentWeek,
  locked,
  expanded,
  onToggle,
}: {
  trackId: AcceleratorTrackId;
  weekNum: number;
  title: string;
  currentWeek: number;
  locked: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const days = getWeekDays(trackId, weekNum);
  const isCurrent = weekNum === currentWeek;
  const isPast = weekNum < currentWeek;

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm ${
        isCurrent ? "border-[#c9972c] ring-2 ring-[#c9972c]/20" : "border-slate-200"
      } ${locked ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        disabled={locked}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="flex items-center gap-4">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
              isPast
                ? "bg-green-600 text-white"
                : isCurrent
                  ? "bg-[#c9972c] text-[#0d1b35]"
                  : locked
                    ? "bg-slate-200 text-slate-500"
                    : "bg-[#0d1b35] text-[#c9972c]"
            }`}
          >
            {isPast ? "✓" : weekNum}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-[#0d9488]">
              Week {weekNum}
              {isCurrent ? " · Current Week" : ""}
              {locked ? " · Locked" : ""}
            </p>
            <h3 className="font-bold text-[#0d1b35]">{title}</h3>
          </div>
        </div>
        {!locked ? (
          <span className="text-sm text-slate-400">{expanded ? "▲" : "▼"}</span>
        ) : (
          <span className="text-lg">🔒</span>
        )}
      </button>

      {expanded && !locked ? (
        <div className="space-y-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
          {days.map((day) => (
            <Link
              key={day.key}
              href={`/dashboard/student/accelerator/${trackId}/week/${weekNum}?day=${day.key}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm hover:border-[#0d9488]"
            >
              <div>
                <p className="font-semibold text-[#0d1b35]">
                  {day.dayName} — {day.label}
                </p>
                <p className="text-xs text-slate-500">{day.theme}</p>
              </div>
              <span className="text-xs text-slate-400">~{day.estimatedMinutes}m</span>
            </Link>
          ))}
          <Link
            href={`/dashboard/student/accelerator/${trackId}/week/${weekNum}`}
            className="mt-2 block text-center text-sm font-semibold text-[#0d9488] hover:underline"
          >
            View full week →
          </Link>
        </div>
      ) : null}
    </div>
  );
}

export default function AcceleratorTrackPage() {
  const params = useParams();
  const pathname = usePathname();
  const trackParam = String(params.track);
  const trackId = isValidTrack(trackParam) ? trackParam : "plus";
  const track = ACCELERATOR_TRACKS[trackId];
  const isIeltsPortal = pathname.includes("/dashboard/ielts/");
  const practiceHref = isIeltsPortal
    ? `/dashboard/ielts/student/accelerator/${trackId}/practice`
    : `/dashboard/ielts/student/accelerator/${trackId}/practice`;

  const [currentWeek, setCurrentWeek] = useState(1);
  const [progressPercent, setProgressPercent] = useState(0);
  const [weeksComplete, setWeeksComplete] = useState(0);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const progress = loadProgress(trackId);
      const computed = computeTrackProgress(trackId, progress.completedDays);
      setCurrentWeek(computed.currentWeek);
      setProgressPercent(computed.progressPercent);
      setWeeksComplete(computed.weeksComplete);
      setExpandedWeek(computed.currentWeek);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load track progress");
    } finally {
      setReady(true);
    }
  }, [trackId]);

  if (!track) {
    return (
      <PageShell activePage="accelerator" loading={false} error="Unknown accelerator track">
        {null}
      </PageShell>
    );
  }

  return (
    <PageShell activePage="accelerator" loading={!ready} error={error}>
      <header className="border-b border-slate-200 bg-white px-8 py-8">
          <Link
            href="/dashboard/student/accelerator"
            className="text-sm font-semibold text-[#0d9488] hover:underline"
          >
            ← IELTS Accelerator
          </Link>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[#c9972c]">
                {track.name} Track
              </p>
              <h1 className="mt-1 text-2xl font-bold text-[#0d1b35]">
                {track.target}
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {track.duration} · Entry: {track.entry} · {track.price}
              </p>
              <Link
                href={practiceHref}
                className="mt-4 inline-flex rounded-xl bg-[#c9972c] px-5 py-2.5 text-sm font-bold text-[#0d1b35] hover:opacity-90"
              >
                Practice & Mock Tests →
              </Link>
            </div>
          </div>

          <div className="mt-6 max-w-xl">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-[#0d1b35]">
                Week {currentWeek} of {track.weekCount}
              </span>
              <span className="text-slate-500">{progressPercent}% complete</span>
            </div>
            <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#c9972c] transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {weeksComplete} of {track.weekCount} weeks completed
            </p>
          </div>
        </header>

        <div className="mx-auto max-w-3xl space-y-4 px-6 py-8">
          {track.weekTitles.map((title, i) => {
            const weekNum = i + 1;
            const locked = weekNum > currentWeek;
            const expanded = expandedWeek === weekNum;

            return (
              <WeekCard
                key={weekNum}
                trackId={trackId}
                weekNum={weekNum}
                title={title}
                currentWeek={currentWeek}
                locked={locked}
                expanded={expanded}
                onToggle={() => setExpandedWeek(expanded ? null : weekNum)}
              />
            );
          })}
        </div>
    </PageShell>
  );
}
