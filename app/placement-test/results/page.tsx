"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { bandToCefr } from "@/lib/placement/scoring";
import {
  DEADLINE_OPTIONS,
  parseTargetBandNumeric,
} from "@/lib/placement/onboarding";
import type { PlacementOnboarding } from "@/lib/placement/onboarding";
import { buildCertificateData, formatBand, formatWhatsAppDisplay } from "@/lib/placement/certificate";
import type { PlacementResult } from "@/lib/placement/types";
import PlacementCertificate from "./PlacementCertificate";
import SpeakifyWay from "@/components/SpeakifyWay";
import { buildPathwayRecommendation } from "@/lib/course/pathwayEngine";
import { buildProfileFromPlacement } from "@/lib/course/studentProfile";
import { buildRecommendations } from "@/lib/course/recommendationEngine";
import { computeProjectedAchievement } from "@/lib/course/projectedAchievement";
import { generatePersonalizedStudyPlan } from "@/lib/course/studyPlanGenerator";
import PathwayRecommendationPanel from "@/components/placement/PathwayRecommendationPanel";

const RESULT_KEY = "speakify_placement_result";

type Stored = {
  result: PlacementResult;
  studyPlan?: unknown;
  completedAt: string;
  onboarding?: PlacementOnboarding | null;
};

function deadlineLabel(value: string) {
  const preset = DEADLINE_OPTIONS.find((d) => d.value === value);
  if (preset) return preset.label;
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    return new Date(value).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  return value;
}

function skillLabel(key: string): string {
  const map: Record<string, string> = {
    vocabulary: "Vocabulary",
    grammar: "Grammar",
    reading: "Reading",
    writing_prompt: "Writing",
    listening: "Listening",
    speaking: "Speaking",
  };
  return map[key] ?? key;
}

