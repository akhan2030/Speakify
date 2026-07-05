"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ReadingTestShell, {
  type ReadingTestShellProps,
} from "@/components/ReadingTestShell";
import DailyLimitReached from "@/components/DailyLimitReached";
import { buildMockTestConfigFromPassages } from "@/lib/passageContentAdapter";
import { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";
import { initDailyLimit, fetchPassage } from "@/lib/useDailyLimitGate";
import type { DailyLimitState } from "@/lib/useDailyLimitGate";

const MOCK_DURATION_SECONDS = 3600;
const MOCK_PASSAGE_TYPES = [
  "multiple-choice",
  "true-false-not-given",
  "sentence-completion",
] as const;

export default function FullReadingMockTestPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { base } = usePathwayStudentContext();
  const [limits, setLimits] = useState<DailyLimitState | null>(null);
  const [limitLoading, setLimitLoading] = useState(true);
  const [passageLoading, setPassageLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [testConfig, setTestConfig] = useState<
    ReadingTestShellProps["config"] | null
  >(null);
  const [allowed, setAllowed] = useState(false);

  const studentId = (session?.user as { id?: string })?.id ?? "";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !studentId) return;

    let cancelled = false;

    async function init() {
      setLimitLoading(true);
      setLoadError(null);
      try {
        const { limits: limitData, allowed: canStart } =
          await initDailyLimit(studentId, "mock");

        if (cancelled) return;

        setLimits(limitData);
        if (!canStart) {
          setAllowed(false);
          return;
        }

        setAllowed(true);
        setLimitLoading(false);
        setPassageLoading(true);

        const passages = await Promise.all(
          MOCK_PASSAGE_TYPES.map((type) =>
            fetchPassage(studentId, type, "mock")
          )
        );

        if (cancelled) return;

        const config = buildMockTestConfigFromPassages(
          passages.map((p) => p.passage)
        ) as ReadingTestShellProps["config"];
        config.durationSeconds = MOCK_DURATION_SECONDS;
        setTestConfig(config);
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to prepare test"
          );
        }
      } finally {
        if (!cancelled) {
          setLimitLoading(false);
          setPassageLoading(false);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [status, studentId]);

  if (status === "loading" || status === "unauthenticated" || limitLoading) {
    return <PageSpinner />;
  }

  if (limits && !allowed && !limits.unlimited) {
    return <DailyLimitReached variant="mock" />;
  }

  if (passageLoading || !testConfig) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1b35] text-white">
        <span className="h-12 w-12 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
        <p className="mt-6 text-lg font-semibold">Preparing your unique mock test…</p>
        <p className="mt-2 text-sm text-slate-400">Generating 3 passages you have never seen</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md rounded-xl border border-red-200 bg-white p-8 text-center">
          <p className="text-red-600">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-xl bg-[#0d1b35] px-6 py-2.5 text-sm font-bold text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ReadingTestShell
      config={testConfig}
      exitHref={`${base}/reading`}
      resultsQuery="testType=full"
      dailyTestsUsed={limits?.unlimited ? null : limits?.mockTestsUsed ?? null}
      dailyTestsMax={limits?.mockTestsMax ?? 10}
    />
  );
}
