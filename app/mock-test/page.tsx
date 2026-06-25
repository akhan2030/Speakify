"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { formatWhatsAppDisplay } from "@/lib/placement/certificate";

/** Official Speakify GLC WhatsApp support line */
const SPEAKIFY_WHATSAPP_NUMBER = "966556004488";

const DIFFERENTIATORS = [
  "Real IELTS timing, structure and question types",
  "Multi-accent audio — British, Australian, American",
  "AI scores instantly — human examiner validates the result",
  "Confidence score: Band 6.5 · Range 6.0–7.0 · Confidence 91%",
  "Full examiner report — not just a number, a complete diagnosis",
];

const PLANS = [
  {
    id: "single",
    name: "Single Mock",
    price: "169",
    period: "SAR",
    description: "One full Academic mock exam",
    features: [
      "All 4 skills included",
      "AI scoring on every section",
      "Band prediction",
      "Detailed PDF report",
    ],
    popular: false,
    buttonLabel: "Choose Single Mock",
    buttonNavy: false,
  },
  {
    id: "pack3",
    name: "3-Mock Pack",
    price: "349",
    period: "SAR",
    description: "Best value for serious prep",
    features: [
      "Everything in Single Mock",
      "3 full mock attempts",
      "Progress tracking across attempts",
      "Skill trend analysis",
    ],
    popular: true,
    buttonLabel: "Choose 3-Mock Pack",
    buttonNavy: false,
  },
  {
    id: "pack5",
    name: "5-Mock Pack",
    price: "649",
    period: "SAR",
    description: "Serious preparation — track your progress",
    features: [
      "5 full Academic mock exams",
      "Progress tracking across all attempts",
      "Band trend analysis (improving/declining)",
      "Priority human review on Writing + Speaking",
      "Personalized study plan after each attempt",
      "Valid for 6 months",
    ],
    popular: false,
    buttonLabel: "Choose 5-Mock Pack",
    buttonNavy: true,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I scored 7.0 in my real IELTS — exactly what Speakify predicted. I couldn't believe how accurate it was.",
    name: "Khalid M.",
    city: "Riyadh",
  },
  {
    quote:
      "The examiner report showed me exactly what to fix. My Writing went from 5.5 to 7.0 in 3 weeks.",
    name: "Sara A.",
    city: "Jeddah",
  },
  {
    quote:
      "The listening audio felt exactly like the real test. Different accents, realistic topics. Best mock I've done.",
    name: "Mohammed F.",
    city: "Dammam",
  },
];

