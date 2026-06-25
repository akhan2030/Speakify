"use client";

import Link from "next/link";
import type { SpeakingMockFeedback } from "@/lib/speaking/speakingMockFeedback";

function FeedbackBlock({
  title,
  letter,
  accent,
  children,
}: {
  title: string;
  letter: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
      style={{ borderLeftWidth: 4, borderLeftColor: accent }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ backgroundColor: accent }}
        >
          {letter}
        </span>
        <h3 className="font-bold text-[#0d1b35]">{title}</h3>
      </div>
      <div className="mt-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </div>
  );
}

export default function MockSpeakingFeedback({
  feedback,
  showPracticePlan = true,
}: {
  feedback: SpeakingMockFeedback;
  showPracticePlan?: boolean;
}) {
  return (
    <section className="mt-10">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#c9972c]">
          Examiner feedback
        </p>
        <h2 className="mt-1 text-xl font-bold text-[#0d1b35]">
          Personalized Speaking Feedback
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Based on your mock band scores and official IELTS criteria
        </p>
      </div>

      <div className="grid gap-4">
        <FeedbackBlock title="Overall Feedback" letter="A" accent="#0d1b35">
          <p>{feedback.overallSummary}</p>
        </FeedbackBlock>

        <FeedbackBlock title="Strengths" letter="B" accent="#22c55e">
          <ul className="list-disc space-y-2 pl-5">
            {feedback.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </FeedbackBlock>

        <FeedbackBlock title="Areas to Improve" letter="C" accent="#f59e0b">
          <ul className="list-disc space-y-2 pl-5">
            {feedback.weaknesses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </FeedbackBlock>

        <FeedbackBlock title="Next Target Band" letter="D" accent="#7c3aed">
          <p className="text-base font-semibold text-[#0d1b35]">
            Target: {feedback.nextTarget ?? feedback.targetBand.label}
          </p>
          <p className="mt-2">{feedback.targetBand.guidance}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            {(feedback.improvementPlan ?? feedback.nextImprovements).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </FeedbackBlock>

        {showPracticePlan && (
          <FeedbackBlock title="Recommended Practice Plan" letter="E" accent="#0d9488">
            <div className="space-y-3">
              {feedback.practicePlan.map((item) => (
                <div
                  key={item.title}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="font-semibold text-[#0d1b35]">{item.title}</p>
                  <p className="mt-1 text-slate-600">{item.detail}</p>
                  <Link
                    href={item.href}
                    className="mt-2 inline-block text-xs font-bold text-[#0d9488] hover:underline"
                  >
                    Start practice →
                  </Link>
                </div>
              ))}
            </div>
          </FeedbackBlock>
        )}
      </div>
    </section>
  );
}