export default function PlacementResultsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [data, setData] = useState<Stored | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(RESULT_KEY);
    if (!raw) {
      router.replace("/placement-test");
      return;
    }
    try {
      setData(JSON.parse(raw) as Stored);
    } catch {
      router.replace("/placement-test");
    }
  }, [router]);

  const whatsappRaw =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || "966500000000";
  const whatsappHref = `https://wa.me/${whatsappRaw.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hi Speakify, I completed the placement test and would like to learn more about the IELTS Accelerator program."
  )}`;

  const radarData = useMemo(() => {
    if (!data?.result.skillBands) return [];
    return Object.entries(data.result.skillBands).map(([key, value]) => ({
      skill: skillLabel(key),
      band: value,
      fullMark: 9,
    }));
  }, [data]);

  const certificateData = useMemo(() => {
    if (!data) return null;
    return buildCertificateData(
      data.result,
      data.completedAt,
      data.onboarding,
      session?.user?.name
    );
  }, [data, session?.user?.name]);

  const pathway = useMemo(() => {
    if (!data) return null;
    return buildPathwayRecommendation(data.result, data.onboarding);
  }, [data]);

  const insights = useMemo(() => {
    if (!data) return null;
    const tb =
      parseTargetBandNumeric(data.onboarding?.targetBandScore ?? "") ??
      Math.min(9, Math.round((data.result.overallBand + 1) * 2) / 2);
    const profile = buildProfileFromPlacement(data.result, tb);
    return {
      recommendations: buildRecommendations(profile),
      projected: computeProjectedAchievement(profile),
      studyPlan: generatePersonalizedStudyPlan(profile),
    };
  }, [data]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0d1b35] text-white">
        Loading results…
      </div>
    );
  }

  const { result, onboarding } = data;
  const cefrInfo = bandToCefr(result.overallBand);
  const currentBand = result.overallBand;
  const targetBand =
    parseTargetBandNumeric(onboarding?.targetBandScore ?? "") ??
    Math.min(9, Math.round((currentBand + 1) * 2) / 2);
  const bandGap = Math.max(0, Math.round((targetBand - currentBand) * 10) / 10);
  const gapBarMax = 9;
  const currentPct = (currentBand / gapBarMax) * 100;
  const targetPct = (targetBand / gapBarMax) * 100;

  const whatsappDisplay = formatWhatsAppDisplay(whatsappRaw);

  const downloadFullReport = () => {
    const prevTitle = document.title;
    document.title = `Speakify_Report_${certificateData?.studentName.replace(/\s+/g, "_") ?? "Placement"}`;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 print:bg-white">
      <header className="bg-[#0d1b35] px-6 py-5 print:hidden">
        <p className="text-xl font-extrabold text-[#c9972c]">Speakify</p>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        {onboarding?.fullName ? (
          <section className="mb-8 rounded-xl border border-[#0d9488]/30 bg-[#0d9488]/10 px-5 py-4">
            <p className="text-sm font-semibold text-[#0d9488]">
              Results for {onboarding.fullName}
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Goal: Band {onboarding.targetBandScore}
              {onboarding.ieltsPurpose
                ? ` · ${onboarding.ieltsPurpose}`
                : ""}
              {onboarding.scoreDeadline
                ? ` · Target: ${deadlineLabel(onboarding.scoreDeadline)}`
                : ""}
            </p>
          </section>
        ) : null}

        <section className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0d9488]">
            Placement complete
          </p>
          <h1 className="mt-2 text-5xl font-bold text-[#c9972c] sm:text-6xl">
            {result.overallBand.toFixed(1)}
          </h1>
          <p className="mt-2 text-2xl font-bold text-[#0d1b35]">
            Your IELTS Band: {result.overallBand.toFixed(1)}
          </p>
          <span className="mt-4 inline-block rounded-full bg-[#0d1b35] px-5 py-2 text-sm font-bold text-white">
            {cefrInfo.cefr} — {cefrInfo.label}
          </span>
          <p className="mt-3 text-sm text-slate-500">
            {result.totalQuestions} questions • Confidence{" "}
            {result.confidenceScore}%
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0d1b35]">Skill profile</h2>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis
                  dataKey="skill"
                  tick={{ fill: "#0d1b35", fontSize: 12 }}
                />
                <Radar
                  name="Band"
                  dataKey="band"
                  stroke="#c9972c"
                  fill="#c9972c"
                  fillOpacity={0.35}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <h3 className="font-bold text-amber-900">Areas to improve</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-amber-950">
              {result.weakAreas.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-[#0d9488]/30 bg-[#0d9488]/10 p-5">
            <h3 className="font-bold text-[#0d9488]">Your strengths</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[#0d1b35]">
              {result.strongAreas.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          </section>
        </div>

        <section className="mt-10 overflow-hidden rounded-2xl bg-[#0d1b35] p-6 text-white shadow-lg sm:p-8">
          <h2 className="text-xl font-bold text-white sm:text-2xl">
            Your Path to Band {formatBand(targetBand)}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-200 sm:text-base">
            You are currently at Band{" "}
            <strong className="text-[#c9972c]">{formatBand(currentBand)}</strong>
            . Your goal is Band{" "}
            <strong className="text-[#0d9488]">{formatBand(targetBand)}</strong>
            {bandGap > 0 ? (
              <>
                . That&apos;s a gap of{" "}
                <strong className="text-amber-400">
                  {formatBand(bandGap)} band{bandGap === 1 ? "" : "s"}
                </strong>
                .
              </>
            ) : (
              ". You're already at your target — let's secure and exceed it."
            )}
          </p>

          <div className="mt-6">
            <div className="relative h-4 overflow-hidden rounded-full bg-white/10">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-[#c9972c]"
                style={{ width: `${currentPct}%` }}
              />
              {bandGap > 0 ? (
                <div
                  className="absolute inset-y-0 rounded-full bg-amber-400/90"
                  style={{
                    left: `${currentPct}%`,
                    width: `${Math.max(0, targetPct - currentPct)}%`,
                  }}
                />
              ) : null}
              <div
                className="absolute inset-y-0 rounded-full border-2 border-[#0d9488] bg-[#0d9488]/40"
                style={{
                  left: `${Math.max(0, targetPct - 1.5)}%`,
                  width: "3%",
                }}
              />
            </div>
            <div className="mt-2 flex justify-between text-xs font-semibold">
              <span className="text-[#c9972c]">
                Now: {formatBand(currentBand)}
              </span>
              {bandGap > 0 ? (
                <span className="text-amber-400">Gap: +{formatBand(bandGap)}</span>
              ) : null}
              <span className="text-[#0d9488]">
                Goal: {formatBand(targetBand)}
              </span>
            </div>
          </div>

          <p className="mt-6 text-sm font-medium text-slate-200 sm:text-base">
            This gap is absolutely achievable. Our students close this gap in as
            little as <strong className="text-white">4 weeks</strong>.
          </p>
        </section>

        <SpeakifyWay variant="panel" className="mt-10" />

        {pathway ? (
          <PathwayRecommendationPanel
            pathway={pathway}
            overallBand={result.overallBand}
            targetBand={targetBand}
            projectedAchievement={insights?.projected}
            studyPlan={insights?.studyPlan}
            recommendations={insights?.recommendations}
          />
        ) : null}

        <section className="mt-8 rounded-2xl border-2 border-[#c9972c] bg-white p-6 shadow-sm sm:p-8">
          <p className="text-lg font-bold text-[#0d1b35]">
            🚀 IELTS Accelerator — Speakify&apos;s Flagship 1-Month Program
          </p>
          <p className="mt-4 text-lg font-semibold leading-snug text-[#0d1b35]">
            &ldquo;From Band {formatBand(currentBand)} to {formatBand(targetBand)}{" "}
            in 30 Days — or We&apos;ll Coach You Again, Free.&rdquo;
          </p>

          <ul className="mt-6 space-y-2.5 text-sm text-slate-700">
            <li>✅ Daily live sessions with certified IELTS trainers</li>
            <li>✅ AI-powered writing feedback on every essay</li>
            <li>✅ Speaking mock tests 3× per week</li>
            <li>✅ Full mock IELTS exam in Week 4</li>
            <li>✅ Proven results: 94% of students hit their target band</li>
            <li>
              ✅ Saudi students — taught in a way that understands YOUR
              challenges
            </li>
          </ul>

          <blockquote className="mt-6 border-l-4 border-[#c9972c] bg-[#c9972c]/10 px-4 py-3 text-sm italic text-[#0d1b35]">
            &ldquo;I went from 5.5 to 7.0 in 28 days. I couldn&apos;t believe
            it.&rdquo;
            <footer className="mt-2 text-xs font-semibold not-italic text-slate-600">
              — Fatima Al-Zahrani, Riyadh (University Admission)
            </footer>
          </blockquote>

          <p className="mt-5 text-base font-medium text-[#0d1b35]">
            Don&apos;t wait months. One focused month is all it takes.
          </p>

          <Link
            href="/register"
            className="mt-6 block w-full rounded-xl bg-[#c9972c] px-6 py-4 text-center text-base font-bold text-[#0d1b35] hover:opacity-95 sm:text-lg"
          >
            Reserve My Spot in the Accelerator →
          </Link>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block w-full rounded-xl border-2 border-[#0d9488] px-6 py-3 text-center text-sm font-bold text-[#0d9488] hover:bg-[#0d9488]/10"
          >
            Talk to an Advisor First
          </a>
          <p className="mt-4 text-center text-xs font-semibold text-amber-700">
            ⚡ Limited seats available this month
          </p>
        </section>

        <section className="mt-10 print:hidden">
          <button
            type="button"
            onClick={downloadFullReport}
            className="w-full rounded-xl bg-[#0d1b35] px-6 py-3.5 text-sm font-bold text-white hover:bg-[#152a4d] sm:w-auto"
          >
            Download Full Report
          </button>
          <p className="mt-2 text-center text-xs text-slate-500 sm:text-left">
            Opens print dialog — choose &quot;Save as PDF&quot; for a 2-page
            certificate and roadmap.
          </p>
        </section>

        {certificateData ? (
          <div className="mt-6 print:hidden">
            <p className="mb-4 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
              2-page report preview
            </p>
            <PlacementCertificate
              data={certificateData}
              whatsappDisplay={whatsappDisplay}
            />
          </div>
        ) : null}

        <section className="mt-10 rounded-2xl border-2 border-[#c9972c] bg-gradient-to-br from-[#c9972c]/10 to-white p-6 shadow-sm sm:p-8 print:hidden">
          <p className="text-xs font-bold uppercase tracking-wide text-[#c9972c]">
            Start Your Learning Path
          </p>
          <h2 className="mt-2 text-xl font-bold text-[#0d1b35]">
            Your pathway has been set up
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            {currentBand < 5.0 ? (
              <>
                We recommend starting with the{" "}
                <strong>Speakify English Pathway</strong> to build core grammar,
                vocabulary, and confidence before IELTS-specific training.
              </>
            ) : currentBand < 6.5 ? (
              <>
                You are ready for <strong>IELTS Accelerator Plus</strong> — a
                structured program with daily lessons, AI feedback, and weekly
                assessments to reach Band {formatBand(targetBand)}.
              </>
            ) : (
              <>
                You are ready for <strong>IELTS Accelerator Elite</strong> —
                advanced strategies, mock exams, and precision coaching for
                high-band targets.
              </>
            )}
          </p>
          {currentBand >= 5.0 ? (
            <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
              <li>✓ Daily pathway lessons (Mon–Fri)</li>
              <li>✓ AI writing &amp; speaking feedback</li>
              <li>✓ Weekly quizzes &amp; progress tracking</li>
              <li>✓ IELTS Readiness Meter on your dashboard</li>
            </ul>
          ) : null}
          <Link
            href="/dashboard/student/pathway"
            className="mt-6 block w-full rounded-xl bg-[#c9972c] px-6 py-4 text-center text-base font-bold text-[#0d1b35] hover:opacity-95 sm:w-auto sm:inline-block"
          >
            Begin your pathway →
          </Link>
        </section>

        {certificateData ? (
          <div className="hidden print:block">
            <PlacementCertificate
              data={certificateData}
              whatsappDisplay={whatsappDisplay}
            />
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-4 sm:flex-row print:hidden">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-xl bg-[#25D366] py-3 text-center text-sm font-bold text-white hover:opacity-95"
          >
            Chat on WhatsApp
          </a>
          <Link
            href="/placement-test"
            className="flex-1 rounded-xl border-2 border-[#0d9488] py-3 text-center text-sm font-bold text-[#0d9488] hover:bg-[#0d9488]/10"
          >
            Retake test
          </Link>
        </div>
      </main>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
          body {
            background: white !important;
          }
          body * {
            visibility: hidden !important;
          }
          .certificate-print,
          .certificate-print * {
            visibility: visible !important;
          }
          .certificate-print {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .certificate-print-page {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            border: 4px solid #c9972c !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            page-break-after: always;
            break-after: page;
            overflow: hidden !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .certificate-print-page:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}
