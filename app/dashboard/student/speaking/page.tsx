"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";

type PartLimit = {
  used: number;
  max: number;
  remaining: number;
  canTake: boolean;
};

type SpeakingDailyLimit = {
  unlimited?: boolean;
  part1: PartLimit;
  part2: PartLimit;
  part3: PartLimit;
  mock: PartLimit;
};

type SpeakingTrackerSummary = {
  hasData: boolean;
  bandFC: number | null;
  bandLR: number | null;
  bandGRA: number | null;
  bandP: number | null;
  bandOverall: number | null;
};

type MicPermission = "checking" | "granted" | "prompt" | "denied" | "unsupported";

function MicrophoneIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Z" />
      <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.92V19H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-1.08A7 7 0 0 0 19 11Z" />
    </svg>
  );
}

function MessageCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

function FileTextIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" />
    </svg>
  );
}

function MessagesIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /><path d="M8 10h8M8 14h5" />
    </svg>
  );
}

function CertificateIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden>
      <circle cx="12" cy="8" r="6" /><path d="M8.21 13.89 7 23l5-3 5 3-1.21-9.12" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className} aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function formatBand(value: number | null) {
  if (value === null || !Number.isFinite(value)) return "—";
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function LimitBar({
  used,
  max,
  label,
  dark = false,
}: {
  used: number;
  max: number;
  label: string;
  dark?: boolean;
}) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  return (
    <div className="mt-4">
      <p className={`text-xs ${dark ? "text-slate-300" : "text-slate-500"}`}>
        {used} of {max} {label}
      </p>
      <div className={`mt-2 h-1.5 w-full overflow-hidden rounded-full ${dark ? "bg-white/20" : "bg-slate-100"}`}>
        <div
          className="h-full rounded-full bg-[#c9972c] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FeaturePills({ items, dark = false }: { items: string[]; dark?: boolean }) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            dark ? "bg-white/10 text-slate-200" : "bg-slate-100 text-slate-600"
          }`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function ModeCard({
  borderColor,
  icon,
  badge,
  title,
  description,
  features,
  limitUsed,
  limitMax,
  limitLabel,
  buttonLabel,
  buttonClass,
  href,
  atLimit,
  dark = false,
}: {
  borderColor: string;
  icon: ReactNode;
  badge: string;
  title: string;
  description: string;
  features: string[];
  limitUsed: number;
  limitMax: number;
  limitLabel: string;
  buttonLabel: string;
  buttonClass: string;
  href: string;
  atLimit: boolean;
  dark?: boolean;
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border p-6 shadow-sm ${
        dark
          ? "border-[#0d1b35] bg-[#0d1b35] text-white"
          : "border-slate-200 bg-white"
      }`}
      style={{ borderLeftWidth: 4, borderLeftColor: borderColor }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center">{icon}</div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            dark ? "bg-[#c9972c]/20 text-[#c9972c]" : "bg-[#0d1b35]/10 text-[#0d1b35]"
          }`}
        >
          {badge}
        </span>
      </div>
      <h2 className={`mt-4 text-lg font-bold ${dark ? "text-white" : "text-[#0d1b35]"}`}>
        {title}
      </h2>
      <p className={`mt-2 flex-1 text-sm leading-relaxed ${dark ? "text-slate-300" : "text-slate-600"}`}>
        {description}
      </p>
      <FeaturePills items={features} dark={dark} />
      <LimitBar used={limitUsed} max={limitMax} label={limitLabel} dark={dark} />
      {atLimit ? (
        <span
          className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-bold ${buttonClass} cursor-not-allowed opacity-60`}
        >
          Limit Reached Today
        </span>
      ) : (
        <Link
          href={href}
          className={`mt-6 block w-full rounded-xl py-3 text-center text-sm font-bold transition-colors ${buttonClass}`}
        >
          {buttonLabel}
        </Link>
      )}
    </div>
  );
}

