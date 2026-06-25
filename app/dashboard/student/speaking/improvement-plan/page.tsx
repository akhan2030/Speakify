"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import MockSpeakingFeedback from "@/components/speaking/MockSpeakingFeedback";
import {
  loadSpeakingMockFeedback,
  type SpeakingMockFeedback,
} from "@/lib/speaking/speakingMockFeedback";

export default function SpeakingImprovementPlanPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<SpeakingMockFeedback | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setFeedback(loadSpeakingMockFeedback());
    setReady(true);
  }, []);

  const weekPlan = useMemo(() => {
    if (!feedback) return [];
    return [
      {
        day: "Mon & Tue",
        focus: "Weakest criterion",
        action: feedback.weaknesses[0] ?? feedback.nextImprovements[0] ?? "",
        href: "/dashboard/student/speaking/part1",
      },
      {
        day: "Wed & Thu",
        focus: "Extended speaking",
        action:
          "Complete Part 2 cue-card sessions with full 1-minute prep and 2-minute answers.",
        href: "/dashboard/student/speaking/part2",
      },
      {
        day: "Friday",
        focus: "Part 3 depth",
        action:
          "Practise abstract discussion — give opinions, compare ideas, and support with examples.",
        href: "/dashboard/student/speaking/part3",
      },
      {
        day: "Weekend",
        focus: "Full mock review",
        action: `Take a full speaking mock and aim for ${feedback.targetBand.label}.`,
        href: "/dashboard/student/speaking/mock",
      },
    ];
  }, [feedback]);

  if (!ready) return <PageSpinner />;

  if (!feedback) {
    return (
      <div className="flex min-h-screen bg-white">
        <StudentSidebar activePage="speaking" />
        <main className="ml-[200px] flex-1 bg-slate-50 p-8">
          <h1 className="text-2xl font-bold text-[#0d1b35]">
            Speaking Improvement Plan
          </h1>
          <p className="mt-4 text-slate-600">
            Complete a full speaking mock test first to generate your personalized plan.
          </p>
          <Link
            href="/dashboard/student/speaking/mock"
            className="mt-6 inline-block rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35] hover:bg-[#b8862b]"
          >
            Start Full Mock Test →
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar activePage="speaking" />

      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50">
        <div className="mx-auto max-w-4xl px-6 py-8">
          <Link
            href="/dashboard/student/speaking/mock"
            className="text-sm font-semibold text-[#0d1b35] hover:text-[#c9972c]"
          >
            ← Back to Speaking Mock
          </Link>

          <header className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#c9972c]">
              Your improvement roadmap
            </p>
            <h1 className="mt-1 text-[28px] font-bold text-[#0d1b35]">
              Speaking Improvement Plan
            </h1>
            <p className="mt-2 text-slate-500">
              Personalized guidance toward {feedback.targetBand.label}
            </p>
          </header>

          <div className="mt-6 rounded-xl border border-[#c9972c]/30 bg-[#c9972c]/10 p-5">
            <p className="text-sm font-semibold text-[#0d1b35]">
              You are close to your next band milestone.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Follow this weekly plan consistently. Small improvements in your weakest
              criteria will have the biggest impact on your overall speaking band.
            </p>
          </div>

          <MockSpeakingFeedback feedback={feedback} showPracticePlan={false} />

          <section className="mt-10">
            <h2 className="text-lg font-bold text-[#0d1b35]">Weekly practice schedule</h2>
            <p className="mt-1 text-sm text-slate-500">
              A structured plan based on your latest mock results
            </p>
            <div className="mt-6 space-y-4">
              {weekPlan.map((item) => (
                <div
                  key={item.day}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase text-[#0d9488]">
                        {item.day}
                      </p>
                      <p className="mt-1 font-bold text-[#0d1b35]">{item.focus}</p>
                      <p className="mt-2 text-sm text-slate-600">{item.action}</p>
                    </div>
                    <Link
                      href={item.href}
                      className="shrink-0 rounded-lg bg-[#0d9488] px-4 py-2 text-xs font-bold text-white hover:bg-[#0b7c72]"
                    >
                      Practice →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="font-bold text-[#0d1b35]">Recommended practice modules</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {feedback.practicePlan.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4 transition-colors hover:border-[#c9972c] hover:bg-white"
                >
                  <p className="font-semibold text-[#0d1b35]">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
                </Link>
              ))}
            </div>
          </section>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/student/speaking/mock"
              className="flex-1 rounded-xl bg-[#c9972c] py-3 text-center text-sm font-bold text-[#0d1b35] hover:bg-[#b8862b]"
            >
              Take Another Mock
            </Link>
            <button
              type="button"
              onClick={() => router.push("/dashboard/student/speaking")}
              className="flex-1 rounded-xl border border-[#0d1b35] py-3 text-sm font-bold text-[#0d1b35] hover:bg-[#0d1b35] hover:text-white"
            >
              Back to Speaking Hub
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
