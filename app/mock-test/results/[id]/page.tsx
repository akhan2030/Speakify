"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import MockResultsReport from "@/components/mock-test/MockResultsReport";
import type { MockTestFullReport } from "@/lib/mock-test/reportTypes";

export default function MockTestResultsPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: session } = useSession();
  const [report, setReport] = useState<MockTestFullReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusText, setStatusText] = useState("Loading your results…");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const id = params.id;
      const studentName =
        session?.user?.name?.trim() ||
        session?.user?.email?.split("@")[0] ||
        "Candidate";

      try {
        if (id.startsWith("local_")) {
          setStatusText("Generating your premium examiner report…");
          const stored = sessionStorage.getItem(`mock_test_${id}`);
          const payload = stored
            ? JSON.parse(stored)
            : { answers: {}, transcripts: {} };
          const res = await fetch(`/api/mock-test/evaluate/${id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answers: payload.answers ?? {},
              transcripts: payload.transcripts ?? {},
              studentName,
              completedAt: new Date().toISOString(),
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Evaluation failed");
          if (!cancelled) setReport(data.report);
          return;
        }

        const check = await fetch(`/api/mock-test/evaluate/${id}`);
        const checkData = await check.json();

        if (checkData.report) {
          if (!cancelled) setReport(checkData.report);
          return;
        }

        setStatusText("Analysing your answers with AI examiners…");
        const res = await fetch(`/api/mock-test/evaluate/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ studentName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Evaluation failed");
        if (!cancelled) setReport(data.report);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load results");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params.id, session?.user?.name, session?.user?.email]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1b35] px-6 text-center text-white">
        <span className="h-12 w-12 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
        <p className="mt-6 text-lg font-semibold">{statusText}</p>
        <p className="mt-2 max-w-sm text-sm text-slate-400">
          Our AI examiners are scoring your writing and speaking against official IELTS
          band descriptors. This may take up to a minute.
        </p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1b35] px-6 text-center text-white">
        <p className="text-lg font-semibold text-red-300">
          {error ?? "Results unavailable"}
        </p>
        <Link
          href="/mock-test"
          className="mt-6 rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35]"
        >
          Back to mock test
        </Link>
      </div>
    );
  }

  return <MockResultsReport report={report} attemptId={params.id} />;
}
