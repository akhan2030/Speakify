"use client";

import Link from "next/link";
import { useState } from "react";
import type { PathwayRecommendation } from "@/lib/course/pathwayEngine";
import type { ProjectedAchievement } from "@/lib/course/projectedAchievement";
import type { PersonalizedStudyPlan } from "@/lib/course/studyPlanGenerator";
import type { RecommendationBundle } from "@/lib/course/recommendationEngine";

type Props = {
  pathway: PathwayRecommendation;
  overallBand: number;
  targetBand: number;
  projectedAchievement?: ProjectedAchievement;
  studyPlan?: PersonalizedStudyPlan;
  recommendations?: RecommendationBundle;
  onEnrolled?: (levelName: string) => void;
};

export default function PathwayRecommendationPanel({
  pathway,
  overallBand,
  targetBand,
  projectedAchievement,
  studyPlan,
  recommendations,
  onEnrolled,
}: Props) {
  const [enrolling, setEnrolling] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEnroll = async () => {
    setEnrolling(true);
    setError(null);
    try {
      const res = await fetch("/api/course/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelSlug: pathway.levelSlug,
          overallBand,
          targetBand,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not enroll. Try again.");
        return;
      }
      setEnrolled(true);
      onEnrolled?.(data.levelName ?? pathway.levelName);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <section className="mt-10 space-y-8">
      <div className="overflow-hidden rounded-2xl border-2 border-[#0d9488]/40 bg-gradient-to-br from-[#0d9488]/10 to-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#0d9488]">
          Your recommended pathway
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#0d1b35]">{pathway.levelName}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {pathway.levelDescription}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-[#0d1b35] px-3 py-1 text-xs font-bold text-white">
            {pathway.trackCode} · {pathway.trackWeekCount} weeks
          </span>
          <span className="rounded-full bg-[#0d9488]/20 px-3 py-1 text-xs font-bold text-[#0d9488]">
            CEFR {pathway.cefrCode}
          </span>
          <span className="rounded-full bg-[#c9972c]/20 px-3 py-1 text-xs font-bold text-[#0d1b35]">
            {pathway.programName}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            Timeline: {pathway.estimatedTimeline}
          </span>
        </div>

        {!enrolled ? (
          <button
            type="button"
            onClick={handleEnroll}
            disabled={enrolling}
            className="mt-6 w-full rounded-xl bg-[#0d9488] px-6 py-4 text-center text-base font-bold text-white hover:opacity-95 disabled:opacity-60 sm:w-auto"
          >
            {enrolling ? "Enrolling…" : `${pathway.enrollmentCta} →`}
          </button>
        ) : (
          <div className="mt-6 rounded-xl border border-[#0d9488]/40 bg-white px-5 py-4">
            <p className="font-semibold text-[#0d9488]">
              ✓ Enrolled in {pathway.levelName}
            </p>
            <Link
              href="/dashboard/student/course"
              className="mt-3 inline-block rounded-xl bg-[#c9972c] px-5 py-2.5 text-sm font-bold text-[#0d1b35] hover:opacity-95"
            >
              Go to My Course →
            </Link>
            <Link
              href={pathway.courseHref}
              className="mt-3 ml-0 inline-block rounded-xl border-2 border-[#0d9488] px-5 py-2.5 text-sm font-bold text-[#0d9488] hover:bg-[#0d9488]/10 sm:ml-3"
            >
              Open level home →
            </Link>
          </div>
        )}

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        {projectedAchievement && targetBand > overallBand ? (
          <div className="mt-5 rounded-xl border border-[#0d9488]/30 bg-white/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-[#0d9488]">
              Projected achievement date
            </p>
            <p className="mt-1 text-lg font-bold text-[#0d1b35]">
              {projectedAchievement.projectedDateLabel}
            </p>
            <p className="mt-1 text-sm text-slate-600">{projectedAchievement.message}</p>
          </div>
        ) : null}

        {recommendations?.focusSkills?.length ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-white/80 px-4 py-3">
            <p className="text-xs font-semibold uppercase text-slate-500">Priority skills</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {recommendations.focusSkills.slice(0, 3).map((s) => (
                <li key={s.skill}>
                  <strong>{s.label}</strong> — {s.reason}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {!enrolled ? (
          <p className="mt-3 text-xs text-slate-500">
            Sign in required. Guests can register free to save your pathway.
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#0d1b35]">Your personalized learning journey</h3>
        <p className="mt-1 text-sm text-slate-500">
          A step-by-step roadmap based on your placement results
        </p>

        <ol className="relative mt-8 space-y-0 border-l-2 border-[#c9972c]/40 pl-6">
          {pathway.journeySteps.map((step) => (
            <li key={step.order} className="relative pb-8 last:pb-0">
              <span className="absolute -left-[1.6rem] flex h-5 w-5 items-center justify-center rounded-full bg-[#c9972c] text-[10px] font-bold text-[#0d1b35]">
                {step.order}
              </span>
              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#0d9488]">
                      {step.phase}
                    </p>
                    <h4 className="font-bold text-[#0d1b35]">{step.title}</h4>
                  </div>
                  <span className="text-xs font-medium text-slate-500">{step.duration}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{step.description}</p>
                {step.href ? (
                  <Link
                    href={step.href}
                    className="mt-3 inline-block text-xs font-semibold text-[#c9972c] hover:underline"
                  >
                    Open practice →
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-[#0d1b35]">
          {studyPlan ? `${studyPlan.totalWeeks}-week personalized study plan` : "13-week study plan preview"}
        </h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(studyPlan?.weeks ?? pathway.studyPlanWeeks.slice(0, 4)).slice(0, 4).map((week) => (
            <div
              key={week.week}
              className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm"
            >
              <p className="font-semibold text-[#0d1b35]">
                {"focus" in week ? week.focus : (week as { focus: string }).focus}
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-600">
                {("activities" in week && Array.isArray(week.activities)
                  ? week.activities.map((a) => (typeof a === "string" ? a : a.label))
                  : (week as { activities: string[] }).activities
                ).slice(0, 3).map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {studyPlan?.dailyRecommendation ? (
          <p className="mt-4 text-sm font-medium text-[#0d1b35]">{studyPlan.dailyRecommendation}</p>
        ) : null}
        <p className="mt-4 text-xs text-slate-500">
          Full plan unlocks when you enroll in your pathway course.
        </p>
      </div>
    </section>
  );
}