function CriterionCard({
  short,
  full,
  band,
  hasData,
}: {
  short: string;
  full: string;
  band: number | null;
  hasData: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-sm font-bold text-[#0d1b35]">{short}</p>
      <p className="mt-0.5 text-xs text-slate-500">{full}</p>
      <p className="mt-3 text-3xl font-bold text-[#c9972c]">
        {hasData ? formatBand(band) : "—"}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
        avg. band
      </p>
    </div>
  );
}

export default function SpeakingHomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { isPathway, base, usesProgramShell } = usePathwayStudentContext();
  const studentId = (session?.user as { id?: string })?.id ?? "";

  const [micPermission, setMicPermission] = useState<MicPermission>("checking");
  const [dailyLimit, setDailyLimit] = useState<SpeakingDailyLimit | null>(null);
  const [tracker, setTracker] = useState<SpeakingTrackerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const checkMicPermission = useCallback(async () => {
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicPermission("unsupported");
      return;
    }

    try {
      if (navigator.permissions?.query) {
        const result = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });
        if (result.state === "granted") {
          setMicPermission("granted");
          return;
        }
        if (result.state === "denied") {
          setMicPermission("denied");
          return;
        }
        setMicPermission("prompt");
        result.onchange = () => {
          setMicPermission(
            result.state === "granted"
              ? "granted"
              : result.state === "denied"
                ? "denied"
                : "prompt"
          );
        };
        return;
      }
      setMicPermission("prompt");
    } catch {
      setMicPermission("prompt");
    }
  }, []);

  const enableMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setMicPermission("granted");
    } catch {
      setMicPermission("denied");
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    checkMicPermission();
  }, [checkMicPermission]);

  useEffect(() => {
    if (status !== "authenticated" || !studentId) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [limitRes, trackerRes] = await Promise.all([
          fetch(`/api/speaking/daily-limit?studentId=${encodeURIComponent(studentId)}`),
          fetch(`/api/speaking/tracker?studentId=${encodeURIComponent(studentId)}`),
        ]);
        const limitData = await limitRes.json().catch(() => null);
        const trackerData = await trackerRes.json().catch(() => null);

        if (!cancelled) {
          if (limitRes.ok && limitData) {
            setDailyLimit(limitData as SpeakingDailyLimit);
          }
          if (trackerRes.ok && trackerData) {
            setTracker(trackerData as SpeakingTrackerSummary);
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [status, studentId]);

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  const showMicBanner =
    micPermission === "prompt" || micPermission === "denied";

  const part1 = dailyLimit?.part1 ?? { used: 0, max: 10, remaining: 10, canTake: true };
  const part2 = dailyLimit?.part2 ?? { used: 0, max: 10, remaining: 10, canTake: true };
  const part3 = dailyLimit?.part3 ?? { used: 0, max: 10, remaining: 10, canTake: true };
  const mock = dailyLimit?.mock ?? { used: 0, max: 5, remaining: 5, canTake: true };
  const unlimited = dailyLimit?.unlimited ?? false;

  const hasTrackerData = tracker?.hasData ?? false;

  return (
    <div className="flex min-h-screen bg-white">
      {!usesProgramShell ? <StudentSidebar activePage="speaking" /> : null}

      <main
        className={`min-h-screen flex-1 bg-slate-50 ${usesProgramShell ? "" : "ml-[200px]"}`}
      >
        {showMicBanner ? (
          <div className="border-b border-[#c9972c]/30 bg-[#c9972c]/10 px-6 py-4">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <MicrophoneIcon className="h-8 w-8 shrink-0 text-[#c9972c]" />
                <p className="text-sm font-medium text-[#0d1b35]">
                  Microphone access is required for speaking practice.
                </p>
              </div>
              <button
                type="button"
                onClick={enableMicrophone}
                className="rounded-xl bg-[#c9972c] px-5 py-2 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]"
              >
                Enable Microphone
              </button>
            </div>
          </div>
        ) : null}

        <div className="mx-auto max-w-6xl px-6 py-8">
          <header>
            <h1 className="text-[28px] font-bold text-[#0d1b35]">
              {isPathway ? "Speaking Practice" : "IELTS Academic Speaking"}
            </h1>
            <p className="mt-2 text-base text-slate-500">
              {isPathway
                ? "Build fluency with guided speaking tasks and instant feedback"
                : "Practice all 3 parts with real voice recording and AI-powered band score feedback"}
            </p>
          </header>

          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ModeCard
              borderColor="#c9972c"
              icon={<MessageCircleIcon className="h-8 w-8 text-[#c9972c]" />}
              badge="4-5 minutes"
              title="Part 1 — Introduction"
              description={
                isPathway
                  ? "Answer questions on familiar topics. Record your voice and get feedback on fluency, vocabulary, grammar and pronunciation."
                  : "Answer questions on familiar topics. Record your voice and get instant band score feedback on fluency, vocabulary, grammar and pronunciation."
              }
              features={
                isPathway
                  ? ["🎤 Voice recording", "⚡ Instant feedback", "📊 Progress tracking"]
                  : ["🎤 Voice recording", "⚡ Instant feedback", "📊 Band score"]
              }
              limitUsed={unlimited ? 0 : part1.used}
              limitMax={part1.max}
              limitLabel="sessions today"
              buttonLabel="Start Part 1"
              buttonClass="bg-[#c9972c] text-[#0d1b35] hover:bg-[#b8862b]"
              href={`${base}/speaking/part1`}
              atLimit={!unlimited && !part1.canTake}
            />
            <ModeCard
              borderColor="#0d9488"
              icon={<FileTextIcon className="h-8 w-8 text-[#0d9488]" />}
              badge="3-4 minutes"
              title="Part 2 — Cue Card"
              description="Get a topic card and 1 minute to prepare. Then speak for 1-2 minutes. AI evaluates your extended speaking ability."
              features={["⏱ 60 sec prep", "🎤 2 min speaking", "📝 Model answer"]}
              limitUsed={unlimited ? 0 : part2.used}
              limitMax={part2.max}
              limitLabel="sessions today"
              buttonLabel="Start Part 2"
              buttonClass="bg-[#0d9488] text-white hover:bg-[#0b7c72]"
              href={`${base}/speaking/part2`}
              atLimit={!unlimited && !part2.canTake}
            />
            <ModeCard
              borderColor="#7c3aed"
              icon={<MessagesIcon className="h-8 w-8 text-[#7c3aed]" />}
              badge="4-5 minutes"
              title="Part 3 — Discussion"
              description="Discuss abstract ideas and opinions on academic topics. Tests your ability to analyse and express complex thoughts in English."
              features={["💭 Abstract topics", "🔄 4 questions", "🎯 Analysis skills"]}
              limitUsed={unlimited ? 0 : part3.used}
              limitMax={part3.max}
              limitLabel="sessions today"
              buttonLabel="Start Part 3"
              buttonClass="bg-[#7c3aed] text-white hover:bg-[#6d28d9]"
              href={`${base}/speaking/part3`}
              atLimit={!unlimited && !part3.canTake}
            />
            {!isPathway ? (
            <ModeCard
              borderColor="#c9972c"
              dark
              icon={<CertificateIcon className="h-8 w-8 text-[#c9972c]" />}
              badge="11-14 minutes"
              title="Full Speaking Mock Test"
              description="Complete all 3 parts in sequence just like the real IELTS exam. Get a full band score report across all criteria."
              features={["✓ All 3 parts", "✓ Official criteria", "✓ Complete report"]}
              limitUsed={unlimited ? 0 : mock.used}
              limitMax={mock.max}
              limitLabel="mock tests today"
              buttonLabel="Start Full Mock"
              buttonClass="bg-[#c9972c] text-[#0d1b35] hover:bg-[#b8862b]"
              href={`${base}/speaking/mock`}
              atLimit={!unlimited && !mock.canTake}
            />
            ) : null}
          </div>

          {!isPathway ? (
          <section className="mt-10">
            <h2 className="text-lg font-bold text-[#0d1b35]">Your Speaking Performance</h2>
            <p className="mt-1 text-sm text-slate-500">Based on your practice history</p>
            {loading ? (
              <p className="mt-6 text-center text-sm text-slate-500">Loading scores…</p>
            ) : !hasTrackerData ? (
              <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
                Start practicing to see your scores
              </p>
            ) : (
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <CriterionCard short="FC" full="Fluency & Coherence" band={tracker?.bandFC ?? null} hasData />
                <CriterionCard short="LR" full="Lexical Resource" band={tracker?.bandLR ?? null} hasData />
                <CriterionCard short="GRA" full="Grammatical Range" band={tracker?.bandGRA ?? null} hasData />
                <CriterionCard short="P" full="Pronunciation" band={tracker?.bandP ?? null} hasData />
              </div>
            )}
          </section>
          ) : (
          <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#0d1b35]">Your speaking progress</h2>
            <p className="mt-2 text-sm text-slate-500">
              Complete speaking tasks to track your fluency and confidence over time.
            </p>
          </section>
          )}

          <section className="mt-10 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[#0d1b35]">How Speaking Practice Works</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              {[
                {
                  step: "1",
                  title: "Read the question",
                  text: "A question or cue card appears on screen",
                },
                {
                  step: "2",
                  title: "Record your answer",
                  text: "Click record and speak naturally into your microphone",
                },
                {
                  step: "3",
                  title: "Get instant feedback",
                  text: isPathway
                    ? "AI evaluates your response and gives clear English feedback"
                    : "AI evaluates your response using official IELTS criteria",
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#c9972c] text-sm font-bold text-[#0d1b35]">
                    {item.step}
                  </span>
                  <h3 className="mt-3 font-bold text-[#0d1b35]">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-500">{item.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-xl border border-[#c9972c]/30 bg-[#c9972c]/10 p-6">
            <h2 className="text-lg font-bold text-[#0d1b35]">Tips for best results</h2>
            <ul className="mt-4 space-y-3">
              {[
                "Use headphones to avoid echo during recording",
                "Speak at a natural pace — not too fast or too slow",
                "Try to speak for the full recommended time",
              ].map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-slate-700">
                  <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-[#c9972c]" />
                  {tip}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
