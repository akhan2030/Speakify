"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { PageSpinner } from "@/components/StudentSidebar";
import DailyPracticeProgressHeader from "@/components/practice/DailyPracticeProgressHeader";
import {
  storeDailyPracticeContext,
  withDailyPracticeParams,
} from "@/lib/dailyPractice/client";

type PracticeProgramme = "ielts" | "ielts_general";

type PracticeTask = {
  id: string;
  skill?: string;
  title?: string;
  topic?: string;
  task_type?: string;
  taskType?: string;
  cefr_level?: string;
  cefrLevel?: string;
  estimated_minutes?: number;
  estimatedMinutes?: number;
  wordCount?: number;
  practiceHref?: string;
  focusReason?: string | null;
  isPersonalized?: boolean;
  completed?: boolean;
};

type PersonalizationMeta = {
  topFocus?: string | null;
  personalizedCount?: number;
  focusSkills?: string[];
  weakSkills?: string[];
};

type PracticeProgress = {
  completedCount: number;
  totalCount: number;
  allComplete: boolean;
};

const SKILL_SEGMENTS: Record<string, string> = {
  vocabulary: "/vocabulary/study",
  reading: "/reading",
  listening: "/listening",
  speaking: "/speaking",
  writing: "/writing",
  grammar: "/grammar/practice",
};

function buildTaskHref(task: PracticeTask, base: string): string {
  const taskSkill = (task.skill ?? "").toLowerCase();
  if (task.practiceHref) {
    return `${base}${task.practiceHref}`;
  }
  if (taskSkill === "vocabulary" && task.topic) {
    return `${base}/vocabulary/study?topic=${encodeURIComponent(task.topic)}`;
  }
  return `${base}${SKILL_SEGMENTS[taskSkill] ?? "/practice"}`;
}

