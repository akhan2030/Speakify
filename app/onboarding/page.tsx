"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  GATEWAY_QUESTION_COUNT,
  gatewayEstimatedBand,
  initGatewayState,
  selectGatewayQuestion,
  submitGatewayAnswer,
} from "@/lib/onboarding/gatewayEngine";
import { skipInvalidQuestion } from "@/lib/placement/adaptiveEngine";
import { isValidQuestion, mcqOptionsRecord } from "@/lib/placement/isValidQuestion";
import {
  bandToPathwaySubLevel,
  dashboardPathForProgramme,
  programmeGoalLabel,
  recommendGatewayTrack,
  recommendationProgrammeLabel,
  targetBandFromRecommendation,
} from "@/lib/onboarding/recommendTrack";
import {
  ONBOARDING_PROGRAMME_OPTIONS,
  enrolledProgramsForGateway,
  placementAssessmentTitle,
  programTypeForGateway,
} from "@/lib/onboarding/programmes";
import type { GatewayProgramme, GatewayRecommendation } from "@/lib/onboarding/types";
import { bandToCefr } from "@/lib/placement/scoring";
import type { Question } from "@/lib/placement/types";
import { shouldSkipGateway } from "@/lib/onboarding/postLogin";
import { dashboardPathForStudentUser } from "@/lib/studentLoginRedirect";
import { normalizeRole } from "@/lib/roles";
import {
  ACCELERATOR_TRACKS,
  targetBandDisplayFromTrack,
  type AcceleratorTrackId,
} from "@/lib/accelerator/tracks";

const GOLD = "#c9972c";
const NAVY = "#0d1b35";

const CEFR_MARKERS = ["A1", "A2", "B1", "B2", "C1", "C2"];

function firstName(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0] ?? trimmed;
}

function levelBarIndex(level: string): number {
  const base = level.split(".")[0]?.toUpperCase() ?? "B1";
  const idx = CEFR_MARKERS.indexOf(base);
  return idx >= 0 ? idx : 2;
}

function ProgressBar({ step }: { step: number }) {
  const pct = (step / 4) * 100;
  return (
    <div className="mb-6">
      <div className="mb-2 flex justify-between text-xs font-medium text-slate-400">
        <span>Step {step} of 4</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: GOLD }}
        />
      </div>
    </div>
  );
}

function Shell({
  step,
  children,
  wide = false,
}: {
  step: number;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: NAVY }}>
      <header className="px-6 pt-6 sm:px-8">
        <p className="text-xl font-extrabold tracking-tight" style={{ color: GOLD }}>
          Speakify
        </p>
      </header>
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8">
        <div
          className={`w-full rounded-2xl bg-white p-6 shadow-2xl sm:p-8 ${
            wide ? "max-w-3xl" : "max-w-[560px]"
          }`}
        >
          <ProgressBar step={step} />
          {children}
        </div>
      </main>
    </div>
  );
}

