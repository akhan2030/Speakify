"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";

type PracticeTask = {
  id: string;
  skill?: string;
  title?: string;
  cefr_level?: string;
  cefrLevel?: string;
  estimated_minutes?: number;
  estimatedMinutes?: number;
};

const SKILL_HREF: Record<string, string> = {
  vocabulary: "/dashboard/student/vocabulary/study",
  reading: "/dashboard/student/reading",
  listening: "/dashboard/student/listening",
  speaking: "/dashboard/student/speaking",
  writing: "/dashboard/student/writing",
  grammar: "/dashboard/student/grammar/practice",
};

export default function StudentPracticePage() {
  const router = useRouter();
  const { status } = useSession();
  const [tasks, setTasks] = useState<PracticeTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTaskId, setLoadingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [skill, setSkill] = useState("all");
  const [studentLevel, setStudentLevel] = useState("B1.1");
  const [levelMatch, setLevelMatch] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    setLoading(true);
    setError(null);
    fetch("/api/student/practice", { credentials: "include" })
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
      })
      .catch((err) => {
        setTasks([]);
        setError(err instanceof Error ? err.message : "Failed to load practice tasks");
      })
      .finally(() => setLoading(false));
  }, [status]);

  const filtered =
    skill === "all"
      ? tasks
      : tasks.filter((t) => (t.skill ?? "").toLowerCase() === skill);

  function handleStartPractice(task: PracticeTask) {
    setLoadingTaskId(task.id);
    const href =
      SKILL_HREF[(task.skill ?? "").toLowerCase()] ?? "/dashboard/student/practice";
    console.log("Navigating to practice:", task.id, href);
    router.push(href);
  }

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <StudentSidebar activePage="practice" />
        <div className="ml-[200px] flex-1 p-8 text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <StudentSidebar activePage="practice" />
      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50 p-8">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#0d1b35]">Daily Practice</h1>
            <p className="text-gray-500">
              Fresh content added every day — tailored to your level
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
              Check back tomorrow — new content is added daily.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((task) => {
              const level = task.cefr_level ?? task.cefrLevel ?? studentLevel;
              const minutes = task.estimated_minutes ?? task.estimatedMinutes;
              return (
                <div
                  key={task.id}
                  className="rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <span className="text-xs font-bold uppercase text-[#c9972c]">
                    {task.skill}
                  </span>
                  <h3 className="mb-2 mt-1 font-bold text-[#0d1b35]">{task.title}</h3>
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
