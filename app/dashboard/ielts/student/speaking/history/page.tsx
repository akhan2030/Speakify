"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import SkillBandHeader from "@/components/ielts/SkillBandHeader";
import GeneralSkillBandHeader from "@/components/ielts-general/GeneralSkillBandHeader";
import { PageSpinner } from "@/components/StudentSidebar";
import FeedbackReport from "@/components/speaking/FeedbackReport";
import MockSpeakingFeedbackReport from "@/components/speaking/MockSpeakingFeedbackReport";

type SessionRow = {
  id: string;
  sessionNumber: number;
  sessionType: string;
  overallBand: number | null;
  durationMinutes: number | null;
  speakingTimeSeconds: number | null;
  startedAt: string;
  completedAt: string;
  hasFeedback: boolean;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDuration(row: SessionRow) {
  if (row.durationMinutes != null && row.durationMinutes > 0) {
    return `${row.durationMinutes} min`;
  }
  if (row.speakingTimeSeconds != null && row.speakingTimeSeconds > 0) {
    const m = Math.floor(row.speakingTimeSeconds / 60);
    const s = row.speakingTimeSeconds % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  }
  return "—";
}

function bandColor(band: number | null) {
  if (band == null) return "#94a3b8";
  if (band >= 7) return "#0d9488";
  if (band >= 6) return "#c9972c";
  return "#dc2626";
}

function SpeakingHistoryContent({
  onLatestBand,
}: {
  onLatestBand?: (band: number | null) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const viewId = searchParams.get("session");
  const { status } = useSession();

  const isGeneralTraining = (pathname ?? "").startsWith("/dashboard/ielts-general");
  const speakingBase = isGeneralTraining
    ? "/dashboard/ielts-general/student/speaking"
    : "/dashboard/ielts/student/speaking";
  const programmeQuery = isGeneralTraining ? "&programme=ielts_general" : "";

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Record<string, unknown> | null>(null);
  const [viewSessionType, setViewSessionType] = useState<string>("practice");
  const [mockJourney, setMockJourney] = useState<
    { sessionNumber: number; overallBand: number | null }[]
  >([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadList = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch(`/api/speaking/session/history${isGeneralTraining ? "?programme=ielts_general" : ""}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        const rows = json.sessions ?? [];
        setSessions(rows);
        const latest = rows.find(
          (row: SessionRow) => row.overallBand != null && Number.isFinite(Number(row.overallBand))
        );
        onLatestBand?.(
          latest?.overallBand != null ? Number(latest.overallBand) : null
        );
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load history");
        setSessions([]);
      })
      .finally(() => setLoading(false));
  }, [isGeneralTraining, onLatestBand]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status !== "authenticated") return;
    loadList();
  }, [status, router, loadList]);

  useEffect(() => {
    if (!viewId || status !== "authenticated") {
      setFeedback(null);
      return;
    }

    setDetailLoading(true);
    fetch(`/api/speaking/session/history?sessionId=${encodeURIComponent(viewId)}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        const fb = json.session?.feedback;
        if (!fb) throw new Error("No feedback saved for this session");
        setViewSessionType(json.session?.session_type ?? "practice");
        setFeedback({
          ...(fb as Record<string, unknown>),
          sessionTranscript:
            (fb as { sessionTranscript?: unknown }).sessionTranscript ??
            json.session?.transcript ??
            [],
        });
        if (json.session?.session_type === "mock") {
          fetch(`/api/speaking/session/history?mockOnly=true${programmeQuery}`)
            .then((r) => r.json())
            .then((data) => {
              setMockJourney(
                (data.sessions ?? []).map(
                  (s: { sessionNumber: number; overallBand: number | null }) => ({
                    sessionNumber: s.sessionNumber,
                    overallBand: s.overallBand,
                  })
                )
              );
            })
            .catch(() => setMockJourney([]));
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Could not load feedback");
        setFeedback(null);
      })
      .finally(() => setDetailLoading(false));
  }, [viewId, status]);

  if (status === "loading") {
    return <PageSpinner />;
  }

  if (viewId && feedback) {
    if (viewSessionType === "mock") {
      return (
        <MockSpeakingFeedbackReport
          feedback={
            feedback as Parameters<typeof MockSpeakingFeedbackReport>[0]["feedback"]
          }
          mockJourney={mockJourney}
          onReturnHome={() => router.push(`${speakingBase}/history`)}
          onStartNext={() => router.push(speakingBase)}
        />
      );
    }

    return (
      <FeedbackReport
        feedback={feedback as Parameters<typeof FeedbackReport>[0]["feedback"]}
        onReturnHome={() => router.push(`${speakingBase}/history`)}
        onStartNext={() => router.push(speakingBase)}
      />
    );
  }

  if (viewId && detailLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
        Loading feedback report…
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0d1b35]">Speaking Session History</h1>
          <p className="mt-1 text-sm text-slate-500">
            Review past sessions and open your full band feedback reports.
          </p>
        </div>
        <Link
          href={speakingBase}
          className="text-sm font-semibold text-[#0d9488] hover:underline"
        >
          ← Back to Speaking
        </Link>
      </div>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading sessions…
        </div>
      ) : error && sessions.length === 0 ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
        </div>
      ) : sessions.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-600">No completed speaking sessions yet.</p>
          <Link
            href={speakingBase}
            className="mt-4 inline-block rounded-xl bg-[#0d9488] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0b7c72]"
          >
            Start your first session →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Session</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Band</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3 text-right">Feedback</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((row) => (
                <tr key={row.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-semibold text-[#0d1b35]">#{row.sessionNumber}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(row.completedAt)}</td>
                  <td className="px-4 py-3 capitalize text-slate-600">{row.sessionType}</td>
                  <td className="px-4 py-3">
                    <span
                      style={{
                        fontWeight: 700,
                        color: bandColor(
                          row.overallBand != null ? Number(row.overallBand) : null
                        ),
                      }}
                    >
                      {row.overallBand != null ? Number(row.overallBand).toFixed(1) : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{formatDuration(row)}</td>
                  <td className="px-4 py-3 text-right">
                    {row.hasFeedback ? (
                      <Link
                        href={`${speakingBase}/history?session=${row.id}`}
                        className="inline-flex rounded-lg bg-[#0d1b35] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#152a4d]"
                      >
                        View feedback
                      </Link>
                    ) : (
                      <span className="text-xs text-slate-400">No report</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function SpeakingHistoryPage() {
  const pathname = usePathname();
  const isGeneralTraining = (pathname ?? "").startsWith("/dashboard/ielts-general");
  const [latestSpeakingBand, setLatestSpeakingBand] = useState<number | null>(null);

  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      {isGeneralTraining ? (
        <GeneralSkillBandHeader
          skill="speaking"
          title="Session History"
          subtitle="General Training speaking sessions and band feedback reports"
          latestBand={latestSpeakingBand}
        />
      ) : (
        <SkillBandHeader
          skill="speaking"
          title="Session History"
          subtitle="Past speaking sessions and band feedback reports"
          latestBand={latestSpeakingBand}
        />
      )}
      <Suspense fallback={<PageSpinner />}>
        <SpeakingHistoryContent onLatestBand={setLatestSpeakingBand} />
      </Suspense>
    </main>
  );
}
