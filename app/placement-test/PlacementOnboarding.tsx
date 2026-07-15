"use client";

import Link from "next/link";
import SpeakifyWay from "@/components/SpeakifyWay";
import { useState } from "react";
import {
  DEADLINE_OPTIONS,
  EDUCATION_LEVELS,
  EMPTY_ONBOARDING,
  IELTS_MODULE_OPTIONS,
  IELTS_PURPOSES,
  TARGET_BAND_OPTIONS,
  validateOnboardingStep1,
  validateOnboardingStep2,
  type PlacementOnboarding,
} from "@/lib/placement/onboarding";

type Props = {
  initial?: Partial<PlacementOnboarding>;
  onStart: (profile: PlacementOnboarding) => void;
};

const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white placeholder:text-slate-400 focus:border-[#c9972c] focus:outline-none focus:ring-1 focus:ring-[#c9972c]";

const labelClass = "block text-sm font-medium text-slate-200";

export default function PlacementOnboarding({ initial, onStart }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<PlacementOnboarding>({
    ...EMPTY_ONBOARDING,
    ...initial,
  });
  const [error, setError] = useState<string | null>(null);
  const [useCustomDate, setUseCustomDate] = useState(
    initial?.scoreDeadline?.includes("-") ?? false
  );
  const [customDate, setCustomDate] = useState(
    initial?.scoreDeadline?.includes("-") ? initial.scoreDeadline : ""
  );

  const patch = (partial: Partial<PlacementOnboarding>) => {
    setForm((prev) => ({ ...prev, ...partial }));
    setError(null);
  };

  const goStep2 = () => {
    const err = validateOnboardingStep1(form);
    if (err) {
      setError(err);
      return;
    }
    setStep(2);
  };

  const submit = () => {
    const deadline =
      form.scoreDeadline === "custom_date"
        ? customDate
        : form.scoreDeadline;
    const payload = { ...form, scoreDeadline: deadline };
    const err = validateOnboardingStep2(payload);
    if (err) {
      setError(err);
      return;
    }
    onStart(payload);
  };

  return (
    <div className="min-h-screen bg-[#0d1b35] text-white">
      <header className="px-6 py-6 sm:px-10">
        <p className="text-2xl font-extrabold tracking-tight text-[#c9972c]">
          Speakify
        </p>
        <div className="mt-4 flex gap-2">
          <span
            className={`h-1.5 flex-1 rounded-full ${step >= 1 ? "bg-[#c9972c]" : "bg-white/20"}`}
          />
          <span
            className={`h-1.5 flex-1 rounded-full ${step >= 2 ? "bg-[#c9972c]" : "bg-white/20"}`}
          />
        </div>
        <p className="mt-2 text-xs text-slate-400">Step {step} of 2</p>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-6 pb-16 pt-4 lg:grid-cols-2 lg:items-start">
        <SpeakifyWay variant="hero" className="hidden lg:block" />

        <div>
        {step === 1 ? (
          <>
            <h1 className="text-2xl font-bold text-white sm:text-3xl">
              Before we begin — tell us about yourself
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              35 adaptive questions • 15–25 minutes
            </p>

            <div className="mt-8 space-y-5 text-left">
              <div>
                <label className={labelClass}>
                  Full Name <span className="text-[#c9972c]">*</span>
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => patch({ fullName: e.target.value })}
                  className={inputClass}
                  placeholder="Your full name"
                  autoComplete="name"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Email address <span className="text-[#c9972c]">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => patch({ email: e.target.value })}
                  className={inputClass}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className={labelClass}>Phone number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => patch({ phone: e.target.value })}
                  className={inputClass}
                  placeholder="+966 5XX XXX XXXX"
                  autoComplete="tel"
                />
                <p className="mt-1 text-xs text-slate-400">
                  To receive your results via WhatsApp
                </p>
              </div>

              <div>
                <label className={labelClass}>
                  Current Education Level{" "}
                  <span className="text-[#c9972c]">*</span>
                </label>
                <select
                  value={form.educationLevel}
                  onChange={(e) => patch({ educationLevel: e.target.value })}
                  className={inputClass}
                >
                  <option value="" className="text-[#0d1b35]">
                    Select level
                  </option>
                  {EDUCATION_LEVELS.map((level) => (
                    <option key={level} value={level} className="text-[#0d1b35]">
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Field of Study <span className="text-[#c9972c]">*</span>
                </label>
                <input
                  type="text"
                  value={form.fieldOfStudy}
                  onChange={(e) => patch({ fieldOfStudy: e.target.value })}
                  className={inputClass}
                  placeholder="e.g. Engineering, Medicine, Business"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={goStep2}
              className="mt-10 w-full rounded-xl bg-[#c9972c] px-8 py-4 text-lg font-bold text-[#0d1b35] hover:opacity-95"
            >
              Continue →
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-sm text-[#0d9488] hover:underline"
            >
              ← Back
            </button>
            <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">
              What&apos;s your IELTS goal?
            </h1>

            <div className="mt-8 space-y-5 text-left">
              <div>
                <label className={labelClass}>
                  Which IELTS test are you preparing for?{" "}
                  <span className="text-[#c9972c]">*</span>
                </label>
                <div className="mt-2 space-y-2">
                  {IELTS_MODULE_OPTIONS.map((option) => {
                    const selected = form.ieltsModule === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => patch({ ieltsModule: option.value })}
                        className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${
                          selected
                            ? "border-[#c9972c] bg-[#c9972c]/15"
                            : "border-white/20 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <p className="text-sm font-semibold text-white">{option.label}</p>
                        <p className="mt-0.5 text-xs text-slate-400">{option.hint}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Purpose <span className="text-[#c9972c]">*</span>
                </label>
                <select
                  value={form.ieltsPurpose}
                  onChange={(e) => patch({ ieltsPurpose: e.target.value })}
                  className={inputClass}
                >
                  <option value="" className="text-[#0d1b35]">
                    Select purpose
                  </option>
                  {IELTS_PURPOSES.map((p) => (
                    <option key={p} value={p} className="text-[#0d1b35]">
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Required Band Score <span className="text-[#c9972c]">*</span>
                </label>
                <select
                  value={form.targetBandScore}
                  onChange={(e) => patch({ targetBandScore: e.target.value })}
                  className={inputClass}
                >
                  <option value="" className="text-[#0d1b35]">
                    Select target band
                  </option>
                  {TARGET_BAND_OPTIONS.map((b) => (
                    <option key={b} value={b} className="text-[#0d1b35]">
                      {b}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  When do you need this score?{" "}
                  <span className="text-[#c9972c]">*</span>
                </label>
                <select
                  value={useCustomDate ? "custom_date" : form.scoreDeadline}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "custom_date") {
                      setUseCustomDate(true);
                      patch({ scoreDeadline: "custom_date" });
                    } else {
                      setUseCustomDate(false);
                      patch({ scoreDeadline: v });
                    }
                  }}
                  className={inputClass}
                >
                  <option value="" className="text-[#0d1b35]">
                    Select deadline
                  </option>
                  {DEADLINE_OPTIONS.map((d) => (
                    <option key={d.value} value={d.value} className="text-[#0d1b35]">
                      {d.label}
                    </option>
                  ))}
                </select>
                {useCustomDate ? (
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className={`${inputClass} mt-3`}
                    min={new Date().toISOString().slice(0, 10)}
                  />
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={submit}
              className="mt-10 w-full rounded-xl bg-[#c9972c] px-8 py-4 text-lg font-bold text-[#0d1b35] shadow-lg hover:opacity-95"
            >
              Start My Placement Test
            </button>
            <p className="mt-4 text-center text-xs text-[#c9972c]">
              We start easy — don&apos;t worry if the first questions feel simple
            </p>
          </>
        )}

        {error ? (
          <p className="mt-4 rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <Link
          href="/login"
          className="mt-8 block text-center text-sm text-[#0d9488] hover:underline"
        >
          Already have an account? Sign in
        </Link>
        </div>
      </main>
    </div>
  );
}