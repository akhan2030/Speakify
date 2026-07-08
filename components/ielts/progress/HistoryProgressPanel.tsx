"use client";

import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import BandTrendChart from "@/components/ielts/dashboard/BandTrendChart";
import StudyHistoryCalendar from "@/components/ielts/StudyHistoryCalendar";
import { HistoryEmptyState } from "@/components/ielts/progress/AchievementCard";

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

const DEFAULT_API = "/api/student/ielts-history";

export default function HistoryProgressPanel({
  apiPath = DEFAULT_API,
  todayHref = "/dashboard/ielts/student/today",
  practiceHref = "/dashboard/ielts/student/practice",
}: {
  apiPath?: string;
  todayHref?: string;
  practiceHref?: string;
}) {
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiPath)
      .then((r) => r.json())
      .then((json) => {
        if (!json.error) setData(json);
      })
      .finally(() => setLoading(false));
  }, [apiPath]);

  if (loading || !data) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  const isEmpty = data.totalStudyDays === 0;
  const maxHours = Math.max(...data.weeklyHours.map((w) => w.hours), 1);

  return (
    <div>
      <p className="text-sm text-slate-600">
        {isEmpty
          ? "No study days logged yet in the last 8 weeks."
          : `${data.totalStudyDays} study days in the last 8 weeks.`}
      </p>

      {isEmpty ? (
        <HistoryEmptyState todayHref={todayHref} practiceHref={practiceHref} />
      ) : null}

      <div className={`grid gap-6 lg:grid-cols-2 ${isEmpty ? "mt-6" : "mt-6"}`}>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-[#0d1b35]">Study calendar</h3>
          <p className="mt-1 text-xs text-slate-500">Last 8 weeks — tap a day for details</p>
          <div className="mt-4">
            <StudyHistoryCalendar days={data.days} />
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-[#0d1b35]">Band score trend</h3>
          <p className="mt-1 text-xs text-slate-500">Overall estimate over time</p>
          <div className="mt-4">
            <BandTrendChart
              points={data.bandTrend}
              target={data.targetBand}
              emptyCtaHref={todayHref}
            />
          </div>
        </section>
      </div>

      {data.weeklyHours.length ? (
        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-[#0d1b35]">Weekly study hours</h3>
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
    </div>
  );
}
