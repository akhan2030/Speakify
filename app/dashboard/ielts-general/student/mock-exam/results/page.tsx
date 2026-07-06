"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { GENERAL_STUDENT_BASE } from "@/lib/ielts-general/paths";

type StoredPayload = {
  sectionScores?: {
    listening?: { band?: number; correct?: number; total?: number };
    reading?: { band?: number; correct?: number; total?: number };
  };
  overallBand?: number;
  writingMeta?: { letterType?: string };
};

function ResultsInner() {
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId") ?? "";
  const [payload, setPayload] = useState<StoredPayload | null>(null);

  useEffect(() => {
    if (!attemptId) return;
    try {
      const raw = sessionStorage.getItem(`mock_test_${attemptId}`);
      if (raw) setPayload(JSON.parse(raw));
    } catch {
      setPayload(null);
    }
  }, [attemptId]);

  const listening = payload?.sectionScores?.listening;
  const reading = payload?.sectionScores?.reading;

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-xl border border-[#0d1b35] bg-[#0d1b35] p-6 text-white">
          <h1 className="text-2xl font-bold">GT mock complete</h1>
          <p className="mt-2 text-sm text-slate-300">
            Listening & Reading scored automatically. Writing and Speaking responses are saved for
            review — full AI band scoring can be added in a later pass.
          </p>
          {payload?.overallBand != null ? (
            <p className="mt-4 text-3xl font-bold text-[#c9972c]">
              Estimated overall (L+R): Band {Number(payload.overallBand).toFixed(1)}
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

        {payload?.writingMeta?.letterType ? (
          <p className="text-sm text-slate-600">
            Writing Task 1 letter type:{" "}
            <strong>{payload.writingMeta.letterType.replace(/_/g, " ")}</strong>
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Link
            href={`${GENERAL_STUDENT_BASE}/mock-exam`}
            className="rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35]"
          >
            Take another mock
          </Link>
          <Link
            href={`${GENERAL_STUDENT_BASE}/readiness`}
            className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-[#0d1b35]"
          >
            View GT readiness →
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
