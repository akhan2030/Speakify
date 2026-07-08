"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageSpinner } from "@/components/StudentSidebar";
import LearningJourneyHub from "@/components/accelerator/LearningJourneyHub";
import { isValidTrack, type AcceleratorTrackId } from "@/lib/accelerator/tracks";
import type { AcceleratorSectionId } from "@/lib/accelerator/practiceMeta";
import type { LearningJourney } from "@/lib/accelerator/learningJourney";

type DashboardData = {
  fullMock: {
    testId: string | null;
    topic: string | null;
    hasFresh: boolean;
    previous: { bandScore: number | null; score: number | null; completedAt: string } | null;
  };
  sections: Record<
    AcceleratorSectionId,
    { hasFresh: boolean; testId: string | null; topic: string | null }
  >;
  lastBySection: Record<
    AcceleratorSectionId,
    {
      accuracy: number | null;
      bandScore: number | null;
      score: number | null;
      totalQuestions: number | null;
      completedAt: string | null;
    } | null
  >;
  journey: LearningJourney;
};

export default function AcceleratorPracticePage() {
  const params = useParams();
  const router = useRouter();
  const trackParam = String(params.track ?? "");
  const track = isValidTrack(trackParam) ? trackParam : null;

  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  const load = useCallback(async () => {
    if (!track) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/accelerator/practice?track=${track}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [track]);

  useEffect(() => {
    load();
  }, [load]);

  async function startTest(opts: {
    testType: "full_mock" | "section_practice";
    section?: AcceleratorSectionId;
    testId?: string | null;
    sourceKey?: string;
  }) {
    if (!track) return;
    const fetchKey =
      opts.sourceKey ??
      (opts.testId
        ? `test:${opts.testId}`
        : opts.section
          ? `${opts.testType}:${opts.section}`
          : opts.testType);
    setFetching(fetchKey);
    setGenerating(false);
    setError(null);

    try {
      // No published accelerator full mock — use timed mock exam flow instead of AI generation
      if (opts.testType === "full_mock" && !opts.testId) {
        console.log("Navigating to timed mock exams (no accelerator full mock available)");
        router.push("/dashboard/ielts/student/mock-exam");
        return;
      }

      let testId = opts.testId;
      if (!testId) {
        setGenerating(true);
        const res = await fetch("/api/accelerator/practice/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            track,
            testType: opts.testType,
            section: opts.section ?? null,
            generateIfNeeded: false,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(
            json.error ??
              "We couldn't start your practice session. Please try again shortly."
          );
        }
        testId = json.test?.id;
        if (!testId) throw new Error("No test returned");
      }

      const qs = new URLSearchParams({ testId, type: opts.testType });
      if (opts.section) qs.set("section", opts.section);
      console.log("Navigating to practice session:", testId);
      router.push(
        `/dashboard/ielts/student/accelerator/${track}/practice/session?${qs.toString()}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start");
    } finally {
      setFetching(null);
      setGenerating(false);
    }
  }

  if (!track) {
    return (
      <main className="p-6">
        <p className="text-red-600">Invalid track. Choose Foundation, Plus, or Elite.</p>
        <Link href="/dashboard/ielts/student/progress?tab=programme" className="mt-4 inline-block text-[#c9972c]">
          ← Back to My Track
        </Link>
      </main>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <PageSpinner />
      </div>
    );
  }

  if (!data?.journey) {
    return (
      <main className="p-6">
        <p className="text-red-600">{error ?? "Failed to load learning journey"}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 sm:p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard/ielts/student/progress?tab=programme"
            className="text-sm font-semibold text-[#0d9488] hover:underline"
          >
            ← All tracks
          </Link>
          <div className="flex gap-2">
            {(["foundation", "plus", "elite"] as AcceleratorTrackId[]).map((t) => (
              <Link
                key={t}
                href={`/dashboard/ielts/student/accelerator/${t}/practice`}
                className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                  t === track
                    ? "bg-[#0d1b35] text-[#c9972c]"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                {t}
              </Link>
            ))}
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {generating ? (
          <div className="mb-6 rounded-xl border border-[#0d9488]/40 bg-[#0d9488]/10 px-4 py-4 text-sm text-[#0d1b35]">
            Preparing your next activity… This may take up to a minute.
          </div>
        ) : null}

        <LearningJourneyHub
          track={track}
          journey={data.journey}
          fullMock={data.fullMock}
          onStart={startTest}
          fetching={fetching}
          generating={generating}
        />
      </div>
    </main>
  );
}
