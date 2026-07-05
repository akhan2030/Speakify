"use client";

import Link from "next/link";
import type { AcceleratorTrackId } from "@/lib/accelerator/tracks";
import type { AcceleratorSectionId } from "@/lib/accelerator/practiceMeta";
import type { LearningJourney } from "@/lib/accelerator/learningJourney";
import { readinessBarColor } from "@/lib/accelerator/learningJourney";
import { FULL_MOCK_MINUTES } from "@/lib/accelerator/practiceMeta";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

function ProgressBar({
  percent,
  color,
  className = "h-2.5",
}: {
  percent: number;
  color?: string;
  className?: string;
}) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-slate-200 ${className}`}>
      <div
        className="h-full rounded-full transition-all"
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
          backgroundColor: color ?? readinessBarColor(percent),
        }}
      />
    </div>
  );
}

function StepIcon({ status }: { status: "completed" | "current" | "locked" }) {
  if (status === "completed") return <span style={{ color: TEAL }}>✓</span>;
  if (status === "current") return <span style={{ color: GOLD }}>→</span>;
  return <span className="text-slate-300">○</span>;
}

type StartOpts = {
  testType: "full_mock" | "section_practice";
  section?: AcceleratorSectionId;
  testId?: string | null;
  /** Unique key so only one button shows loading */
  sourceKey?: string;
};

type Props = {
  track: AcceleratorTrackId;
  journey: LearningJourney;
  fullMock: {
    testId: string | null;
    topic: string | null;
    hasFresh: boolean;
    previous: { bandScore: number | null } | null;
  };
  onStart: (opts: StartOpts) => void;
  fetching: string | null;
  generating: boolean;
};

export default function LearningJourneyHub({
  track,
  journey,
  fullMock,
  onStart,
  fetching,
  generating,
}: Props) {
  const { nextActivity, continueActivity } = journey;

  return (
    <div className="space-y-8">
      {/* Hero — readiness + continue */}
      <section
        className="rounded-2xl p-6 sm:p-8"
        style={{ backgroundColor: NAVY }}
      >
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
              {journey.trackTitle}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">
              Target Band: {journey.targetBandLabel}
            </h1>
            <p className="mt-4 text-sm text-slate-300">
              Overall Readiness:{" "}
              <strong className="text-white">{journey.overallReadiness}%</strong>
            </p>
            <div className="mt-2 max-w-md">
              <ProgressBar percent={journey.overallReadiness} color={GOLD} className="h-3" />
            </div>
            <p className="mt-4 text-sm text-slate-300">
              Next recommended:{" "}
              <strong className="text-white">{nextActivity.label}</strong>
              <span className="text-slate-400"> · ~{nextActivity.estimatedMinutes} min</span>
            </p>
            <p className="mt-1 text-xs text-slate-500">{nextActivity.reason}</p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-xs text-slate-400">Level {journey.gamification.level}</p>
            <p className="text-lg font-bold" style={{ color: GOLD }}>
              {journey.gamification.xp} XP
            </p>
            <p className="mt-1 text-[10px] text-slate-500">
              Next badge: {journey.gamification.nextBadge}
            </p>
            <ProgressBar
              percent={journey.gamification.xpProgressPercent}
              color={TEAL}
              className="mt-2 h-1.5 w-32"
            />
          </div>
        </div>

        <button
          type="button"
          disabled={fetching !== null}
          onClick={() =>
            onStart({
              testType: nextActivity.testType,
              section: nextActivity.section,
              testId: nextActivity.testId,
              sourceKey: "continue-learning",
            })
          }
          className="mt-6 w-full rounded-xl px-6 py-3.5 text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
          style={{ backgroundColor: GOLD, color: NAVY }}
        >
          {fetching === "continue-learning" ? "Loading…" : "Continue Learning →"}
        </button>
      </section>

      {/* Continue where you left off */}
      {continueActivity ? (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Last activity
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-bold" style={{ color: NAVY }}>
                {continueActivity.label}
              </p>
              {continueActivity.scorePercent != null ? (
                <p className="mt-1 text-sm text-slate-600">
                  Score:{" "}
                  <strong style={{ color: GOLD }}>{continueActivity.scorePercent}%</strong>
                </p>
              ) : null}
            </div>
            <button
              type="button"
              disabled={fetching !== null}
              onClick={() =>
                onStart({
                  testType: continueActivity.testType,
                  section: continueActivity.section,
                  testId: continueActivity.testId,
                  sourceKey: "continue-last",
                })
              }
              className="rounded-lg px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
              style={{ backgroundColor: TEAL }}
            >
              {fetching === "continue-last" ? "Loading…" : "Continue →"}
            </button>
          </div>
        </section>
      ) : null}

      {/* Daily 15-min + Weekly plan */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold" style={{ color: NAVY }}>
            Today&apos;s 15-Minute Practice
          </h2>
          <ul className="mt-4 space-y-2">
            {journey.dailyPractice.items.map((item) => (
              <li key={item.label} className="flex justify-between text-sm text-slate-600">
                <span>{item.label}</span>
                <span>{item.minutes} min</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={fetching !== null}
            onClick={() =>
              onStart({
                testType: "section_practice",
                section: "listening",
                testId: null,
                sourceKey: "daily-practice",
              })
            }
            className="mt-4 text-sm font-bold hover:underline disabled:opacity-60"
            style={{ color: TEAL }}
          >
            {fetching === "daily-practice" ? "Loading…" : "Start daily practice →"}
          </button>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-bold" style={{ color: NAVY }}>
              This Week&apos;s Plan
            </h2>
            <span className="text-sm font-semibold" style={{ color: TEAL }}>
              {journey.weeklyCompleted}/{journey.weeklyPlan.length} completed
            </span>
          </div>
          <ul className="mt-4 space-y-2">
            {journey.weeklyPlan.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-sm">
                <span style={{ color: item.completed ? TEAL : "#cbd5e1" }}>
                  {item.completed ? "☑" : "☐"}
                </span>
                <span className={item.completed ? "text-slate-400 line-through" : "text-slate-700"}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Learning path */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="font-bold" style={{ color: NAVY }}>
          {journey.trackTitle} Journey
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Follow the path — unlock steps as you complete practice
        </p>
        <ol className="mt-5 space-y-2">
          {journey.journeySteps.map((step, i) => (
            <li
              key={step.id}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm ${
                step.status === "current" ? "bg-[#c9972c]/10" : ""
              }`}
            >
              <span className="w-6 shrink-0 text-center font-bold text-slate-400">{i + 1}</span>
              <StepIcon status={step.status} />
              <span
                className={
                  step.status === "locked"
                    ? "text-slate-400"
                    : step.status === "current"
                      ? "font-semibold text-[#0d1b35]"
                      : "text-slate-700"
                }
              >
                {step.title}
              </span>
              {step.status === "current" && step.section ? (
                <button
                  type="button"
                  disabled={fetching !== null}
                  onClick={() =>
                    onStart({
                      testType: "section_practice",
                      section: step.section!,
                      testId: null,
                      sourceKey: `journey-step:${step.id}`,
                    })
                  }
                  className="ml-auto text-xs font-bold disabled:opacity-60"
                  style={{ color: GOLD }}
                >
                  {fetching === `journey-step:${step.id}` ? "Loading…" : "Start →"}
                </button>
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      {/* Skill readiness + micro-skills */}
      <section>
        <h2 className="mb-4 font-bold" style={{ color: NAVY }}>
          IELTS Exam Readiness
        </h2>
        <p className="mb-4 text-sm text-slate-500">
          To complete {journey.graduationLabel}: reach {journey.graduationTarget}% readiness
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {journey.skillReadiness.map((skill) => (
            <div
              key={skill.section}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold" style={{ color: NAVY }}>
                  {skill.label}
                </h3>
                <span className="text-lg font-bold" style={{ color: readinessBarColor(skill.readinessPercent) }}>
                  {skill.readinessPercent}%
                </span>
              </div>
              <ProgressBar percent={skill.readinessPercent} className="mt-3" />
              {skill.lastScore != null ? (
                <p className="mt-2 text-xs text-slate-500">
                  Last score: {skill.lastScore}%
                  {skill.lastBand != null ? ` · Band ${skill.lastBand.toFixed(1)}` : ""}
                </p>
              ) : (
                <p className="mt-2 text-xs text-slate-400">Complete practice to unlock score</p>
              )}

              <ul className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                {journey.microSkills[skill.section].map((ms) => (
                  <li key={ms.id} className="flex items-center gap-2 text-xs text-slate-600">
                    <StepIcon status={ms.status} />
                    <span className={ms.status === "locked" ? "text-slate-400" : ""}>{ms.label}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                disabled={fetching !== null}
                onClick={() =>
                  onStart({
                    testType: "section_practice",
                    section: skill.section,
                    testId: null,
                    sourceKey: skill.section,
                  })
                }
                className="mt-4 text-sm font-bold hover:underline disabled:opacity-60"
                style={{ color: GOLD }}
              >
                {fetching === skill.section ? "Loading…" : `Practice ${skill.label} →`}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Full mock */}
      <section className="rounded-2xl border-2 p-6" style={{ borderColor: `${GOLD}66` }}>
        <h2 className="text-lg font-bold" style={{ color: NAVY }}>
          Full IELTS Mock Test
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          All 4 sections · ~{Math.floor(FULL_MOCK_MINUTES / 60)}h {FULL_MOCK_MINUTES % 60}m
        </p>
        {fullMock.topic ? (
          <p className="mt-2 text-sm" style={{ color: TEAL }}>
            Topic: {fullMock.topic}
          </p>
        ) : null}
        {fullMock.previous?.bandScore != null ? (
          <p className="mt-2 text-sm">
            Previous: Band{" "}
            <strong style={{ color: GOLD }}>{Number(fullMock.previous.bandScore).toFixed(1)}</strong>
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={fetching !== null}
            onClick={() =>
              onStart({
                testType: "full_mock",
                testId: fullMock.testId,
                sourceKey: "full_mock",
              })
            }
            className="rounded-xl px-6 py-3 text-sm font-bold text-[#0d1b35] disabled:opacity-60"
            style={{ backgroundColor: GOLD }}
          >
            {fetching === "full_mock"
              ? "Loading…"
              : fullMock.testId
                ? "Start Full Mock"
                : "Start Timed Mock Exam"}
          </button>
          <Link
            href="/dashboard/ielts/student/mock-exam"
            className="rounded-xl border px-6 py-3 text-sm font-semibold hover:bg-slate-50"
            style={{ borderColor: TEAL, color: TEAL }}
          >
            Timed mock exams →
          </Link>
        </div>
      </section>
    </div>
  );
}
