"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ReadingTestShell from "@/components/ReadingTestShell";
import DailyLimitReached from "@/components/DailyLimitReached";
import { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";
import { isValidQuestionType, normalizeQuestionType } from "@/lib/readingPassageTypes";
import { initDailyLimit, fetchPassage } from "@/lib/useDailyLimitGate";
import type { DailyLimitState } from "@/lib/useDailyLimitGate";

const PASSAGE_DURATION_SECONDS = 1200;

export default function SinglePassageTestPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const { base } = usePathwayStudentContext();

  const questionType = normalizeQuestionType(String(params?.id ?? ""));
  const studentId = (session?.user as { id?: string })?.id ?? "";

  const [limits, setLimits] = useState<DailyLimitState | null>(null);
  const [limitLoading, setLimitLoading] = useState(true);
  const [passageLoading, setPassageLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [allowed, setAllowed] = useState(false);
  const [testConfig, setTestConfig] = useState<{
    testId: string;
    title: string;
    durationSeconds: number;
    totalQuestions: number;
    passages: object[];
  } | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !studentId || !isValidQuestionType(questionType)) {
      return;
    }

    let cancelled = false;

    async function init() {
      setLimitLoading(true);
      setLoadError(null);
      try {
        const { limits: limitData, allowed: canStart } =
          await initDailyLimit(studentId, "passage");

        if (cancelled) return;

        setLimits(limitData);
        if (!canStart) {
          setAllowed(false);
          return;
        }

        setAllowed(true);
        setLimitLoading(false);
        setPassageLoading(true);

        const { passage } = await fetchPassage(
          studentId,
          questionType,
          "passage"
        );

        if (cancelled) return;

        const questions = passage.questions.map((q: { id: string }, index: number) => ({
          ...q,
          globalNumber: index + 1,
          typeLabel: passage.name,
          typeSlug: passage.slug,
        }));

        setTestConfig({
          testId: `passage-${passage.passageId}`,
          title: `Timed Passage — ${passage.title}`,
          durationSeconds: PASSAGE_DURATION_SECONDS,
          totalQuestions: questions.length,
          passages: [
            {
              id: passage.passageId,
              index: 1,
              title: passage.title,
              paragraphs: passage.paragraphs,
              questions,
              questionCount: questions.length,
              startNumber: 1,
              endNumber: questions.length,
            },
          ],
        });
      } catch (err) {
        if (!cancelled) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load passage"
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
  }, [status, studentId, questionType]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  if (!isValidQuestionType(questionType)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
        <div className="max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-xl font-bold text-[#0d1b35]">Question type not found</h1>
          <p className="mt-3 text-sm text-slate-600">
            Choose a question type from the Reading home page.
          </p>
          <Link
            href={`${base}/reading`}
            className="mt-6 inline-flex rounded-xl bg-[#0d1b35] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#152a4d]"
          >
            Back to Reading Home
          </Link>
        </div>
      </div>
    );
  }

  if (limitLoading) {
    return <PageSpinner />;
  }

  if (limits && !allowed && !limits.unlimited) {
    return <DailyLimitReached variant="passage" />;
  }

  if (passageLoading || !testConfig) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1b35] text-white">
        <span className="h-12 w-12 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
        <p className="mt-6 text-lg font-semibold">Preparing your unique passage…</p>
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
      config={testConfig as Parameters<typeof ReadingTestShell>[0]["config"]}
      exitHref={`${base}/reading`}
      resultsQuery={`testType=passage&questionType=${questionType}`}
      dailyTestsUsed={limits?.unlimited ? null : limits?.passageTestsUsed ?? null}
      dailyTestsMax={limits?.passageTestsMax ?? 15}
    />
  );
}
