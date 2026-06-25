"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { getDayTemplate } from "@/lib/pathway/dayStructure";

export default function PathwayLessonContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const levelId = String(params.levelId);
  const dayType = String(params.dayType);
  const week = searchParams.get("week") ?? "1";

  const day = getDayTemplate(dayType);
  const [levelCode, setLevelCode] = useState("");
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonId, setLessonId] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/pathway/level/${levelId}`)
      .then((r) => r.json())
      .then((d) => {
        setLevelCode(d.level?.code ?? levelId);
        const weekData = (d.weeks ?? []).find(
          (w: { weekNumber: number }) => w.weekNumber === Number(week)
        );
        const dayRow = weekData?.days?.find(
          (row: { dayType: string }) => row.dayType === dayType
        );
        setLessonTitle(dayRow?.lessonTitle ?? day?.dayLabel ?? dayType);
        setLessonId(dayRow?.lessonId ?? null);
        setCompleted(Boolean(dayRow?.completed));
      })
      .finally(() => setLoading(false));
  }, [levelId, dayType, week, day?.dayLabel]);

  const markComplete = async () => {
    if (!lessonId) return;
    setSaving(true);
    await fetch("/api/course/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, status: "completed", score: 100 }),
    });
    setCompleted(true);
    setSaving(false);
  };

  if (loading) return <PageSpinner />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <StudentSidebar activePage="course" />
      <main className="ml-[200px] min-h-screen flex-1 p-6">
        <Link
          href={`/dashboard/student/pathway/${levelId}`}
          className="text-sm font-semibold text-[#0d9488] hover:underline"
        >
          ← {levelCode} pathway
        </Link>

        <div className="mt-6 max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase text-[#0d9488]">
            Week {week} · {day?.dayName}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[#0d1b35]">
            {day?.icon} {day?.dayLabel}
          </h1>
          <p className="mt-2 text-slate-600">{lessonTitle}</p>
          <p className="mt-1 text-sm text-slate-400">{day?.theme}</p>

          <div className="mt-8 rounded-xl bg-[#0d1b35]/5 p-5 text-sm text-slate-600">
            Lesson content for this day will open here. Complete the activities
            for {levelCode} Week {week} — {day?.dayLabel?.toLowerCase()}.
          </div>

          {completed ? (
            <p className="mt-6 text-sm font-semibold text-[#0d9488]">✓ Completed</p>
          ) : lessonId ? (
            <button
              type="button"
              disabled={saving}
              onClick={markComplete}
              className="mt-6 rounded-xl bg-[#c9972c] px-5 py-3 text-sm font-bold text-[#0d1b35] disabled:opacity-60"
            >
              {saving ? "Saving…" : "Mark lesson complete"}
            </button>
          ) : (
            <p className="mt-6 text-sm text-slate-500">
              Progress tracking will sync once lesson records are linked.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