const SAMPLE_SKILLS = [
  { skill: "Listening", band: 6.5 },
  { skill: "Reading", band: 6.0 },
  { skill: "Writing", band: 5.5 },
  { skill: "Speaking", band: 6.0 },
];

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-[#c9972c]"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

export default function MockTestLandingPage() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const displayName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "Student";

  const whatsappRaw =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.trim() || SPEAKIFY_WHATSAPP_NUMBER;
  const whatsappDisplay = formatWhatsAppDisplay(whatsappRaw);
  const whatsappHref = `https://wa.me/${whatsappRaw.replace(/\D/g, "")}?text=${encodeURIComponent(
    "Hi Speakify, I have questions about the IELTS Academic Mock Exam."
  )}`;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-[#0d1b35] px-6 py-16 text-center sm:px-10 sm:py-20">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#c9972c]">
          Speakify
        </p>
        <h1 className="mx-auto mt-4 max-w-3xl text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
          Speakify IELTS Academic Mock Exam
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-slate-300 sm:text-lg">
          Full IELTS simulation. AI + Human evaluation. Trusted band prediction.
        </p>
        <Link
          href="/mock-test/exam"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#c9972c] px-8 py-3.5 text-base font-bold text-[#0d1b35] shadow-lg transition hover:opacity-95"
        >
          Start Your Mock Test →
        </Link>
      </header>

      <div className="bg-[#0d1b35] px-6 py-5 text-center">
        <p className="mx-auto max-w-3xl text-sm font-semibold leading-relaxed text-[#c9972c] sm:text-base">
          Every Writing and Speaking result is reviewed by a certified Speakify
          IELTS trainer before your final score is released.
        </p>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <section>
          <h2 className="text-center text-2xl font-bold text-[#0d1b35] sm:text-3xl">
            Choose your plan
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-600">
            Full Academic mock exams with AI scoring and examiner-style feedback.
          </p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PLANS.map((plan) => (
              <article
                key={plan.id}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                  plan.popular
                    ? "border-[#c9972c] ring-2 ring-[#c9972c]/30"
                    : "border-slate-200"
                }`}
              >
                {plan.popular ? (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#c9972c] px-4 py-1 text-xs font-bold uppercase tracking-wide text-[#0d1b35]">
                    Most popular
                  </span>
                ) : null}
                <h3 className="text-lg font-bold text-[#0d1b35]">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                <p className="mt-4">
                  <span className="text-4xl font-extrabold text-[#c9972c]">
                    {plan.price}
                  </span>{" "}
                  <span className="text-sm font-medium text-slate-600">
                    {plan.period}
                  </span>
                </p>
                <ul className="mt-6 flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-slate-700"
                    >
                      <CheckIcon />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/mock-test/exam?plan=${plan.id}`)}`}
                  className={`mt-8 block rounded-xl py-3 text-center text-sm font-bold transition ${
                    plan.popular
                      ? "bg-[#c9972c] text-[#0d1b35] hover:opacity-95"
                      : plan.buttonNavy
                        ? "bg-[#0d1b35] text-white hover:bg-[#152a4d]"
                        : "border-2 border-[#0d1b35] text-[#0d1b35] hover:bg-[#0d1b35]/5"
                  }`}
                >
                  {plan.buttonLabel}
                </Link>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-20 rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-10">
          <h2 className="text-2xl font-bold text-[#0d1b35]">
            What makes Speakify different
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {DIFFERENTIATORS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 rounded-xl bg-[#0d1b35]/5 px-4 py-3 text-sm font-medium text-[#0d1b35]"
              >
                <span className="text-[#c9972c]" aria-hidden>
                  ★
                </span>
                {point}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-20">
          <h2 className="text-center text-2xl font-bold text-[#0d1b35]">
            Sample report preview
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-sm text-slate-600">
            Every mock includes a detailed breakdown — here is what students
            receive after completion.
          </p>
          <div className="mx-auto mt-8 max-w-2xl overflow-hidden rounded-2xl border-2 border-[#c9972c]/40 bg-white shadow-lg">
            <div className="bg-[#0d1b35] px-6 py-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#c9972c]">
                Mock Exam Report
              </p>
              <p className="mt-1 text-3xl font-extrabold text-white">6.0</p>
              <p className="text-xs text-slate-300">
                Predicted overall band · Confidence 87% (5.5–6.5)
              </p>
            </div>
            <div className="px-6 py-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="pb-2 font-bold">Skill</th>
                    <th className="pb-2 text-right font-bold">Band</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_SKILLS.map((row) => (
                    <tr key={row.skill} className="border-b border-slate-100">
                      <td className="py-2.5 font-medium text-[#0d1b35]">
                        {row.skill}
                      </td>
                      <td className="py-2.5 text-right font-bold text-[#c9972c]">
                        {row.band.toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-xs text-amber-900">
                <p className="font-bold">Examiner note</p>
                <p className="mt-1 leading-relaxed">
                  Writing Task 2 shows good ideas but needs stronger paragraph
                  structure. Speaking fluency is solid — focus on lexical
                  range for Band 6.5+.
                </p>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c9972c]/15 px-3 py-1.5 text-xs font-bold text-[#0d1b35]">
                  ✓ Reviewed by certified IELTS trainer
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-600">
                Your 4-week study plan is included with every report
              </p>
              <p className="mt-2 text-xs font-semibold text-[#c9972c]">
                Report delivered within 24 hours of exam completion
              </p>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-center text-2xl font-bold text-[#0d1b35]">
            What students say
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <blockquote
                key={t.name}
                className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="flex-1 text-sm leading-relaxed text-slate-700">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="mt-4 text-sm font-bold text-[#0d1b35]">
                  — {t.name}, {t.city}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="mt-16 flex flex-col items-center gap-4 text-center">
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[#25D366] bg-[#25D366]/10 px-6 py-3 text-sm font-bold text-[#128C7E] transition hover:bg-[#25D366]/20"
          >
            <span aria-hidden>💬</span>
            Questions? Chat with us — {whatsappDisplay}
          </a>
          {isLoggedIn ? (
            <>
              <p className="text-sm font-semibold text-[#0d1b35]">
                Welcome back, {displayName} — you&apos;re ready to begin
              </p>
              <Link
                href="/mock-test/exam"
                className="inline-flex items-center justify-center rounded-xl bg-[#c9972c] px-8 py-3.5 text-sm font-bold text-[#0d1b35] shadow-md transition hover:bg-[#d4a84a]"
              >
                Start Your Mock Test →
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/mock-test/exam"
                className="inline-flex items-center justify-center rounded-xl bg-[#0d1b35] px-8 py-3.5 text-sm font-bold text-white transition hover:bg-[#152a4d]"
              >
                Start Your Mock Test →
              </Link>
              <p className="text-xs text-slate-500">
                Sign in required ·{" "}
                <Link
                  href="/register"
                  className="font-semibold text-[#0d9488] hover:underline"
                >
                  Create a free account
                </Link>
              </p>
            </>
          )}
          <p className="text-sm font-medium text-slate-600">
            Single Mock: 169 SAR · 3-Mock Pack: 349 SAR · 5-Mock Pack: 649 SAR
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-6 text-center text-xs text-slate-500">
        © {new Date().getFullYear()} Speakify Global Language Center · IELTS
        Academic Mock Exam
      </footer>
    </div>
  );
}
