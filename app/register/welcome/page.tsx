"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useSession } from "next-auth/react";
import { normalizeProgramType, studentDashboardPath } from "@/lib/programType";
import {
  getRegistrationProgram,
  isRegistrationSlug,
} from "@/lib/registration";

function CheckmarkIcon({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-[#c9972c]/15 ${className ?? ""}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-14 w-14 text-[#c9972c]"
        aria-hidden
      >
        <path d="M20 6L9 17l-5-5" />
      </svg>
    </div>
  );
}

function WelcomeContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const nameFromUrl = searchParams.get("name")?.trim();
  const nameFromSession = session?.user?.name?.trim();
  const studentName = nameFromUrl || nameFromSession || "there";

  const programParam = searchParams.get("program")?.trim() ?? "ielts";
  const registrationProgram = isRegistrationSlug(programParam)
    ? getRegistrationProgram(programParam)
    : getRegistrationProgram(normalizeProgramType(programParam) === "pathway" ? "pathway" : "ielts");

  const programType = normalizeProgramType(registrationProgram.programType);
  const isPathway = programType === "pathway";
  const isToefl = registrationProgram.slug === "toefl";
  const programLabel = registrationProgram.label;
  const dashboardPath =
    registrationProgram.dashboardPath ?? studentDashboardPath(programType);
  const isStep = registrationProgram.slug === "step-test";
  const accentClass = isPathway
    ? "bg-[#0d9488]/20 text-[#0d9488]"
    : isStep
      ? "bg-emerald-500/20 text-emerald-400"
      : isToefl
      ? "bg-blue-500/20 text-blue-400"
      : "bg-[#c9972c]/20 text-[#c9972c]";

  const whatsappRaw =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || "966500000000";
  const whatsappDigits = whatsappRaw.replace(/\D/g, "");
  const whatsappHref = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
    `Hi Speakify, I just registered for ${programLabel} and would like help with my learning plan.`
  )}`;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0d1b35] px-4 py-12">
      <div className="w-full max-w-lg text-center">
        <CheckmarkIcon className="mx-auto h-28 w-28" />

        <h1 className="mt-8 text-3xl font-bold text-white sm:text-4xl">
          Welcome to Speakify!
        </h1>

        <p className="mt-3 text-xl font-semibold text-[#c9972c]">
          {studentName === "there" ? "Hello there" : `Hello, ${studentName}`}
        </p>

        <p className={`mt-4 inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${accentClass}`}>
          {programLabel}
        </p>

        <p className="mt-6 text-base leading-relaxed text-slate-300">
          {isPathway
            ? "Your English Pathway account is ready. Sign in and take the one-time placement test to find your CEFR starting level."
            : isToefl
              ? "Your TOEFL Preparation account is ready. Sign in to access practice tests, skill tracking, and your personalised study plan."
              : "Your IELTS Accelerator account is ready. Sign in to access mock exams, band tracking, and your personalised study plan."}
        </p>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-center">
          {isPathway ? (
            <>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent("/placement-test")}`}
                className="inline-flex items-center justify-center rounded-xl bg-[#0d9488] px-8 py-3.5 text-base font-bold text-white shadow-lg transition-opacity hover:opacity-95"
              >
                Sign In & Take Placement Test
              </Link>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(dashboardPath)}`}
                className="inline-flex items-center justify-center rounded-xl border-2 border-[#0d9488] bg-transparent px-8 py-3.5 text-base font-bold text-[#0d9488] transition-colors hover:bg-[#0d9488]/10"
              >
                Sign In to Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent("/mock-test/exam")}`}
                className="inline-flex items-center justify-center rounded-xl bg-[#c9972c] px-8 py-3.5 text-base font-bold text-[#0d1b35] shadow-lg transition-opacity hover:opacity-95"
              >
                Sign In & Start Mock Exam
              </Link>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(dashboardPath)}`}
                className="inline-flex items-center justify-center rounded-xl border-2 border-[#c9972c] bg-transparent px-8 py-3.5 text-base font-bold text-[#c9972c] transition-colors hover:bg-[#c9972c]/10"
              >
                Sign In to Dashboard
              </Link>
            </>
          )}
        </div>

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-[#25D366]/50 bg-[#25D366]/10 px-6 py-3 text-sm font-semibold text-[#25D366] transition-colors hover:bg-[#25D366]/20"
        >
          <span aria-hidden>💬</span>
          Chat with us on WhatsApp
        </a>

        <p className="mt-8 text-sm text-slate-500">
          <Link
            href={`/login?callbackUrl=${encodeURIComponent(dashboardPath)}`}
            className="font-medium text-[#c9972c] hover:underline"
          >
            Sign in with your new account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterWelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0d1b35]">
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
