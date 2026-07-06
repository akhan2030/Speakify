"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import { GENERAL_STUDENT_BASE } from "@/lib/ielts-general/paths";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";

const CHECKLIST = [
  "Listening — 4 sections, 40 questions (30 min)",
  "Reading — GT Sections A, B & C (60 min)",
  "Writing — Task 1 LETTER + Task 2 essay (60 min)",
  "Speaking — Parts 1, 2 & 3 (~15–20 min)",
];

export default function GtMockExamLobbyPage() {
  const router = useRouter();
  const { status } = useSession();
  const [starting, setStarting] = useState(false);
  const [mockNumber, setMockNumber] = useState(1);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  function startMock() {
    setStarting(true);
    const attemptId = `local_${crypto.randomUUID()}`;
    sessionStorage.setItem("mock_test_attempt_id", attemptId);
    sessionStorage.setItem("mock_test_number", String(mockNumber));
    sessionStorage.setItem("speakify_programme", "ielts_general");
    router.push(
      `${GENERAL_STUDENT_BASE}/mock-exam/exam?mock=${mockNumber}&attemptId=${encodeURIComponent(attemptId)}`
    );
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
        <p className="text-xs font-bold uppercase tracking-wide text-[#0d9488]">
          IELTS General Training
        </p>
        <h1 className="mt-1 text-3xl font-bold text-[#0d1b35]">Full mock exam</h1>
        <p className="mt-2 text-sm text-slate-600">
          Same four-skill format as the real GT test — with a <strong>letter</strong> for Writing
          Task 1 (not a graph).
        </p>

        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="font-bold text-[#0d1b35]">What&apos;s included</h2>
          <ul className="mt-4 space-y-2">
            {CHECKLIST.map((item) => (
              <li key={item} className="flex gap-2 text-sm text-slate-700">
                <span className="text-[#c9972c]">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-slate-500">
            Allow ~3 hours uninterrupted. Listening & Speaking use the same engine as Academic;
            Reading uses genuine GT passages.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          <label className="text-sm">
            <span className="mb-1 block font-semibold text-slate-700">Mock number</span>
            <select
              value={mockNumber}
              onChange={(e) => setMockNumber(Number(e.target.value))}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <option key={n} value={n}>
                  Mock #{String(n).padStart(2, "0")}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={starting}
            onClick={startMock}
            className="rounded-xl px-8 py-3 text-sm font-bold text-[#0d1b35] disabled:opacity-60"
            style={{ backgroundColor: GOLD }}
          >
            {starting ? "Starting…" : "Start GT mock exam →"}
          </button>
        </div>

        <Link
          href={GENERAL_STUDENT_BASE}
          className="mt-6 inline-block text-sm font-semibold text-[#0d9488] hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    </main>
  );
}
