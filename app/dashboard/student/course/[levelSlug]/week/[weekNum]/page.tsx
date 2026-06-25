"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import Progress7030Bar from "@/components/course/Progress7030Bar";
import { canAccessLesson, canAccessWeek } from "@/lib/course/progression7030";

type Lesson = {
  id: string;
  slug: string;
  title: string;
  skill: string;
  contentType: string;
  status: string;
  estimatedMinutes: number;
};

export default function WeekUnitPage() {
  const params = useParams();
  const levelSlug = String(params.levelSlug);
  const weekNum = Number(params.weekNum);
  const [levelCode, setLevelCode] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress7030, setProgress7030] = useState({
    weekNumber: weekNum,
    reviewPercent: 0,
    newUnlocked: false,
    reviewCompleted: 0,
    reviewTotal: 0,
    newCompleted: 0,
    newTotal: 0,
    newPercent: 0,
    overallPercent: 0,
  });
  const [midLevelPassed, setMidLevelPassed] = useState(true);
  const [weekCount, setWeekCount] = useState(4);
  const [midLevelUnlockWeek, setMidLevelUnlockWeek] = useState(2);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  const load = () => {
    fetch(`/api/course/levels/${levelSlug}`)
      .then((r) => r.json())
      .then((d) => {
        setLevelCode(d.level?.code ?? levelSlug);
        setMidLevelPassed(Boolean(d.midLevelPassed));
        setWeekCount(d.weekCount ?? 4);
        setMidLevelUnlockWeek(d.midLevelUnlockWeek ?? 2);
        const week = (d.weeks ?? []).find((w: { week_number: number }) => w.week_number === weekNum);
        setLessons(week?.lessons ?? []);
        setProgress7030(week?.progress7030 ?? progress7030);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [levelSlug, weekNum]);

  const completeLesson = async (lessonId: string) => {
    setCompleting(lessonId);
    await fetch("/api/course/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, status: "completed", score: 100 }),
    });
    setCompleting(null);
    load();
  };

  if (loading) return <PageSpinner />;

  const weekAccess = canAccessWeek(weekNum, midLevelPassed, weekCount);

  if (!weekAccess.allowed) {
    return (
      <div className="flex min-h-screen bg-white">
        <StudentSidebar activePage="course" />
        <main className="ml-[200px] min-h-screen flex-1 bg-slate-50 p-6">
          <Link
            href={`/dashboard/student/course/${levelSlug}`}
            className="text-sm font-semibold text-[#0d9488] hover:underline"
          >
            ← {levelCode} home
          </Link>
          <div className="mt-8 max-w-lg rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h1 className="text-xl font-bold text-[#0d1b35]">Week {weekNum} is locked</h1>
            <p className="mt-2 text-sm text-amber-900">{weekAccess.reason}</p>
            <Link
              href={`/dashboard/student/course/${levelSlug}/test/mid_level`}
              className="mt-5 inline-block rounded-xl bg-[#0d1b35] px-5 py-3 text-sm font-bold text-white hover:opacity-95"
            >
              Take mid-level check →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar activePage="course" />

      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50 p-6">
        <Link
          href={`/dashboard/student/course/${levelSlug}`}
          className="text-sm font-semibold text-[#0d9488] hover:underline"
        >
          ← {levelCode} home
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">
          Week {weekNum} — {levelCode}
        </h1>

        <div className="mt-6">
          <Progress7030Bar progress={progress7030} />
        </div>

        <div className="mt-8 space-y-3">
          {lessons.map((lesson) => {
            const access = canAccessLesson(
              {
                id: lesson.id,
                slug: lesson.slug,
                title: lesson.title,
                contentType: lesson.contentType as "review" | "new",
                status: lesson.status as "not_started" | "in_progress" | "completed",
                progressionWeight: 10,
              },
              progress7030
            );
            const done = lesson.status === "completed";

            return (
              <div
                key={lesson.id}
                className={`rounded-xl border bg-white p-4 shadow-sm ${
                  done ? "border-[#0d9488]/40" : "border-slate-200"
                } ${!access.allowed ? "opacity-60" : ""}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                          lesson.contentType === "review"
                            ? "bg-[#c9972c]/20 text-[#c9972c]"
                            : "bg-[#0d9488]/20 text-[#0d9488]"
                        }`}
                      >
                        {lesson.contentType}
                      </span>
                      <span className="text-xs text-slate-500">{lesson.skill}</span>
                    </div>
                    <h3 className="mt-2 font-semibold text-[#0d1b35]">{lesson.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">
                      ~{lesson.estimatedMinutes} min
                    </p>
                    {!access.allowed ? (
                      <p className="mt-2 text-xs text-amber-600">{access.reason}</p>
                    ) : null}
                  </div>

                  {done ? (
                    <span className="text-sm font-semibold text-[#0d9488]">✓ Complete</span>
                  ) : access.allowed ? (
                    <button
                      type="button"
                      disabled={completing === lesson.id}
                      onClick={() => completeLesson(lesson.id)}
                      className="rounded-lg bg-[#c9972c] px-4 py-2 text-sm font-bold text-[#0d1b35] hover:opacity-95 disabled:opacity-60"
                    >
                      {completing === lesson.id ? "Saving…" : "Mark complete"}
                    </button>
                  ) : (
                    <span className="text-xs font-medium text-slate-400">Locked</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {weekNum === midLevelUnlockWeek ? (
          <Link
            href={`/dashboard/student/course/${levelSlug}/test/mid_level`}
            className="mt-8 inline-block rounded-xl bg-[#0d1b35] px-5 py-3 text-sm font-bold text-white hover:opacity-95"
          >
            Take Mid-Level Check →
          </Link>
        ) : null}

        {weekNum === weekCount ? (
          <Link
            href={`/dashboard/student/course/${levelSlug}/test/graduation`}
            className="mt-8 inline-block rounded-xl bg-[#c9972c] px-5 py-3 text-sm font-bold text-[#0d1b35] hover:opacity-95"
          >
            Take Graduation Exam →
          </Link>
        ) : null}
      </main>
    </div>
  );
}
