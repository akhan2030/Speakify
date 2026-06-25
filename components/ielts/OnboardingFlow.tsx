"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { writeIeltsOnboardingCache } from "@/components/ielts/IeltsOnboardingGate";

type OnboardingData = {
  name: string;
  placementBand: number | null;
  targetBand: number;
  recommendedTrackName: string;
  trackTarget: string;
  examDate: string | null;
  studyDaysPerWeek: number;
  preferredStudyTime: string;
};

const STUDY_TIMES = [
  { id: "morning", label: "Morning", icon: "🌅" },
  { id: "afternoon", label: "Afternoon", icon: "☀️" },
  { id: "evening", label: "Evening", icon: "🌙" },
];

const STUDY_DAYS_OPTIONS = [3, 4, 5, 6, 7];

export default function OnboardingFlow({ initial }: { initial: OnboardingData }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [examDate, setExamDate] = useState(initial.examDate ?? "");
  const [studyDays, setStudyDays] = useState(initial.studyDaysPerWeek || 5);
  const [studyTime, setStudyTime] = useState(initial.preferredStudyTime || "evening");

  const firstName = initial.name.split(" ")[0];
  const steps = ["Welcome", "Exam date", "Study pace", "Ready"];

  async function finish() {
    setSaving(true);
    try {
      const res = await fetch("/api/student/ielts-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ielts_exam_date: examDate || null,
          study_days_per_week: studyDays,
          preferred_study_time: studyTime,
        }),
      });
      if (!res.ok) return;
      writeIeltsOnboardingCache(true);
      router.replace("/dashboard/ielts/student");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col justify-center px-4 py-10">
      <div className="mb-8 flex justify-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-1">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                i <= step
                  ? "bg-[#C8923E] text-white"
                  : "bg-slate-200 text-slate-500"
              }`}
            >
              {i + 1}
            </div>
            <span className="hidden text-[10px] text-slate-500 sm:block">{label}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        {step === 0 && (
          <>
            <p className="text-sm font-semibold text-[#C8923E]">Welcome to Speakify IELTS</p>
            <h1 className="mt-2 text-2xl font-bold text-[#0d1b35]">
              Hi {firstName}, let&apos;s set up your study plan
            </h1>
            <p className="mt-3 text-sm text-slate-600">
              Based on your placement, we recommend the{" "}
              <strong>{initial.recommendedTrackName}</strong> track — targeting{" "}
              {initial.trackTarget}.
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm">
              <div>
                <dt className="text-slate-500">Current estimate</dt>
                <dd className="text-xl font-bold text-[#0B3D75]">
                  {initial.placementBand?.toFixed(1) ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Your target</dt>
                <dd className="text-xl font-bold text-[#0d9488]">
                  {initial.targetBand.toFixed(1)}
                </dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-slate-500">
              4 quick steps — takes under 2 minutes. Your plan updates from day one.
            </p>
          </>
        )}

        {step === 1 && (
          <>
            <h1 className="text-2xl font-bold text-[#0d1b35]">When is your IELTS exam?</h1>
            <p className="mt-2 text-sm text-slate-600">
              We&apos;ll count down to exam day and pace your weekly plan.
            </p>
            <input
              type="date"
              value={examDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={(e) => setExamDate(e.target.value)}
              className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
            />
            <button
              type="button"
              onClick={() => setExamDate("")}
              className="mt-2 text-xs font-semibold text-[#0d9488] hover:underline"
            >
              Skip for now — I&apos;ll set it later
            </button>
          </>
        )}

        {step === 2 && (
          <>
            <h1 className="text-2xl font-bold text-[#0d1b35]">How many days can you study?</h1>
            <p className="mt-2 text-sm text-slate-600">
              Sun–Sat week. 5+ days/week is ideal for Band {initial.targetBand.toFixed(1)}.
            </p>
            <div className="mt-6 grid grid-cols-5 gap-2">
              {STUDY_DAYS_OPTIONS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setStudyDays(n)}
                  className={`rounded-xl border py-4 text-lg font-bold transition ${
                    studyDays === n
                      ? "border-[#C8923E] bg-[#C8923E]/15 text-[#0d1b35]"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-slate-500">days per week</p>
          </>
        )}

        {step === 3 && (
          <>
            <h1 className="text-2xl font-bold text-[#0d1b35]">When do you prefer to study?</h1>
            <p className="mt-2 text-sm text-slate-600">
              We&apos;ll surface Today&apos;s Mission at the right time.
            </p>
            <div className="mt-6 space-y-2">
              {STUDY_TIMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setStudyTime(t.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition ${
                    studyTime === t.id
                      ? "border-[#C8923E] bg-[#C8923E]/10"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <span className="font-semibold text-[#0d1b35]">{t.label}</span>
                </button>
              ))}
            </div>
            <div className="mt-6 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-[#0d1b35]">Your plan</p>
              <ul className="mt-2 space-y-1">
                <li>
                  Exam: {examDate ? new Date(`${examDate}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "Not set yet"}
                </li>
                <li>{studyDays} study days per week</li>
                <li>{STUDY_TIMES.find((t) => t.id === studyTime)?.label} sessions</li>
              </ul>
            </div>
          </>
        )}

        <div className="mt-8 flex gap-3">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
            >
              Back
            </button>
          ) : null}
          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 rounded-xl bg-[#C8923E] px-4 py-3 text-sm font-bold text-[#0d1b35] hover:opacity-95"
            >
              Continue →
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              disabled={saving}
              className="flex-1 rounded-xl bg-[#0d9488] px-4 py-3 text-sm font-bold text-white hover:opacity-95 disabled:opacity-50"
            >
              {saving ? "Setting up…" : "Start my IELTS journey →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
