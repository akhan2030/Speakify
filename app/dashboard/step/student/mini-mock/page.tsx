"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";

type MiniRow = {
  mock_number: number;
  completed_at: string;
  total_score: number;
  reading_score: number;
  structure_score: number;
  listening_score: number;
  compositional_score: number;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function MiniMockLandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [mocks, setMocks] = useState<MiniRow[]>([]);
  const [nextNumber, setNextNumber] = useState(1);

  useEffect(() => {
    fetch("/api/step/mini-mock/history")
      .then((r) => r.json())
      .then((json) => {
        setMocks(json.mocks ?? []);
        setNextNumber(json.nextMockNumber ?? 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleStart = async () => {
    if (starting) return;
    setStarting(true);
    try {
      const res = await fetch("/api/step/mini-mock/start", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not start");
      sessionStorage.setItem(
        `step-mini-${json.attemptId}`,
        JSON.stringify({
          attemptId: json.attemptId,
          mockNumber: json.mockNumber,
          questions: json.questions,
        })
      );
      router.push("/dashboard/step/student/mini-mock/exam");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start");
      setStarting(false);
    }
  };

  if (loading) return <PageSpinner />;

  const withImprovement = mocks.map((m, i) => {
    const prev = mocks[i + 1];
    const imp = prev == null ? null : (m.total_score ?? 0) - (prev.total_score ?? 0);
    return { ...m, improvement: imp };
  });

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 pb-24 md:p-8">
      <header>
        <h1 className="text-3xl font-bold" style={{ color: NAVY }}>
          STEP Mini Mock
        </h1>
        <p className="mt-2 text-slate-600">
          20 questions · 25 minutes · All 4 sections · Instant results
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        {["5 Reading questions", "5 Structure questions", "5 Listening questions", "5 Compositional questions"].map(
          (label) => (
            <div key={label} className="rounded-xl border border-slate-200 bg-white p-4 text-center text-sm">
              {label}
            </div>
          )
        )}
      </div>

      <div className="rounded-xl bg-slate-50 p-5 text-sm text-slate-700">
        <p className="font-semibold" style={{ color: NAVY }}>
          Why mini mocks?
        </p>
        <p className="mt-2">
          Mini mocks are designed for daily practice. Complete one every day to build speed, track
          your progress, and identify weak areas before your full mock exam.
        </p>
      </div>

      {withImprovement.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 font-bold" style={{ color: NAVY }}>
            Previous mini mock results
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-2 pr-3">Mini Mock #</th>
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Score</th>
                  <th className="py-2 pr-3">R</th>
                  <th className="py-2 pr-3">S</th>
                  <th className="py-2 pr-3">L</th>
                  <th className="py-2 pr-3">C</th>
                  <th className="py-2">Improvement</th>
                </tr>
              </thead>
              <tbody>
                {withImprovement.map((m) => (
                  <tr key={m.mock_number} className="border-b border-slate-100">
                    <td className="py-2 pr-3">#{String(m.mock_number).padStart(2, "0")}</td>
                    <td className="py-2 pr-3">{formatDate(m.completed_at)}</td>
                    <td className="py-2 pr-3 font-bold">{m.total_score}/20</td>
                    <td className="py-2 pr-3">{m.reading_score}</td>
                    <td className="py-2 pr-3">{m.structure_score}</td>
                    <td className="py-2 pr-3">{m.listening_score}</td>
                    <td className="py-2 pr-3">{m.compositional_score}</td>
                    <td className="py-2">
                      {m.improvement == null ? (
                        <span className="text-slate-400">—</span>
                      ) : m.improvement >= 0 ? (
                        <span className="text-green-600">+{m.improvement}</span>
                      ) : (
                        <span className="text-red-600">{m.improvement}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="rounded-2xl border-2 p-5" style={{ borderColor: GOLD }}>
        <p className="text-sm font-semibold" style={{ color: NAVY }}>
          📅 Speakify recommends: One mini mock every 1–2 days
        </p>
        <p className="mt-1 text-sm text-slate-600">Full mock exam: Once every 2 weeks</p>
      </div>

      <button
        type="button"
        onClick={handleStart}
        disabled={starting}
        className="rounded-xl px-8 py-3 text-sm font-bold text-[#0d1b35] disabled:opacity-60"
        style={{ background: GOLD }}
      >
        {starting ? "Starting…" : `Start Mini Mock #${String(nextNumber).padStart(2, "0")} →`}
      </button>
    </div>
  );
}
