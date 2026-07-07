"use client";

import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  lessonsForTrack,
  readCompletedAcademicLessons,
  sharedWritingLessons,
  trackProgress,
  WRITING_LESSON_TRACKS,
  type AcademicWritingLesson,
  type WritingLessonTrack,
} from "@/lib/ielts/writingLessons";

const LESSON_BASE = "/dashboard/ielts/student/writing/lessons";
const NAVY = "#0d1b35";

function LessonCard({
  lesson,
  index,
  done,
  accent,
}: {
  lesson: AcademicWritingLesson;
  index: number;
  done: boolean;
  accent: string;
}) {
  return (
    <Link
      href={`${LESSON_BASE}/${lesson.slug}`}
      className="group relative flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
      style={{ borderLeftWidth: 4, borderLeftColor: accent }}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: done ? "#0d9488" : accent }}
      >
        {done ? "✓" : index}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="font-bold text-[#0d1b35] group-hover:text-[#c9972c]">
            {lesson.title}
          </h3>
          {done ? (
            <span className="shrink-0 rounded-full bg-[#0d9488]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0d9488]">
              Complete
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs font-medium text-slate-500">
          {lesson.minutes} min read + practice
        </p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{lesson.desc}</p>
        <p className="mt-3 text-xs font-semibold text-[#c9972c] opacity-0 transition-opacity group-hover:opacity-100">
          Open lesson →
        </p>
      </div>
    </Link>
  );
}

function TrackPanel({
  track,
  completed,
}: {
  track: (typeof WRITING_LESSON_TRACKS)[number];
  completed: string[];
}) {
  const primary = lessonsForTrack(track.id);
  const shared = sharedWritingLessons();
  const progress = trackProgress(track.id, completed);

  return (
    <div className="space-y-6">
      <div
        className="rounded-2xl border p-5 md:p-6"
        style={{
          borderColor: `${track.accent}40`,
          background: `linear-gradient(135deg, ${track.accentSoft} 0%, #ffffff 55%)`,
        }}
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: track.accent }}
            >
              {track.label} · {track.criterion}
            </p>
            <h2 className="mt-1 text-xl font-bold text-[#0d1b35] md:text-2xl">
              {track.headline}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
              {track.description}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              First criterion:{" "}
              <span className="font-semibold text-[#0d1b35]">
                {track.criterionFull} ({track.criterion})
              </span>
            </p>
          </div>
          <div className="rounded-xl border border-white/80 bg-white/90 px-4 py-3 text-center shadow-sm">
            <p className="text-2xl font-bold tabular-nums" style={{ color: track.accent }}>
              {progress.done}/{progress.total}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
              Lessons done
            </p>
          </div>
        </div>

        {progress.total > 0 ? (
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/80">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.round((progress.done / progress.total) * 100)}%`,
                backgroundColor: track.accent,
              }}
            />
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-[#0d1b35]">
          {track.label} lessons
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          Start here — built specifically for {track.label.toLowerCase()}.
        </p>
        <div className="mt-3 space-y-3">
          {primary.map((lesson, i) => (
            <LessonCard
              key={lesson.slug}
              lesson={lesson}
              index={i + 1}
              done={completed.includes(lesson.slug)}
              accent={track.accent}
            />
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">
          Skills for both tasks
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          CC, LR & GRA — these lessons help Task 1 and Task 2.
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {shared.map((lesson, i) => (
            <LessonCard
              key={lesson.slug}
              lesson={lesson}
              index={i + 1}
              done={completed.includes(lesson.slug)}
              accent={NAVY}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function WritingLessonsHub() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [completed, setCompleted] = useState<string[]>([]);

  const trackParam = searchParams.get("track");
  const activeTrack: WritingLessonTrack =
    trackParam === "task1" ? "task1" : "task2";

  const setTrack = useCallback(
    (track: WritingLessonTrack) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "lessons");
      params.set("track", track);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    setCompleted(readCompletedAcademicLessons());
  }, []);

  const activeMeta = WRITING_LESSON_TRACKS.find((t) => t.id === activeTrack)!;

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-600">
        Pick a task type below. Each track has its own lessons — Task 1 (reports) and
        Task 2 (essays) are taught separately, like the real exam.
      </p>

      <div className="flex gap-2 rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {WRITING_LESSON_TRACKS.map((track) => {
          const isActive = activeTrack === track.id;
          const prog = trackProgress(track.id, completed);
          return (
            <button
              key={track.id}
              type="button"
              onClick={() => setTrack(track.id)}
              className={`flex flex-1 flex-col items-start rounded-lg px-4 py-3 text-left transition-all ${
                isActive
                  ? "shadow-sm"
                  : "hover:bg-slate-50"
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: track.accentSoft,
                      boxShadow: `inset 0 0 0 2px ${track.accent}55`,
                    }
                  : undefined
              }
            >
              <span
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: isActive ? track.accent : "#64748b" }}
              >
                {track.label}
              </span>
              <span
                className={`mt-0.5 text-sm font-bold ${
                  isActive ? "text-[#0d1b35]" : "text-slate-600"
                }`}
              >
                {track.headline}
              </span>
              <span className="mt-1 text-[10px] text-slate-500">
                {prog.done}/{prog.total} complete · {track.criterion}
              </span>
            </button>
          );
        })}
      </div>

      <TrackPanel track={activeMeta} completed={completed} />
    </div>
  );
}