function RecommendationDetails({ recommendation }: { recommendation: GatewayRecommendation }) {
  if (recommendation.kind === "ielts" || recommendation.kind === "ielts_general") {
    const meta = ACCELERATOR_TRACKS[recommendation.track];
    return (
      <>
        <p className="mt-2 text-lg font-bold text-[#0d1b35]">{recommendation.trackLabel}</p>
        <p className="mt-1 text-sm font-semibold text-[#0d1b35]">{meta.price}</p>
        <p className="mt-1 text-sm text-slate-600">Target: {recommendation.target}</p>
        <p className="text-sm text-slate-600">Duration: {recommendation.weeks} weeks</p>
      </>
    );
  }
  if (recommendation.kind === "toefl") {
    return (
      <>
        <p className="mt-2 text-lg font-bold text-[#0d1b35]">TOEFL Preparation</p>
        <p className="mt-1 text-sm text-slate-600">Target score: {recommendation.targetScore}</p>
        <p className="text-sm text-slate-600">{recommendation.levelLabel}</p>
      </>
    );
  }
  if (recommendation.kind === "step") {
    return (
      <>
        <p className="mt-2 text-lg font-bold text-[#0d1b35]">STEP Phase {recommendation.phase}</p>
        <p className="mt-1 text-sm text-slate-600">Target score range: {recommendation.score}</p>
      </>
    );
  }
  if (recommendation.kind === "pathway") {
    return (
      <>
        <p className="mt-2 text-lg font-bold text-[#0d1b35]">English Pathway {recommendation.level}</p>
        <p className="mt-1 text-sm text-slate-600">{recommendation.levelLabel}</p>
      </>
    );
  }
  if (recommendation.kind === "business_english") {
    return (
      <>
        <p className="mt-2 text-lg font-bold text-[#0d1b35]">Business English {recommendation.level}</p>
        <p className="mt-1 text-sm text-slate-600">{recommendation.levelLabel}</p>
      </>
    );
  }
  if (recommendation.kind === "legal_english") {
    return (
      <>
        <p className="mt-2 text-lg font-bold text-[#0d1b35]">Legal English {recommendation.level}</p>
        <p className="mt-1 text-sm text-slate-600">{recommendation.levelLabel}</p>
      </>
    );
  }
  return (
    <>
      <p className="mt-2 text-lg font-bold text-[#0d1b35]">Kids English — {recommendation.level}</p>
      <p className="mt-1 text-sm text-slate-600">{recommendation.levelLabel}</p>
      <p className="text-sm text-slate-600">Recommended for {recommendation.ageBand}</p>
    </>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [step, setStep] = useState(1);
  const [programme, setProgramme] = useState<GatewayProgramme | null>(null);
  const [testState, setTestState] = useState(() => initGatewayState());
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState(false);
  const [assessmentDone, setAssessmentDone] = useState(false);
  const [placementBand, setPlacementBand] = useState<number | null>(null);
  const [recommendation, setRecommendation] = useState<GatewayRecommendation | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [purchasedTrack, setPurchasedTrack] = useState<AcceleratorTrackId | null>(null);
  const [autoStarted, setAutoStarted] = useState(false);
  const [contextLoaded, setContextLoaded] = useState(false);
  const [skipPurchasedAutoStart, setSkipPurchasedAutoStart] = useState(false);
  const [needsPayment, setNeedsPayment] = useState(false);

  const purchasedMeta = purchasedTrack ? ACCELERATOR_TRACKS[purchasedTrack] : null;

  const role = normalizeRole((session?.user as { role?: string })?.role);
  const onboardingCompleted =
    (session?.user as { onboardingCompleted?: boolean })?.onboardingCompleted === true;

  const hasDashboardAccess =
    (session?.user as { hasDashboardAccess?: boolean })?.hasDashboardAccess === true;
  const requiresPayment =
    (session?.user as { requiresPayment?: boolean })?.requiresPayment === true;

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (shouldSkipGateway(role)) {
      router.replace(dashboardPathForStudentUser(session?.user ?? {}));
      return;
    }
    if (onboardingCompleted) {
      if (requiresPayment && !hasDashboardAccess) {
        router.replace("/checkout");
        return;
      }
      router.replace(dashboardPathForStudentUser(session?.user ?? {}));
    }
  }, [
    status,
    role,
    onboardingCompleted,
    hasDashboardAccess,
    requiresPayment,
    router,
    session?.user,
  ]);

  useEffect(() => {
    if (status !== "authenticated" || onboardingCompleted) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/onboarding/context");
        const data = await res.json();
        if (cancelled) return;
        if (data?.purchasedTrack) {
          setPurchasedTrack(data.purchasedTrack as AcceleratorTrackId);
        }
      } catch {
        /* optional */
      } finally {
        if (!cancelled) setContextLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, onboardingCompleted]);

  useEffect(() => {
    if (step !== 2 || !currentQuestion || assessmentDone) return;
    if (!isValidQuestion(currentQuestion)) {
      const next = selectGatewayQuestion(skipInvalidQuestion(testState, currentQuestion.id));
      if (next) setCurrentQuestion(next);
    }
  }, [step, currentQuestion, assessmentDone, testState]);

  const startAssessment = useCallback((selected: GatewayProgramme) => {
    setProgramme(selected);
    const state = initGatewayState();
    setTestState(state);
    setCurrentQuestion(selectGatewayQuestion(state));
    setStep(2);
  }, []);

  useEffect(() => {
    if (
      autoStarted ||
      skipPurchasedAutoStart ||
      !purchasedTrack ||
      step !== 1 ||
      status !== "authenticated"
    ) {
      return;
    }
    setAutoStarted(true);
    startAssessment("ielts");
  }, [purchasedTrack, autoStarted, skipPurchasedAutoStart, step, status, startAssessment]);

  const handleAnswer = useCallback(
    (selected: string) => {
      if (!currentQuestion || advancing || !selected.trim()) return;
      setSelectedAnswer(selected);
      setAdvancing(true);
      const { state: nextState } = submitGatewayAnswer(
        testState,
        currentQuestion,
        selected
      );
      setTestState(nextState);

      window.setTimeout(() => {
        setSelectedAnswer(null);
        setAdvancing(false);
        if (nextState.questionsAsked >= GATEWAY_QUESTION_COUNT) {
          const band = gatewayEstimatedBand(nextState);
          setPlacementBand(band);
          if (programme) {
            setRecommendation(recommendGatewayTrack(programme, band));
          }
          setAssessmentDone(true);
          setStep(3);
          return;
        }
        setCurrentQuestion(selectGatewayQuestion(nextState));
      }, 400);
    },
    [currentQuestion, advancing, programme, testState]
  );

  const cefrLevel = useMemo(
    () => (placementBand != null ? bandToPathwaySubLevel(placementBand) : "B1.2"),
    [placementBand]
  );

  const cefrLabel = useMemo(() => {
    if (placementBand == null) return "Intermediate";
    return bandToCefr(placementBand).label;
  }, [placementBand]);

  const finishOnboarding = async () => {
    if (!programme || placementBand == null || !recommendation) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programme, placementBand }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error ?? "Could not save your results");
      }
      await update({
        onboardingCompleted: true,
        programType: programTypeForGateway(programme),
        enrolledPrograms: enrolledProgramsForGateway(programme),
        stepEnrolled: programme === "step",
        ...(data.needsPayment
          ? { paymentStatus: "unpaid", hasDashboardAccess: false }
          : { hasDashboardAccess: true }),
      });
      setNeedsPayment(Boolean(data.needsPayment));
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const enterDashboard = () => {
    if (needsPayment && programme === "ielts") {
      window.location.href = "/checkout";
      return;
    }
    const path = programme ? dashboardPathForProgramme(programme) : "/dashboard/ielts/student";
    window.location.href = path;
  };

  if (status === "loading" || onboardingCompleted || shouldSkipGateway(role)) {
    return (
      <div
        className="flex min-h-screen items-center justify-center text-white"
        style={{ backgroundColor: NAVY }}
      >
        <span
          className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
          style={{ borderColor: `${GOLD}40`, borderTopColor: GOLD }}
        />
      </div>
    );
  }

  if (step === 1) {
    // deploy: onboarding-goal-grid-v8 — all 8 Speakify programmes (Step 1)
    if (!contextLoaded || (purchasedTrack && !autoStarted && !skipPurchasedAutoStart)) {
      return (
        <div
          className="flex min-h-screen items-center justify-center text-white"
          style={{ backgroundColor: NAVY }}
        >
          <span
            className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: `${GOLD}40`, borderTopColor: GOLD }}
          />
        </div>
      );
    }

    return (
      <Shell step={1} wide>
        <h1 className="text-2xl font-bold text-[#0d1b35]">Welcome to Speakify</h1>
        <p className="mt-2 text-sm text-slate-600">
          Choose from all 8 Speakify programmes — we will place you at exactly the right level.
        </p>
        <p className="mt-6 text-sm font-semibold text-[#0d1b35]">
          What are you here for?{" "}
          <span className="font-normal text-slate-500">({ONBOARDING_PROGRAMME_OPTIONS.length} programmes)</span>
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
          {ONBOARDING_PROGRAMME_OPTIONS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => startAssessment(p.id)}
              className="rounded-xl border-2 border-slate-200 p-3 text-left transition hover:border-[#c9972c] hover:bg-[#c9972c]/5 md:p-4"
            >
              <span className="text-xl md:text-2xl">{p.icon}</span>
              <p className="mt-1.5 text-xs font-bold leading-snug text-[#0d1b35] md:mt-2 md:text-sm">
                {p.title}
              </p>
              <p className="mt-0.5 text-[10px] leading-snug text-slate-500 md:mt-1 md:text-[11px]">
                {p.subtitle}
              </p>
            </button>
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] text-slate-400">
          IELTS Academic · IELTS General · TOEFL · STEP · Pathway · Business · Legal · Kids
        </p>
      </Shell>
    );
  }

  if (step === 2 && currentQuestion && !assessmentDone) {
    const qNum = testState.questionsAsked + 1;
    const opts = mcqOptionsRecord(currentQuestion.options);
    const letters = ["A", "B", "C", "D"] as const;

    if (!isValidQuestion(currentQuestion)) {
      return (
        <Shell step={2}>
          <p className="text-sm text-slate-500">Loading next question…</p>
        </Shell>
      );
    }

    return (
      <Shell step={2}>
        <h1 className="text-xl font-bold text-[#0d1b35]">
          {programme ? placementAssessmentTitle(programme) : "Quick Level Check — 15 questions"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          This takes about 8 minutes and places you at exactly the right level.
        </p>
        <p className="mt-4 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
          There is no pass or fail. Answer honestly — the more accurate your answers, the better
          your personalised plan.
        </p>
        <div className="mt-6">
          <div className="mb-2 flex justify-between text-xs font-medium text-slate-500">
            <span>Question {qNum} of {GATEWAY_QUESTION_COUNT}</span>
          </div>
          <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${(qNum / GATEWAY_QUESTION_COUNT) * 100}%`,
                backgroundColor: GOLD,
              }}
            />
          </div>
          <p className="text-base font-medium leading-relaxed text-[#0d1b35]">
            {currentQuestion.question}
          </p>
          <div className="mt-5 grid gap-2">
            {letters.map((letter) => {
              const opt = opts[letter];
              if (!opt || opt.trim().length === 0) return null;
              const isSelected = selectedAnswer === opt;
              return (
                <button
                  key={letter}
                  type="button"
                  disabled={advancing}
                  onClick={() => handleAnswer(opt)}
                  className={`flex items-center gap-2 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${
                    isSelected
                      ? "border-[#c9972c] bg-[#c9972c]/10 text-[#0d1b35]"
                      : advancing
                        ? "border-slate-200 opacity-60"
                        : "border-slate-200 hover:border-[#c9972c] hover:bg-[#c9972c]/5"
                  }`}
                >
                  <span className="font-bold text-[#c9972c]">{letter}.</span>
                  <span className="flex-1">{opt}</span>
                  {isSelected ? (
                    <span className="text-sm font-bold text-[#c9972c]" aria-hidden>
                      ✓
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      </Shell>
    );
  }

  if (step === 3 && recommendation && placementBand != null && programme) {
    const goal = programmeGoalLabel(programme);
    const barIdx = levelBarIndex(cefrLevel);
    const whatsappRaw =
      process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || "966500000000";
    const whatsappHref = `https://wa.me/${whatsappRaw.replace(/\D/g, "")}?text=${encodeURIComponent(
      "Hi Speakify, I registered for an IELTS tier and need help changing my plan."
    )}`;

    return (
      <Shell step={3}>
        <h1 className="text-xl font-bold text-[#0d1b35]">
          Your English Level: {cefrLevel}
        </h1>
        <p className="mt-1 text-sm font-medium text-slate-600">{cefrLabel}</p>

        <div className="mt-6 flex justify-between gap-1 text-[10px] font-semibold uppercase text-slate-400">
          {CEFR_MARKERS.map((m, i) => (
            <span key={m} className={i === barIdx ? "text-[#c9972c]" : ""}>
              {m}
              {i === barIdx ? " ●" : ""}
            </span>
          ))}
        </div>

        <p className="mt-6 text-sm leading-relaxed text-slate-600">
          {purchasedMeta
            ? `Your placement check is complete. We will personalise your study plan to your current level while you follow the ${purchasedMeta.name} track we recommend for you.`
            : `You understand English well and can communicate in most everyday situations. You are ready to start focused ${goal} preparation.`}
        </p>

        <div className="mt-6 rounded-xl border border-[#c9972c]/30 bg-[#c9972c]/10 p-4">
          {purchasedMeta && programme === "ielts" ? (
            <>
              <p className="text-xs font-bold uppercase tracking-wide text-[#c9972c]">
                Speakify recommends
              </p>
              <p className="mt-2 text-lg font-bold text-[#0d1b35]">
                IELTS {purchasedMeta.name}
              </p>
              <p className="mt-1 text-sm font-semibold text-[#0d1b35]">{purchasedMeta.price}</p>
              <p className="mt-1 text-sm text-slate-600">Target: {purchasedMeta.target}</p>
              <p className="text-sm text-slate-600">
                Duration: {purchasedMeta.weekCount} weeks
              </p>
              <p className="mt-3 text-xs text-slate-500">
                Placement estimate: Band {placementBand.toFixed(1)} — used to personalise your
                daily tasks, not to change your tier.
              </p>
            </>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-wide text-[#c9972c]">
                Speakify recommends
              </p>
              <RecommendationDetails recommendation={recommendation} />
            </>
          )}
        </div>

        {!purchasedMeta && recommendation.kind === "ielts" && (
          <p className="mt-4 text-xs text-slate-500">
            94% of students at your level who complete IELTS Plus reach Band 6.0 or above.
          </p>
        )}

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        <button
          type="button"
          disabled={saving}
          onClick={finishOnboarding}
          className="mt-6 w-full rounded-xl py-3.5 text-sm font-bold text-[#0d1b35] disabled:opacity-60"
          style={{ backgroundColor: GOLD }}
        >
          {saving
            ? "Saving…"
            : purchasedMeta
              ? `Continue with recommended ${purchasedMeta.name} →`
              : programme === "ielts"
                ? "Confirm & continue →"
                : "Confirm my track →"}
        </button>
        {purchasedMeta ? (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center text-xs text-slate-500 underline"
          >
            Need to change your plan? Chat with support
          </a>
        ) : (
          <button
            type="button"
            className="mt-3 w-full text-center text-xs text-slate-500 underline"
            onClick={() => {
              setSkipPurchasedAutoStart(true);
              setAutoStarted(false);
              setProgramme(null);
              setRecommendation(null);
              setPlacementBand(null);
              setAssessmentDone(false);
              setStep(1);
            }}
          >
            I want a different track
          </button>
        )}
      </Shell>
    );
  }

  if (step === 4 && recommendation && placementBand != null && programme) {
    const target =
      purchasedTrack && programme === "ielts"
        ? targetBandDisplayFromTrack(purchasedTrack)
        : targetBandFromRecommendation(programme, placementBand, recommendation);
    const programmeLabel =
      purchasedMeta && programme === "ielts"
        ? `IELTS ${purchasedMeta.name}`
        : recommendationProgrammeLabel(recommendation);
    const name = firstName(session?.user?.name);

    return (
      <Shell step={4}>
        <h1 className="text-2xl font-bold text-[#0d1b35]">You are all set, {name}!</h1>
        <ul className="mt-6 space-y-3 text-sm text-slate-700">
          <li>✅ Your level: {cefrLevel} {cefrLabel}</li>
          <li>✅ Your programme: {programmeLabel}</li>
          <li>✅ Your target: {target}</li>
          <li>
            {needsPayment && programme === "ielts"
              ? "🔒 Complete payment to unlock your dashboard"
              : "✅ Your dashboard is personalised and ready"}
          </li>
        </ul>
        <p className="mt-6 text-sm leading-relaxed text-slate-600">
          {needsPayment && programme === "ielts"
            ? "Your placement results and study plan are saved. Pay once to unlock daily practice, mocks, and AI feedback."
            : "Every lesson, every practice session, and every mock exam is now calibrated to your exact level and your target band score."}
        </p>
        <button
          type="button"
          onClick={enterDashboard}
          className="mt-8 w-full rounded-xl py-4 text-base font-bold text-[#0d1b35]"
          style={{ backgroundColor: GOLD }}
        >
          {needsPayment && programme === "ielts"
            ? "Continue to payment →"
            : "Enter my dashboard →"}
        </button>
      </Shell>
    );
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center text-white"
      style={{ backgroundColor: NAVY }}
    >
      <span
        className="h-10 w-10 animate-spin rounded-full border-4 border-t-transparent"
        style={{ borderColor: `${GOLD}40`, borderTopColor: GOLD }}
      />
    </div>
  );
}
