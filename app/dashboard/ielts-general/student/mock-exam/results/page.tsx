"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GENERAL_STUDENT_BASE } from "@/lib/ielts-general/paths";
import { computeOverallBand } from "@/lib/mock-test/scoring";

type StoredPayload = {
  answers?: Record<string, string>;
  sectionScores?: {
    listening?: { band?: number; correct?: number; total?: number };
    reading?: {
      band?: number;
      correct?: number;
      total?: number;
      passageBreakdown?: Array<{
        label: string;
        correct: number;
        total: number;
        band: number;
      }>;
    };
  };
  overallBand?: number;
  mockNumber?: number;
  readingSectionBreakdown?: Record<
    string,
    { correct: number; total: number; band: number }
  >;
  writingMeta?: {
    letterType?: string;
    letterPrompt?: string;
    essayPrompt?: string;
    task1Id?: string;
    task2Id?: string;
  };
};

type WritingBands = {
  task1?: number | null;
  task2?: number | null;
  evaluating: boolean;
  error?: string | null;
};

function ResultsInner() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId") ?? "";
  const [payload, setPayload] = useState<StoredPayload | null>(null);
  const [writingBands, setWritingBands] = useState<WritingBands>({
    evaluating: false,
  });

  useEffect(() => {
    if (!attemptId) return;
    try {
      const raw = sessionStorage.getItem(`mock_test_${attemptId}`);
      if (raw) setPayload(JSON.parse(raw));
    } catch {
      setPayload(null);
    }
  }, [attemptId]);

  useEffect(() => {
    if (!payload?.answers || !payload.writingMeta) return;

    const task1Id = payload.writingMeta.task1Id ?? "gt-write-task1";
    const task2Id = payload.writingMeta.task2Id ?? "gt-write-task2";
    const letterText = String(payload.answers[task1Id] ?? "").trim();
    const essayText = String(payload.answers[task2Id] ?? "").trim();

    if (!letterText && !essayText) return;

    let cancelled = false;
    setWritingBands({ evaluating: true });

    (async () => {
      const bands: { task1?: number | null; task2?: number | null } = {};

      try {
        if (letterText) {
          const res = await fetch("/api/ielts-general/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskType: "task1",
              essay: letterText,
              letterType: payload.writingMeta?.letterType,
              questionPrompt: payload.writingMeta?.letterPrompt,
            }),
          });
          const data = await res.json();
          if (data.success && data.bands?.overall != null) {
            bands.task1 = Number(data.bands.overall);
          }
        }

        if (essayText && !cancelled) {
          const res = await fetch("/api/ielts-general/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              taskType: "task2",
              essay: essayText,
              questionPrompt: payload.writingMeta?.essayPrompt,
            }),
          });
          const data = await res.json();
          if (data.success && data.bands?.overall != null) {
            bands.task2 = Number(data.bands.overall);
          }
        }

        if (!cancelled) {
          setWritingBands({ evaluating: false, ...bands });
        }
      } catch {
        if (!cancelled) {
          setWritingBands({
            evaluating: false,
            error: "Writing evaluation could not be completed.",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [payload]);

  const listening = payload?.sectionScores?.listening;
  const reading = payload?.sectionScores?.reading;
  const readingSections = payload?.readingSectionBreakdown;

  const fourSkillBand = computeOverallBand({
    listening: listening?.band,
    reading: reading?.band,
    writing:
      writingBands.task1 != null && writingBands.task2 != null
        ? (writingBands.task1 + writingBands.task2) / 2
        : writingBands.task1 ?? writingBands.task2 ?? undefined,
  });

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-xl border border-[#0d1b35] bg-[#0d1b35] p-6 text-white">
          <h1 className="text-2xl font-bold">GT mock complete</h1>
          <p className="mt-2 text-sm text-slate-300">
            Listening & Reading scored automatically. Writing is evaluated with AI when you submit
            responses. Speaking transcripts are saved for review.
          </p>
          {payload?.mockNumber ? (
            <p className="mt-2 text-xs text-slate-400">
              Mock #{String(payload.mockNumber).padStart(2, "0")}
            </p>
          ) : null}
          {payload?.overallBand != null ? (
            <p className="mt-4 text-3xl font-bold text-[#c9972c]">
              L+R estimate: Band {Number(payload.overallBand).toFixed(1)}
            </p>
          ) : null}
          {fourSkillBand != null &&
          !writingBands.evaluating &&
          (writingBands.task1 != null || writingBands.task2 != null) ? (
            <p className="mt-2 text-lg font-semibold text-white">
              With writing: Band {fourSkillBand.toFixed(1)}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-500">Listening</p>
            <p className="mt-1 text-2xl font-bold text-[#0d1b35]">
              {listening?.band != null ? `Band ${listening.band.toFixed(1)}` : "—"}
            </p>
            {listening?.correct != null ? (
              <p className="text-sm text-slate-500">
                {listening.correct}/{listening.total} correct
              </p>
            ) : null}
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-500">GT Reading</p>
            <p className="mt-1 text-2xl font-bold text-[#0d1b35]">
              {reading?.band != null ? `Band ${reading.band.toFixed(1)}` : "—"}
            </p>
            {reading?.correct != null ? (
              <p className="text-sm text-slate-500">
                {reading.correct}/{reading.total} correct
              </p>
            ) : null}
          </div>
        </div>

        {readingSections ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase text-slate-500">Reading by section</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(["A", "B", "C"] as const).map((sec) => {
                const row = readingSections[sec];
                if (!row?.total) return null;
                return (
                  <div key={sec} className="rounded-lg bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-600">Section {sec}</p>
                    <p className="text-lg font-bold text-[#0d1b35]">
                      Band {Number(row.band).toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {row.correct}/{row.total} correct
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase text-slate-500">Writing (AI)</p>
          {writingBands.evaluating ? (
            <p className="mt-2 text-sm text-slate-600">Evaluating your letter and essay…</p>
          ) : writingBands.error ? (
            <p className="mt-2 text-sm text-amber-700">{writingBands.error}</p>
          ) : (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold text-slate-700">Task 1 — Letter</p>
                <p className="text-xl font-bold text-[#0d1b35]">
                  {writingBands.task1 != null
                    ? `Band ${writingBands.task1.toFixed(1)}`
                    : "Not submitted"}
                </p>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">Task 2 — Essay</p>
                <p className="text-xl font-bold text-[#0d1b35]">
                  {writingBands.task2 != null
                    ? `Band ${writingBands.task2.toFixed(1)}`
                    : "Not submitted"}
                </p>
              </div>
            </div>
          )}
          {payload?.writingMeta?.letterType ? (
            <p className="mt-3 text-xs text-slate-500">
              Letter type:{" "}
              <strong>{payload.writingMeta.letterType.replace(/_/g, " ")}</strong>
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`${GENERAL_STUDENT_BASE}/mock-exam`}
            className="rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35]"
          >
            Take another mock
          </Link>
          <Link
            href={`${GENERAL_STUDENT_BASE}/progress?tab=readiness`}
            className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-[#0d1b35]"
          >
            My Progress →
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function GtMockExamResultsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading results…</div>}>
      <ResultsInner />
    </Suspense>
  );
}
