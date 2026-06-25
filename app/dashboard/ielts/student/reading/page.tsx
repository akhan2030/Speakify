"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { PageSpinner } from "@/components/StudentSidebar";
import SkillBandHeader from "@/components/ielts/SkillBandHeader";
import SkillTabs from "@/components/ielts/SkillTabs";

const BASE = "/dashboard/ielts/student/reading";

const TABS = [
  { id: "practice", label: "Practice Passages" },
  { id: "timed", label: "Timed Practice" },
  { id: "drills", label: "Question Drills" },
  { id: "strategies", label: "Strategies" },
];

const DRILLS = [
  { slug: "true-false-not-given", label: "T/F/NG", minutes: 15 },
  { slug: "matching-headings", label: "Matching Headings", minutes: 15 },
  { slug: "sentence-completion", label: "Sentence Completion", minutes: 12 },
  { slug: "summary-completion", label: "Summary Completion", minutes: 15 },
  { slug: "short-answer", label: "Short Answer", minutes: 10 },
  { slug: "multiple-choice", label: "MCQ", minutes: 12 },
];

type TrackerRow = {
  question_type: string;
  attempts: number;
  accuracy: number | null;
  estimated_band: number | null;
};

function ReadingContent() {
  const [rows, setRows] = useState<TrackerRow[]>([]);

  useEffect(() => {
    fetch("/api/reading/tracker")
      .then((r) => r.json())
      .then((json) => {
        if (Array.isArray(json?.rows)) setRows(json.rows);
      })
      .catch(() => {});
  }, []);

  return (
    <SkillTabs tabs={TABS} defaultTab="practice">
      {(tab) => {
        if (tab === "practice") {
          return (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-[#0d1b35]">Practice by question type</h3>
              <p className="mt-2 text-sm text-slate-600">
                Each session uses a fresh passage. Focus on one type at a time.
              </p>
              <Link
                href={`${BASE}/practice`}
                className="mt-4 inline-block rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35] hover:opacity-95"
              >
                Choose question type →
              </Link>
            </div>
          );
        }
        if (tab === "timed") {
          return (
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-[#0d1b35]">Full section — 60 minutes</h3>
              <p className="mt-2 text-sm text-slate-600">
                Three passages, 40 questions. Real exam timing — screen locks when
                time is up.
              </p>
              <Link
                href={`${BASE}/test`}
                className="mt-4 inline-block rounded-xl bg-[#0d1b35] px-6 py-3 text-sm font-bold text-white hover:bg-[#152a4d]"
              >
                Start timed section →
              </Link>
            </div>
          );
        }
        if (tab === "drills") {
          return (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {DRILLS.map((d) => {
                const row = rows.find((r) => r.question_type === d.slug);
                return (
                  <Link
                    key={d.slug}
                    href={`${BASE}/practice/${d.slug}`}
                    className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                  >
                    <h3 className="font-bold text-[#0d1b35]">{d.label}</h3>
                    <p className="mt-1 text-xs text-slate-500">~{d.minutes} min</p>
                    {row ? (
                      <p className="mt-2 text-xs text-[#0d9488]">
                        {row.attempts} attempts · Band{" "}
                        {row.estimated_band?.toFixed(1) ?? "—"}
                      </p>
                    ) : (
                      <p className="mt-2 text-xs text-amber-600">Not attempted</p>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        }
        return (
          <div>
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="font-bold text-[#0d1b35]">Strategies library</h3>
              <p className="mt-2 text-sm text-slate-600">
                Skimming, scanning, and question-type techniques for Band 6+.
              </p>
              <Link
                href={`${BASE}/strategies`}
                className="mt-4 inline-block rounded-xl border border-[#0d9488] px-6 py-2.5 text-sm font-bold text-[#0d9488] hover:bg-[#0d9488]/10"
              >
                Open strategies →
              </Link>
            </div>

            {rows.length > 0 ? (
              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="font-bold text-[#0d1b35]">Accuracy by question type</h3>
                <div className="mt-4 space-y-3">
                  {[...rows]
                    .sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))
                    .slice(0, 6)
                    .map((row) => {
                      const pct =
                        row.accuracy != null
                          ? Math.round(
                              (row.accuracy <= 1 ? row.accuracy * 100 : row.accuracy) *
                                10
                            ) / 10
                          : 0;
                      return (
                        <div key={row.question_type}>
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-slate-700">{row.question_type}</span>
                            <span className="text-slate-500">{pct}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-[#c9972c]"
                              style={{ width: `${Math.min(100, pct)}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : null}
          </div>
        );
      }}
    </SkillTabs>
  );
}

export default function IeltsReadingPage() {
  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <SkillBandHeader
        skill="reading"
        title="Reading"
        subtitle="Practice passages, timed sections, and question-type drills"
      />
      <Suspense fallback={<PageSpinner />}>
        <ReadingContent />
      </Suspense>
    </main>
  );
}
