"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";

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
};

type PersonalizationMeta = {
  topFocus?: string | null;
  personalizedCount?: number;
  focusSkills?: string[];
  weakSkills?: string[];
};

const SKILL_SEGMENTS: Record<string, string> = {
  vocabulary: "/vocabulary/study",
  reading: "/reading",
  listening: "/listening",
  speaking: "/speaking",
  writing: "/writing",
  grammar: "/grammar/practice",
};

export default function StudentPracticePage() {
  const router = useRouter();
  const { status } = useSession();
  const { base, usesProgramShell, isIeltsGeneralProgram } = usePathwayStudentContext();
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

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);
    fetch(
      `/api/student/practice?programme=${isIeltsGeneralProgram ? "ielts_general" : "ielts"}`,
      { credentials: "include" }
    )
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
      })
      .catch((err) => {
        setTasks([]);
        setError(err instanceof Error ? err.message : "Failed to load practice tasks");
      })
      .finally(() => setLoading(false));
  }, [status, isIeltsGeneralProgram]);

  const filtered =
    skill === "all"
      ? tasks
      : tasks.filter((t) => (t.skill ?? "").toLowerCase() === skill);

  function handleStartPractice(task: PracticeTask) {
    setLoadingTaskId(task.id);
    const skill = (task.skill ?? "").toLowerCase();
    if (task.practiceHref) {
      router.push(`${base}${task.practiceHref}`);
      return;
    }
    if (skill === "vocabulary" && task.topic) {
      const href = `${base}/vocabulary/study?topic=${encodeURIComponent(task.topic)}`;
      router.push(href);
      return;
    }
    const href = `${base}${SKILL_SEGMENTS[skill] ?? "/practice"}`;
    router.push(href);
  }

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        {!usesProgramShell ? <StudentSidebar activePage="practice" /> : null}
        <div
          className={`flex-1 p-8 text-slate-600 ${usesProgramShell ? "" : "ml-[200px]"}`}
        >
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {!usesProgramShell ? <StudentSidebar activePage="practice" /> : null}
      <main
        className={`min-h-screen flex-1 bg-slate-50 p-8 ${usesProgramShell ? "" : "ml-[200px]"}`}
      >
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
              return (
                <div
                  key={task.id}
                  className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <span className="text-xs font-bold uppercase text-[#c9972c]">
                    {isVocabTopic ? "Vocabulary" : task.skill}
                  </span>
                  <h3 className="mb-2 mt-1 font-bold text-[#0d1b35]">{task.title}</h3>
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
                    className="w-full rounded-lg bg-[#0d1b35] py-2 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {loadingTaskId === task.id ? "Loading…" : "Start Practice"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
