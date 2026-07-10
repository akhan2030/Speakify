"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  postDailyPracticeComplete,
  storeDailyPracticeContext,
  withDailyPracticeParams,
  type DailyPracticeContext,
} from "@/lib/dailyPractice/client";
import { useDailyPracticeSession } from "@/components/practice/useDailyPracticeSession";

type NextTask = {
  id: string;
  title?: string;
  skill?: string;
  practiceHref?: string;
  estimatedMinutes?: number | null;
};

type CompletionResult = {
  completedCount: number;
  totalCount: number;
  allComplete: boolean;
  nextTask: NextTask | null;
  streak?: { currentStreak?: number };
};

export default function DailyPracticeContinuePanel({
  timeSpentMinutes = 10,
  className = "",
}: {
  timeSpentMinutes?: number;
  className?: string;
}) {
  const ctx = useDailyPracticeSession();
  const router = useRouter();
  const postedRef = useRef(false);
  const [result, setResult] = useState<CompletionResult | null>(null);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ctx || postedRef.current) return;
    postedRef.current = true;
    setPosting(true);
    setError(null);

    postDailyPracticeComplete({
      taskId: ctx.taskId,
      programme: ctx.programme,
      timeSpentMinutes,
    })
      .then((data) => {
        setResult(data as CompletionResult);
      })
      .catch((err) => {
        postedRef.current = false;
        setError(err instanceof Error ? err.message : "Could not save progress");
      })
      .finally(() => setPosting(false));
  }, [ctx, timeSpentMinutes]);

  if (!ctx) return null;

  const practiceHome = `${ctx.practiceBase}/practice`;

  function startNext(nextTask: NextTask) {
    const nextCtx: DailyPracticeContext = {
      taskId: nextTask.id,
      title: nextTask.title ?? "Daily practice task",
      programme: ctx!.programme,
      practiceBase: ctx!.practiceBase,
      estimatedMinutes: nextTask.estimatedMinutes ?? undefined,
    };
    storeDailyPracticeContext(nextCtx);

    const href = nextTask.practiceHref
      ? withDailyPracticeParams(`${ctx!.practiceBase}${nextTask.practiceHref}`, nextCtx)
      : practiceHome;

    router.push(href);
  }

  return (
    <div
      className={`rounded-2xl border border-teal-200 bg-teal-50 p-6 text-left shadow-sm ${className}`}
    >
      {posting ? (
        <p className="text-sm text-teal-900">Saving your daily practice progress…</p>
      ) : error ? (
        <p className="text-sm text-red-700">{error}</p>
      ) : result ? (
        <>
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
            Daily practice
          </p>
          <p className="mt-2 text-lg font-bold text-[#0d1b35]">Nice work!</p>
          <p className="mt-1 text-sm text-slate-700">
            {result.completedCount} of {result.totalCount} tasks completed today.
          </p>

          {result.allComplete ? (
            <p className="mt-3 text-base font-semibold text-[#0d1b35]">
              All done for today! 🎉
              {result.streak?.currentStreak
                ? ` ${result.streak.currentStreak}-day streak.`
                : ""}
            </p>
          ) : result.nextTask ? (
            <p className="mt-3 text-sm text-slate-700">
              Next up:{" "}
              <span className="font-semibold text-[#0d1b35]">
                {result.nextTask.title}
              </span>
            </p>
          ) : null}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {!result.allComplete && result.nextTask ? (
              <button
                type="button"
                onClick={() => startNext(result.nextTask!)}
                className="rounded-xl bg-[#0d1b35] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#152a4d]"
              >
                Start Next Task →
              </button>
            ) : null}
            <Link
              href={practiceHome}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#0d1b35] hover:bg-slate-50"
            >
              {result.allComplete ? "Back to Daily Practice" : "Choose another task"}
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
