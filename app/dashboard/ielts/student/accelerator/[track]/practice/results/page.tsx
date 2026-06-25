"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PageSpinner } from "@/components/StudentSidebar";
import {
  ACCELERATOR_TRACKS,
  isValidTrack,
  type AcceleratorTrackId,
} from "@/lib/accelerator/tracks";
import {
  SECTION_META_BY_TRACK,
  TARGET_BAND_LABEL,
  type AcceleratorSectionId,
} from "@/lib/accelerator/practiceMeta";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

type ResultPayload = {
  bandScore?: number;
  score?: number | null;
  totalQuestions?: number | null;
  accuracy?: number | null;
  weakAreas?: string[];
  modelAnswers?: unknown;
  sectionResults?: Record<string, { band: number; feedback?: unknown }>;
  improvementPlan?: { week: number; focus: string; tasks: string[] }[];
  section?: string;
  testType?: string;
};

function ModelAnswersBlock({ data }: { data: unknown }) {
  if (!data) return null;
  return (
    <details className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <summary className="cursor-pointer text-sm font-bold" style={{ color: NAVY }}>
        View model answers
      </summary>
      <pre className="mt-3 max-h-80 overflow-auto text-xs text-slate-700">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

export default function AcceleratorPracticeResultsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const trackParam = String(params.track ?? "");
  const track = isValidTrack(trackParam) ? trackParam : null;
  const testId = searchParams.get("testId") ?? "";
  const testType = searchParams.get("type") ?? "section_practice";
  const section = (searchParams.get("section") ?? "") as AcceleratorSectionId;

  const [result, setResult] = useState<ResultPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const key =
      testType === "full_mock"
        ? `accelerator_result_${testId}`
        : `accelerator_result_${testId}_${section}`;
    const raw = sessionStorage.getItem(key);
    if (raw) {
      try {
        setResult(JSON.parse(raw));
      } catch {
        setResult(null);
      }
    }
    setLoading(false);
  }, [testId, testType, section]);

  if (!track) {
    return <main className="p-6">Invalid track.</main>;
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  if (!result) {
    return (
      <main className="p-6">
        <p className="text-slate-600">Results not found. Complete a practice session first.</p>
        <Link
          href={`/dashboard/ielts/student/accelerator/${track}/practice`}
          className="mt-4 inline-block font-semibold"
          style={{ color: GOLD }}
        >
          ← Back to Practice
        </Link>
      </main>
    );
  }

  const meta = ACCELERATOR_TRACKS[track];
  const isFullMock = testType === "full_mock";
  const sectionMeta = section ? SECTION_META_BY_TRACK[track].find((s) => s.id === section) : null;
  const nextSectionIndex = section
    ? SECTION_META_BY_TRACK[track].findIndex((s) => s.id === section) + 1
    : -1;
  const nextSection =
    nextSectionIndex >= 0 && nextSectionIndex < 4
      ? SECTION_META_BY_TRACK[track][nextSectionIndex]
      : null;

  return (
    <main className="min-h-screen flex-1 bg-[#f8f9fa] p-6">
      <Link
        href={`/dashboard/ielts/student/accelerator/${track}/practice`}
        className="text-sm font-semibold hover:underline"
        style={{ color: TEAL }}
      >
        ← Practice hub
      </Link>

      <header
        className="mt-4 rounded-2xl p-8 text-white shadow-lg"
        style={{ backgroundColor: NAVY }}
      >
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: GOLD }}>
          {isFullMock ? "Full Mock Report" : `${sectionMeta?.name ?? section} Practice`}
        </p>
        <p className="mt-2 text-4xl font-extrabold">
          {result.bandScore != null ? Number(result.bandScore).toFixed(1) : "—"}
        </p>
        <p className="mt-1 text-sm text-slate-300">
          Predicted band · {meta.name} track (target {TARGET_BAND_LABEL[track as AcceleratorTrackId]})
        </p>
        {!isFullMock && result.accuracy != null ? (
          <p className="mt-3 text-sm" style={{ color: TEAL }}>
            Accuracy: {Math.round(Number(result.accuracy) * 100)}%
            {result.score != null && result.totalQuestions
              ? ` (${result.score}/${result.totalQuestions} correct)`
              : ""}
          </p>
        ) : null}
      </header>

      {isFullMock && result.sectionResults ? (
        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(result.sectionResults).map(([skill, data]) => (
            <div
              key={skill}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-xs uppercase text-slate-500">{skill}</p>
              <p className="text-2xl font-bold" style={{ color: GOLD }}>
                {Number(data.band).toFixed(1)}
              </p>
            </div>
          ))}
        </section>
      ) : null}

      {result.weakAreas && result.weakAreas.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold" style={{ color: NAVY }}>
            Weak areas to focus on
          </h2>
          <ul className="mt-3 space-y-2">
            {result.weakAreas.map((area) => (
              <li key={area} className="flex gap-2 text-sm text-slate-700">
                <span style={{ color: TEAL }}>•</span>
                {area}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <ModelAnswersBlock data={result.modelAnswers} />

      {isFullMock && result.improvementPlan ? (
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold" style={{ color: NAVY }}>
            Improvement plan — next 2 weeks
          </h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {result.improvementPlan.map((week) => (
              <div
                key={week.week}
                className="rounded-xl border border-slate-100 bg-slate-50 p-4"
              >
                <p className="text-xs font-bold uppercase" style={{ color: TEAL }}>
                  Week {week.week}
                </p>
                <p className="mt-1 font-semibold" style={{ color: NAVY }}>
                  {week.focus}
                </p>
                <ul className="mt-2 space-y-1">
                  {week.tasks.map((t) => (
                    <li key={t} className="text-xs text-slate-600">
                      • {t}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-3">
        {!isFullMock && nextSection ? (
          <Link
            href={`/dashboard/ielts/student/accelerator/${track}/practice/session?type=section_practice&section=${nextSection.id}`}
            className="rounded-xl px-5 py-2.5 text-sm font-bold text-[#0d1b35]"
            style={{ backgroundColor: GOLD }}
            onClick={(e) => {
              e.preventDefault();
              window.location.href = `/dashboard/ielts/student/accelerator/${track}/practice`;
            }}
          >
            Continue to {nextSection.name} →
          </Link>
        ) : null}
        <Link
          href={`/dashboard/ielts/student/accelerator/${track}/practice`}
          className="rounded-xl border border-[#c9972c] px-5 py-2.5 text-sm font-semibold"
          style={{ color: GOLD }}
        >
          {isFullMock ? "Back to practice hub" : "Try another section"}
        </Link>
      </div>
    </main>
  );
}
