"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { ReadinessMeterData } from "@/lib/course/readinessMeter";

const STATUS_COLORS = {
  red: { ring: "stroke-red-400", text: "text-red-600", bg: "bg-red-50" },
  amber: { ring: "stroke-amber-400", text: "text-amber-600", bg: "bg-amber-50" },
  gold: { ring: "stroke-[#c9972c]", text: "text-[#c9972c]", bg: "bg-[#c9972c]/10" },
  teal: { ring: "stroke-[#0d9488]", text: "text-[#0d9488]", bg: "bg-[#0d9488]/10" },
};

function ReadinessRing({ percent, colorClass }: { percent: number; colorClass: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          className={colorClass}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#0d1b35]">{percent}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Ready
        </span>
      </div>
    </div>
  );
}

export default function IeltsReadinessMeter() {
  const [data, setData] = useState<ReadinessMeterData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/student/readiness", { cache: "no-store" });
        const json = await res.json().catch(() => null);
        if (!cancelled && json && !json.error) {
          setData(json as ReadinessMeterData);
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (loading) {
    return (
      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      </section>
    );
  }

  if (!data) return null;

  const colors = STATUS_COLORS[data.statusColor];
  const projected = data.projectedAchievement;
  const rec = data.recommendations;

  return (
    <section className="mb-8 overflow-hidden rounded-2xl border border-[#c9972c]/30 bg-gradient-to-br from-white to-[#c9972c]/5 p-6 shadow-sm">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-center gap-6">
          <ReadinessRing percent={data.readinessPercent} colorClass={colors.ring} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0d9488]">
              My IELTS Progress
            </p>
            <h2 className={`mt-1 text-xl font-bold ${colors.text}`}>{data.statusLabel}</h2>
            <p className="mt-2 text-sm text-slate-600">{data.nextAction}</p>
            {data.currentBand != null && data.targetBand != null ? (
              <p className="mt-1 text-xs text-slate-500">
                Band {data.currentBand.toFixed(1)} → {data.targetBand.toFixed(1)}
                {data.bandGap > 0 ? ` (${data.bandGap.toFixed(1)} to go)` : ""}
              </p>
            ) : null}
            {projected && data.bandGap > 0 ? (
              <p className="mt-2 text-xs font-medium text-[#0d9488]">
                Projected target date: {projected.projectedDateLabel}
                {projected.weeksRemaining > 0
                  ? ` · ~${projected.weeksRemaining} week${projected.weeksRemaining === 1 ? "" : "s"}`
                  : ""}
              </p>
            ) : null}
            {data.enrolledLevel ? (
              <p className="mt-1 text-xs font-medium text-[#c9972c]">
                Course: {data.enrolledLevel}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex-1 space-y-3 lg:max-w-md">
          <div className="grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-5">
            <div className={`rounded-lg px-2 py-2 ${colors.bg}`}>
              <div className="font-bold text-[#0d1b35]">{data.courseProgressPercent}%</div>
              <div className="text-slate-500">Course</div>
            </div>
            <div className={`rounded-lg px-2 py-2 ${colors.bg}`}>
              <div className="font-bold text-[#0d1b35]">{data.hoursStudied}h</div>
              <div className="text-slate-500">Studied</div>
            </div>
            <div className={`rounded-lg px-2 py-2 ${colors.bg}`}>
              <div className="font-bold text-[#0d1b35]">{data.weeklyStudyDays}/7</div>
              <div className="text-slate-500">This week</div>
            </div>
            <div className={`rounded-lg px-2 py-2 ${colors.bg}`}>
              <div className="font-bold text-[#0d1b35]">
                {data.skills.filter((s) => s.band != null).length}/6
              </div>
              <div className="text-slate-500">Skills</div>
            </div>
            <div className={`rounded-lg px-2 py-2 ${colors.bg}`}>
              <div className="font-bold text-[#0d1b35]">{data.activityScore}%</div>
              <div className="text-slate-500">Activity</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {data.skills.map((skill) => (
              <div key={skill.skill}>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-600">{skill.label}</span>
                  <span className="font-semibold text-[#0d1b35]">
                    {skill.band != null ? skill.band.toFixed(1) : "—"}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#c9972c]"
                    style={{ width: `${skill.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {rec?.focusSkills?.length ? (
            <div className="rounded-lg border border-slate-100 bg-white/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                Recommended focus
              </p>
              <ul className="mt-2 space-y-1">
                {rec.focusSkills.slice(0, 2).map((s) => (
                  <li key={s.skill}>
                    <Link href={s.href} className="text-xs font-medium text-[#0d9488] hover:underline">
                      {s.label} →
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/student/pathway"
              className="text-xs font-semibold text-[#0d9488] hover:underline"
            >
              My pathway →
            </Link>
            <Link
              href="/dashboard/student/study-plan"
              className="text-xs font-semibold text-[#c9972c] hover:underline"
            >
              My study plan →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