export default function DailyPracticePage({
  programme,
  base,
}: {
  programme: PracticeProgramme;
  base: string;
}) {
  const router = useRouter();
  const { status } = useSession();
  const isIeltsGeneralProgram = programme === "ielts_general";
  const [tasks, setTasks] = useState<PracticeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skill, setSkill] = useState("all");
  const [studentLevel, setStudentLevel] = useState("B1.1");
  const [levelMatch, setLevelMatch] = useState(true);
  const [personalization, setPersonalization] = useState<PersonalizationMeta | null>(
    null
  );
  const [progress, setProgress] = useState<PracticeProgress>({
    completedCount: 0,
    totalCount: 6,
    allComplete: false,
  });

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);
    fetch(`/api/student/practice?programme=${programme}`, { credentials: "include" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) {
          throw new Error(d.error ?? "Failed to load practice tasks");
        }
        return d;
      })
      .then((d) => {
        setTasks(d.tasks ?? []);
        setStudentLevel(d.studentLevel ?? d.cefrLevel ?? "B1.1");
        setLevelMatch(d.levelMatch !== false);
        setPersonalization(d.personalization ?? null);
        if (d.progress) {
          setProgress({
            completedCount: d.progress.completedCount ?? 0,
            totalCount: d.progress.totalCount ?? 6,
            allComplete: Boolean(d.progress.allComplete),
          });
        }
      })
      .catch((err) => {
        setTasks([]);
        setError(err instanceof Error ? err.message : "Failed to load practice tasks");
      })
      .finally(() => setLoading(false));
  }, [status, programme]);

  const filtered =
    skill === "all"
      ? tasks
      : tasks.filter((t) => (t.skill ?? "").toLowerCase() === skill);

  function handleStartPractice(task: PracticeTask) {
    setLoadingTaskId(task.id);
    const ctx = {
      taskId: task.id,
      title: task.title ?? "Daily practice task",
      programme,
      practiceBase: base,
      estimatedMinutes: task.estimated_minutes ?? task.estimatedMinutes,
    };
    storeDailyPracticeContext(ctx);
    const href = withDailyPracticeParams(buildTaskHref(task, base), ctx);
    router.push(href);
  }

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 text-slate-600">Loading...</div>
    );
  }

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-8">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0d1b35]">Daily Practice</h1>
          <p className="text-gray-500">
            {isIeltsGeneralProgram
              ? personalization?.topFocus
                ? `GT personalized practice — ${personalization.topFocus}`
                : "One GT task per skill — tuned to your letter, reading section, and speaking mistakes"
              : personalization?.topFocus
                ? `Personalized for your mistakes — ${personalization.topFocus}`
                : "One task per skill today — tuned to your weak areas and band targets"}
          </p>
        </div>
        <span className="rounded-full border border-[#c9972c]/40 bg-[#c9972c]/10 px-4 py-1.5 text-sm font-bold text-[#c9972c]">
          {studentLevel}
        </span>
      </div>

      <DailyPracticeProgressHeader
        completed={progress.completedCount}
        total={progress.totalCount}
        allComplete={progress.allComplete}
      />

      {error ? (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {personalization?.personalizedCount ? (
        <p className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          {personalization.personalizedCount} of 6 tasks target skills or question types
          where you have made mistakes or scored lowest.
        </p>
      ) : null}

      {!levelMatch && tasks.length > 0 ? (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          No {studentLevel} practice is published yet. Showing available content at other
          levels until new tasks are added.
        </p>
      ) : null}

      <div className="mb-6 mt-6 flex flex-wrap gap-2">
        {["all", "vocabulary", "reading", "listening", "speaking", "writing", "grammar"].map(
          (s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSkill(s)}
              className={`rounded-full px-4 py-2 text-sm font-medium capitalize ${
                skill === s
                  ? "bg-[#c9972c] text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {s}
            </button>
          )
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg text-gray-400">
            {error ? "Could not load practice tasks." : "No practice tasks available yet."}
          </p>
          <p className="mt-2 text-gray-300">
            {skill === "all"
              ? "Tasks refresh daily. If you still see this, try reloading in a moment."
              : `No ${skill} task loaded yet — check All or reload the page.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((task) => {
            const level = task.cefr_level ?? task.cefrLevel ?? studentLevel;
            const minutes = task.estimated_minutes ?? task.estimatedMinutes;
            const isVocabTopic =
              (task.skill ?? "").toLowerCase() === "vocabulary" && Boolean(task.topic);
            const isComplete = Boolean(task.completed);
            return (
              <div
                key={task.id}
                className={`rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md ${
                  isComplete ? "border-green-200 bg-green-50/40 opacity-90" : ""
                }`}
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <span className="text-xs font-bold uppercase text-[#c9972c]">
                    {isVocabTopic ? "Vocabulary" : task.skill}
                  </span>
                  {isComplete ? (
                    <span className="shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-green-800">
                      ✓ Completed
                    </span>
                  ) : null}
                </div>
                <h3
                  className={`mb-2 mt-1 font-bold ${
                    isComplete ? "text-slate-500 line-through" : "text-[#0d1b35]"
                  }`}
                >
                  {task.title}
                </h3>
                {task.focusReason ? (
                  <p className="mb-3 text-sm leading-relaxed text-slate-600">
                    {task.focusReason}
                  </p>
                ) : null}
                {task.isPersonalized ? (
                  <span className="mb-3 inline-block rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-700">
                    Personalized
                  </span>
                ) : null}
                {isVocabTopic && task.wordCount ? (
                  <p className="mb-3 text-sm text-slate-600">
                    {task.wordCount} word{task.wordCount === 1 ? "" : "s"} in this topic
                  </p>
                ) : null}
                <div className="mb-4 flex flex-wrap gap-2">
                  <span className="rounded bg-slate-100 px-2 py-1 text-xs">{level}</span>
                  {minutes ? (
                    <span className="rounded bg-slate-100 px-2 py-1 text-xs">
                      {minutes} min
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={loadingTaskId !== null}
                  onClick={() => handleStartPractice(task)}
                  className={`w-full rounded-lg py-2 text-sm font-bold text-white disabled:opacity-60 ${
                    isComplete
                      ? "bg-slate-500 hover:bg-slate-600"
                      : "bg-[#0d1b35] hover:bg-[#152a4d]"
                  }`}
                >
                  {loadingTaskId === task.id
                    ? "Loading…"
                    : isComplete
                      ? "Practice again"
                      : "Start Practice"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
