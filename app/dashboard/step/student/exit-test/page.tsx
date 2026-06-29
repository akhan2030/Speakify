"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import { EXIT_TEST_COOLDOWN_DAYS } from "@/lib/step/exitTest/constants";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

type Status = {
  phase: number;
  phaseTitle: string;
  week: number;
  weeksInPhase: number;
  passThreshold: number;
  estimatedScore: number;
  readiness: { tone: string; message: string };
  weekEligible: boolean;
  cooldownDays: number;
  ready: boolean;
  previousAttempts: Array<{
    attemptNumber: number;
    date: string;
    score: number;
    passed: boolean;
    nextAttemptAvailable: string | null;
  }>;
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

export default function ExitTestLandingPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    fetch("/api/step/exit-test/status")
      .then(async (r) => {
        const json = await r.json();
        if (!r.ok) throw new Error(json.error);
        setStatus(json);
      })
      .catch((e) => setError(e.message));
  }, []);

  const handleStart = async () => {
    if (!status || starting) return;
    setStarting(true);
    try {
      const res = await fetch("/api/step/exit-test/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: status.phase }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not start");
      sessionStorage.setItem(
        `step-exit-${json.attemptId}`,
        JSON.stringify({
          attemptId: json.attemptId,
          phase: json.phase,
          questions: json.questions,
        })
      );
      router.push("/dashboard/step/student/exit-test/exam");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to start");
      setStarting(false);
    }
  };

  if (error) return <p className="p-8 text-red-600">{error}</p>;
  if (!status) return <PageSpinner />;

  const readinessColors = {
    green: "#059669",
    amber: "#c9972c",
    red: "#dc2626",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4 md:p-8">
      <h1 className="text-2xl font-bold" style={{ color: NAVY }}>
        Phase {status.phase} Exit Test — {status.phaseTitle}
      </h1>

      {!status.weekEligible && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          You are in Week {status.week} of {status.weeksInPhase} — exit test unlocks in{" "}
          {Math.max(0, status.weeksInPhase - status.week)} week
          {status.weeksInPhase - status.week === 1 ? "" : "s"}
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <ul className="space-y-2 text-sm text-slate-700">
          <li>40 questions (10 per section)</li>
          <li>45 minutes timed</li>
          <li>
            Pass score required: <strong>{status.passThreshold}/100</strong>
          </li>
          <li>
            Your current estimate: <strong>{status.estimatedScore}/100</strong>
          </li>
          <li>Attempts allowed: unlimited (must wait {EXIT_TEST_COOLDOWN_DAYS} days between attempts)</li>
        </ul>

        <div
          className="mt-4 rounded-lg p-4 text-sm font-medium"
          style={{
            background:
              status.readiness.tone === "green"
                ? "#ecfdf5"
                : status.readiness.tone === "amber"
                  ? "#fffbeb"
                  : "#fef2f2",
            color: readinessColors[status.readiness.tone as keyof typeof readinessColors],
          }}
        >
          {status.readiness.message}
        </div>
      </div>

      {status.previousAttempts.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 font-bold" style={{ color: NAVY }}>
            Previous attempts
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-slate-500">
                  <th className="py-2 pr-4">Attempt #</th>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Score</th>
                  <th className="py-2 pr-4">Result</th>
                  <th className="py-2">Next attempt</th>
                </tr>
              </thead>
              <tbody>
                {status.previousAttempts.map((a) => (
                  <tr key={a.attemptNumber} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{a.attemptNumber}</td>
                    <td className="py-2 pr-4">{formatDate(a.date)}</td>
                    <td className="py-2 pr-4">{a.score}/100</td>
                    <td className="py-2 pr-4">
                      {a.passed ? (
                        <span className="text-green-600">Passed</span>
                      ) : (
                        <span className="text-red-600">Failed</span>
                      )}
                    </td>
                    <td className="py-2">
                      {a.nextAttemptAvailable
                        ? formatDate(a.nextAttemptAvailable)
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleStart}
          disabled={starting}
          className="rounded-lg px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: GOLD }}
        >
          {starting ? "Starting…" : "Start Exit Test"}
        </button>
        <Link
          href="/dashboard/step/student/reading"
          className="rounded-lg border border-slate-200 px-6 py-3 text-sm font-medium"
          style={{ color: TEAL }}
        >
          Practice more first →
        </Link>
      </div>

      {status.cooldownDays > 0 && (
        <p className="text-sm text-amber-700">
          You can retake this exit test in {status.cooldownDays} day(s). You may still review practice
          sections meanwhile.
        </p>
      )}
    </div>
  );
}
