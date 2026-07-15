"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { MOCK_RESULTS_STORAGE_KEY } from "@/components/listening/ListeningMockExam";
import type {
  ListeningSectionData,
  ListeningSubmitResult,
  SectionScoreEntry,
} from "@/components/listening/types";
import { LISTENING_SECTION_META } from "@/components/listening/types";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import ListeningAnswerReview from "@/components/listening/ListeningAnswerReview";

type StoredMockPayload = {
  result: ListeningSubmitResult;
  sections: Record<number, ListeningSectionData>;
  answers: Record<string, string>;
  elapsedSeconds: number;
  testId?: string;
  sectionScores?: Record<string, SectionScoreEntry>;
  attemptId?: number;
  savedToDb?: boolean;
};

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function ListeningMockResultsContent() {
  const router = useRouter();
  const { status } = useSession();

  const [payload, setPayload] = useState<StoredMockPayload | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(MOCK_RESULTS_STORAGE_KEY);
      if (raw) {
        setPayload(JSON.parse(raw) as StoredMockPayload);
      }
    } catch {
      setPayload(null);
    }
    setReady(true);
  }, []);

  const sectionScores = useMemo(() => {
    if (!payload?.result) return null;
    return (
      payload.sectionScores ??
      payload.result.sectionScores ??
      buildSectionScoresFromResults(payload)
    );
  }, [payload]);

  if (status === "loading" || !ready) {
    return <PageSpinner />;
  }

  if (!payload?.result) {
    return (
      <div className="flex min-h-screen bg-white">
        <StudentSidebar activePage="listening" />
        <main className="ml-[200px] min-h-screen flex-1 bg-slate-50">
          <div className="mx-auto max-w-3xl px-6 py-12 text-center">
            <h1 className="text-2xl font-bold text-[#0d1b35]">
              No results to display
            </h1>
            <p className="mt-2 text-slate-500">
              Complete a full mock test to see your results here.
            </p>
            <Link
              href="/dashboard/student/listening/test"
              className="mt-6 inline-block rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35]"
            >
              Start Mock Test
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { result, sections, elapsedSeconds } = payload;
  const allQuestions = [1, 2, 3, 4].flatMap(
    (n) => sections[n]?.questions ?? []
  );

  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar activePage="listening" />
      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50">
        <div className="mx-auto max-w-3xl px-6 py-8">
          <Link
            href="/dashboard/student/listening"
            className="text-sm font-semibold text-[#0d1b35] hover:text-[#c9972c]"
          >
            ← Back to Listening
          </Link>

          <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">
            Full Mock Test Results
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Time: {formatElapsed(elapsedSeconds)} · Accuracy{" "}
            {Math.round(result.accuracy)}%
            {payload.attemptId ? (
              <span className="ml-2 text-green-600">· Saved to your history</span>
            ) : null}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Overall Score
              </p>
              <p className="mt-2 text-5xl font-extrabold text-[#c9972c]">
                {result.score} / {result.total}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-[#0d1b35]">
                Band Score
              </p>
              <p className="mt-2 text-5xl font-extrabold text-[#0d1b35]">
                {result.band.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="mx-auto mt-4 h-3 max-w-md overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-[#c9972c] transition-[width]"
              style={{
                width: `${Math.round((result.score / result.total) * 100)}%`,
              }}
            />
          </div>

          {sectionScores ? (
            <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#0d1b35]">
                Score by Section
              </h2>
              <ul className="mt-4 space-y-3">
                {[1, 2, 3, 4].map((sectionNum) => {
                  const entry = sectionScores[String(sectionNum)];
                  const meta = LISTENING_SECTION_META[sectionNum];
                  if (!entry) return null;
                  const pct = Math.round((entry.score / entry.total) * 100);
                  const strong = pct >= 70;
                  const weak = pct < 50;
                  return (
                    <li
                      key={sectionNum}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 ${
                        strong
                          ? "border-green-200 bg-green-50"
                          : weak
                            ? "border-red-200 bg-red-50"
                            : "border-amber-200 bg-amber-50"
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-[#0d1b35]">
                          Section {sectionNum}: {meta.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          Q{(sectionNum - 1) * 10 + 1}–{sectionNum * 10} ·{" "}
                          {meta.speakers}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-[#c9972c]">
                          {entry.score} / {entry.total}
                        </p>
                        <p className="text-sm font-semibold text-[#0d1b35]">
                          Band {entry.band.toFixed(1)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <ListeningAnswerReview
            questions={allQuestions}
            results={result.results}
            title="Answer Review (Questions 1–40)"
          />

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/dashboard/student/listening/test"
              className="flex-1 rounded-xl bg-[#c9972c] py-3.5 text-center text-sm font-bold text-[#0d1b35] hover:bg-[#b8862b]"
            >
              Try Another Mock Test
            </Link>
            <Link
              href="/dashboard/student/listening"
              className="flex-1 rounded-xl border-2 border-[#0d1b35] py-3.5 text-center text-sm font-bold text-[#0d1b35] hover:bg-[#0d1b35] hover:text-white"
            >
              Back to Listening
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

function buildSectionScoresFromResults(payload: StoredMockPayload) {
  const scores: Record<string, SectionScoreEntry> = {
    "1": { score: 0, total: 10, band: 3.5 },
    "2": { score: 0, total: 10, band: 3.5 },
    "3": { score: 0, total: 10, band: 3.5 },
    "4": { score: 0, total: 10, band: 3.5 },
  };

  const allQuestions = [1, 2, 3, 4].flatMap(
    (n) => payload.sections[n]?.questions ?? []
  );

  allQuestions.forEach((q, i) => {
    const section = Math.min(
      4,
      Math.max(1, Math.floor((q.questionNumber - 1) / 10) + 1)
    );
    if (payload.result.results[i]?.correct) {
      scores[String(section)].score += 1;
    }
  });

  for (const key of Object.keys(scores)) {
    const s = scores[key].score;
    let band = 3.5;
    const scaled = s * 4;
    if (scaled >= 39) band = 9.0;
    else if (scaled >= 37) band = 8.5;
    else if (scaled >= 35) band = 8.0;
    else if (scaled >= 33) band = 7.5;
    else if (scaled >= 30) band = 7.0;
    else if (scaled >= 27) band = 6.5;
    else if (scaled >= 23) band = 6.0;
    else if (scaled >= 20) band = 5.5;
    else if (scaled >= 16) band = 5.0;
    else if (scaled >= 13) band = 4.5;
    else if (scaled >= 10) band = 4.0;
    scores[key].band = band;
  }

  return scores;
}

export default function ListeningMockTestResultsPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ListeningMockResultsContent />
    </Suspense>
  );
}
