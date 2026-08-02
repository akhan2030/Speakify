"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import { GENERAL_STUDENT_BASE } from "@/lib/ielts-general/paths";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

/** Sellable distinct GT mocks only — not the old 6-slot recycle set. */
export const GT_SELLABLE_MOCK_NUMBERS = [1, 2, 3] as const;

const CHECKLIST = [
  "Listening — 4 sections, 40 questions (30 min)",
  "Reading — GT Sections A, B & C (everyday & workplace texts, 60 min)",
  "Writing — Task 1 LETTER + Task 2 essay (60 min)",
  "Speaking — Parts 1, 2 & 3 (~15–20 min)",
];

const MOCK_BLURBS: Record<number, string> = {
  1: "Full timed General Training paper — letter Task 1, GT Reading Sections A–C.",
  2: "Second full timed GT paper with a different Section C and new writing prompts.",
  3: "Third full timed GT sitting — new Listening, Speaking & writing; Reading reuses the bank.",
};

export default function GtMockExamLobbyPage() {
  const router = useRouter();
  const { status } = useSession();
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [mockNumber, setMockNumber] = useState(1);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  async function startMock(n: number = mockNumber) {
    setStarting(true);
    setStartError(null);
    try {
      const res = await fetch("/api/mock-test/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mockNumber: n,
          examVariant: "general",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to start mock exam");
      }

      const attemptId = data.attemptId ?? `local_${crypto.randomUUID()}`;

      sessionStorage.setItem("mock_test_attempt_id", String(attemptId));
      sessionStorage.setItem("mock_test_number", String(n));
      sessionStorage.setItem("speakify_programme", "ielts_general");
      router.push(
        `${GENERAL_STUDENT_BASE}/mock-exam/exam?mock=${n}&attemptId=${encodeURIComponent(attemptId)}`
      );
    } catch (err) {
      setStartError(err instanceof Error ? err.message : "Could not start mock exam");
      setStarting(false);
    }
  }

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: TEAL }}>
          IELTS General Training
        </p>
        <h1 className="mt-1 text-3xl font-bold" style={{ color: NAVY }}>
          Full GT mock exams
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Three full timed General Training mocks — letter for Writing Task 1 (not a
          graph), GT Reading Sections A, B &amp; C, plus Listening and Speaking.
        </p>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold" style={{ color: NAVY }}>
            What&apos;s in every GT mock
          </h2>
          <ul className="mt-4 space-y-2">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-slate-700">
                <span style={{ color: GOLD }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            Allow ~3 hours uninterrupted. These are General Training papers — not
            Academic graph / long-passage Academic Reading mocks.
          </p>
        </div>

        {startError ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {startError}
          </p>
        ) : null}

        <div className="mt-6 space-y-4">
          {GT_SELLABLE_MOCK_NUMBERS.map((n) => {
            const selected = mockNumber === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => setMockNumber(n)}
                className="w-full rounded-2xl border-2 p-5 text-left transition"
                style={{
                  borderColor: selected ? GOLD : "#e2e8f0",
                  backgroundColor: selected ? NAVY : "#ffffff",
                }}
              >
                <span
                  className="inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                  style={{
                    backgroundColor: selected ? GOLD : `${TEAL}20`,
                    color: selected ? NAVY : TEAL,
                  }}
                >
                  Mock Exam #{String(n).padStart(2, "0")}
                </span>
                <h2
                  className="mt-3 text-lg font-bold"
                  style={{ color: selected ? "#ffffff" : NAVY }}
                >
                  Full IELTS General Training Mock Exam
                </h2>
                <p
                  className="mt-1 text-sm"
                  style={{ color: selected ? "#cbd5e1" : "#64748b" }}
                >
                  {MOCK_BLURBS[n]}
                </p>
                {selected ? (
                  <ul className="mt-4 space-y-1.5 text-sm text-slate-200">
                    {CHECKLIST.map((item) => (
                      <li key={item} className="flex gap-2">
                        <span style={{ color: TEAL }}>✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={starting}
          onClick={() => startMock(mockNumber)}
          className="mt-6 w-full rounded-xl px-8 py-3 text-sm font-bold disabled:opacity-60 sm:w-auto"
          style={{ backgroundColor: GOLD, color: NAVY }}
        >
          {starting
            ? "Starting…"
            : `Start GT Mock #${String(mockNumber).padStart(2, "0")} →`}
        </button>

        <Link
          href={GENERAL_STUDENT_BASE}
          className="mt-6 inline-block text-sm font-semibold hover:underline"
          style={{ color: TEAL }}
        >
          ← Back to dashboard
        </Link>
      </div>
    </main>
  );
}
