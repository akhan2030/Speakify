"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PageSpinner } from "@/components/StudentSidebar";
import { STEP_ROUTES } from "@/lib/step/paths";
import { useRouter } from "next/navigation";

const NAVY = "#0d1b35";
const GOLD = "#c9972c";
const TEAL = "#0d9488";

type PhaseCard = {
  phase: number;
  title: string;
  subtitle: string;
  weekCount: number;
  status: string;
  exitScore: number | null;
  exitScoreRequired: number;
  certificateId: string | null;
  continueHref: string | null;
};

export default function StepMyJourneyPage() {
  const router = useRouter();
  const [data, setData] = useState<{
    phases: PhaseCard[];
    progress: {
      overallCompletion: number;
      weekLabel: string;
      estimatedCompletionLabel: string;
    };
    enrollment: { diagnostic_score: number | null };
  } | null>(null);

  useEffect(() => {
    fetch("/api/step/journey")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) return;
        if (json.enrollment?.diagnostic_score == null) {
          router.replace(STEP_ROUTES.diagnostic);
          return;
        }
        setData(json);
      });
  }, [router]);

  if (!data) return <PageSpinner />;

  function statusLine(p: PhaseCard): { icon: string; text: string } {
    if (p.status === "completed") {
      return {
        icon: "✅",
        text: `Completed — Exit score: ${p.exitScore ?? "—"}`,
      };
    }
    if (p.status === "active") {
      return {
        icon: "🔵",
        text: `In progress — ${data!.progress.weekLabel}`,
      };
    }
    if (p.phase === 4) {
      return {
        icon: "🔒",
        text: `Locked — Complete Phase 3 to unlock · Exit target: ${p.exitScoreRequired}+`,
      };
    }
    return {
      icon: "🔒",
      text: `Locked — Complete Phase ${p.phase - 1} to unlock`,
    };
  }

  return (
    <div className="space-y-8 p-4 pb-24 md:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: GOLD }}>
          My Phase Journey
        </p>
        <h1 className="mt-1 text-2xl font-extrabold" style={{ color: NAVY }}>
          Speakify STEP Accelerator
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          One adaptive course · 4 phases · automatic advancement via exit checks
        </p>
      </div>

      <div className="space-y-5">
        {data.phases.map((p) => {
          const { icon, text } = statusLine(p);
          const isActive = p.status === "active";
          return (
            <article
              key={p.phase}
              className={`rounded-2xl border p-6 ${
                isActive
                  ? "border-[#c9972c] bg-amber-50/40 shadow-md"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-400">
                    Phase {p.phase} — {p.weekCount} weeks
                  </p>
                  <h2 className="text-xl font-bold" style={{ color: NAVY }}>
                    {p.title}
                  </h2>
                  <p className="text-sm text-slate-500">{p.subtitle}</p>
                </div>
                <span className="text-2xl">{icon}</span>
              </div>
              <p className="mt-3 text-sm font-medium text-slate-700">
                Status: {text}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                {p.status === "completed" && p.certificateId ? (
                  <span
                    className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: TEAL }}
                  >
                    Certificate: {p.certificateId}
                  </span>
                ) : p.status === "completed" ? (
                  <button
                    type="button"
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                    disabled
                  >
                    View certificate
                  </button>
                ) : null}
                {p.status === "active" && p.continueHref ? (
                  <Link
                    href={p.continueHref}
                    className="rounded-xl px-4 py-2 text-sm font-semibold text-[#0d1b35]"
                    style={{ backgroundColor: GOLD }}
                  >
                    Continue →
                  </Link>
                ) : null}
                {p.status === "active" && p.phase < 4 ? (
                  <Link
                    href={`${STEP_ROUTES.phaseExit}?phase=${p.phase}`}
                    className="text-sm font-semibold hover:underline"
                    style={{ color: TEAL }}
                  >
                    Phase exit check →
                  </Link>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <footer className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <p className="text-sm text-slate-600">
          Overall course progress:{" "}
          <strong style={{ color: NAVY }}>{data.progress.overallCompletion}%</strong>
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Estimated completion:{" "}
          <strong style={{ color: NAVY }}>{data.progress.estimatedCompletionLabel}</strong>
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full"
            style={{
              width: `${data.progress.overallCompletion}%`,
              backgroundColor: GOLD,
            }}
          />
        </div>
      </footer>
    </div>
  );
}
