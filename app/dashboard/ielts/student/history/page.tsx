"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import BandTrendChart from "@/components/ielts/dashboard/BandTrendChart";
import StudyHistoryCalendar from "@/components/ielts/StudyHistoryCalendar";

type HistoryData = {
  days: Array<{
    date: string;
    label: string;
    studied: boolean;
    tasksCompleted: number;
    summary: string;
  }>;
  bandTrend: Array<{ date: string; label: string; band: number }>;
  weeklyHours: Array<{ week: string; hours: number }>;
  totalStudyDays: number;
  targetBand: number;
};

export default function StudyHistoryPage() {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/student/ielts-history")
      .then((r) => r.json())
      .then((json) => {
        if (!json.error) setData(json);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <PageSpinner />
      </div>
    );
  }

  const maxHours = Math.max(...data.weeklyHours.map((w) => w.hours), 1);

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <Link
        href="/dashboard/ielts/student"
        className="text-sm font-semibold text-[#0d9488] hover:underline"
      >
        ← Dashboard
      </Link>
      <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">Study History</h1>
      <p className="mt-2 text-sm text-slate-600">
        {data.totalStudyDays} study days in the last 8 weeks.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[#0d1b35]">Study calendar</h2>
          <p className="mt-1 text-xs text-slate-500">Last 8 weeks — tap a day for details</p>
          <div className="mt-4">
            <StudyHistoryCalendar days={data.days} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[#0d1b35]">Band score trend</h2>
          <p className="mt-1 text-xs text-slate-500">Overall estimate over time</p>
          <div className="mt-4">
            <BandTrendChart points={data.bandTrend} target={data.targetBand} />
          </div>
        </section>
      </div>

      {data.weeklyHours.length ? (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-[#0d1b35]">Weekly study hours</h2>
          <div className="mt-4 flex items-end gap-2 overflow-x-auto pb-2">
            {data.weeklyHours.map((w) => (
              <div key={w.week} className="flex min-w-[48px] flex-col items-center gap-1">
                <div
                  className="w-8 rounded-t bg-[#0d9488]"
                  style={{ height: `${Math.max(8, (w.hours / maxHours) * 80)}px` }}
                  title={`${w.hours}h`}
                />
                <span className="text-[10px] text-slate-500">{w.week}</span>
                <span className="text-[10px] font-semibold text-[#0d1b35]">{w.hours}h</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
