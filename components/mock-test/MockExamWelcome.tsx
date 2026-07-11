"use client";

import { useEffect, useMemo, useState } from "react";
import { generateExamReference } from "@/lib/mock-test/certificate";
import { parseTargetBandNumeric } from "@/lib/placement/onboarding";

const PACK_LABELS: Record<string, string> = {
  single: "Single Mock",
  pack3: "3-Mock Pack",
  pack5: "5-Mock Pack",
};

const TIMELINE_SECTIONS = [
  {
    key: "listening",
    label: "Listening",
    time: "30 min",
    detail: "40 questions",
    color: "#0d9488",
  },
  {
    key: "reading",
    label: "Reading",
    time: "60 min",
    detail: "40 questions",
    color: "#0d1b35",
  },
  {
    key: "writing",
    label: "Writing",
    time: "60 min",
    detail: "2 tasks",
    color: "#c9972c",
  },
  {
    key: "speaking",
    label: "Speaking",
    time: "15 min",
    detail: "3 parts",
    color: "#16a34a",
  },
] as const;

const RULES = [
  "This exam cannot be paused once started",
  "Listening audio plays once only",
  "Ensure your microphone is working for Speaking",
  "Total time: approximately 2 hours 45 minutes",
];

const READINESS_ITEMS = [
  "I am in a quiet place with no distractions",
  "My microphone is working (for Speaking)",
  "I have 2 hours 45 minutes available right now",
  "My internet connection is stable",
  "I understand this exam cannot be paused",
] as const;

const PLACEMENT_RESULT_KEY = "speakify_placement_result";

function getTargetBandFromPlacement(): number | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PLACEMENT_RESULT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as {
      onboarding?: { targetBandScore?: string };
    };
    return parseTargetBandNumeric(data?.onboarding?.targetBandScore ?? "");
  } catch {
    return null;
  }
}

function getMotivationalMessage(targetBand: number | null): string {
  if (targetBand != null && targetBand >= 7) {
    return "This is your simulation of the real thing. Band 7 students are made in moments like this.";
  }
  if (targetBand != null && targetBand >= 6 && targetBand < 7) {
    return "Every mock you take brings you closer. Let's see exactly where you stand today.";
  }
  return "Your IELTS journey starts here. Give it everything you have.";
}

type ExamBeginMeta = {
  examReference: string;
  examDateTime: string;
};

type Props = {
  studentName: string;
  packName: string;
  programme?: "academic" | "general";
  onBegin: (meta: ExamBeginMeta) => void;
};

export default function MockExamWelcome({
  studentName,
  packName,
  programme = "academic",
  onBegin,
}: Props) {
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [clientMeta, setClientMeta] = useState<{
    examReference: string;
    examDateTime: string;
    targetBand: number | null;
  } | null>(null);

  useEffect(() => {
    setClientMeta({
      examReference: generateExamReference(),
      examDateTime: new Date().toLocaleString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      targetBand: getTargetBandFromPlacement(),
    });
  }, []);

  const motivationalMessage = useMemo(
    () => getMotivationalMessage(clientMeta?.targetBand ?? null),
    [clientMeta?.targetBand]
  );

  const allReady = READINESS_ITEMS.every((_, i) => checked[i]);

  const toggleCheck = (index: number) => {
    setChecked((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const examTitle =
    programme === "general"
      ? "Speakify IELTS General Training Mock Exam"
      : "Speakify IELTS Academic Mock Exam";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f9fa] px-4 py-10">
      <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-lg sm:p-10">
        <p className="text-center text-xs font-bold uppercase tracking-[0.2em] text-[#c9972c]">
          Speakify
        </p>
        <h1 className="mt-3 text-center text-2xl font-bold text-[#0d1b35] sm:text-3xl">
          {examTitle}
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-center text-sm font-medium leading-relaxed text-[#0d1b35]">
          {motivationalMessage}
        </p>

        <div className="mt-6 rounded-xl bg-[#0d1b35]/5 px-5 py-4">
          <div className="grid gap-3 text-center sm:grid-cols-2 sm:text-left">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Candidate
              </p>
              <p className="mt-0.5 text-sm font-bold text-[#0d1b35]">{studentName}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Pack
              </p>
              <p className="mt-0.5 text-sm font-bold text-[#0d1b35]">{packName}</p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Exam date &amp; time
              </p>
              <p className="mt-0.5 text-sm font-semibold text-[#0d1b35]">
                {clientMeta?.examDateTime ?? "Loading…"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Exam reference
              </p>
              <p className="mt-0.5 font-mono text-sm font-bold text-[#c9972c]">
                {clientMeta?.examReference ?? "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950">
          💡 <strong>Pro tip:</strong> Treat this exactly like the real IELTS. Sit at a desk,
          put your phone away, and don&apos;t stop until it&apos;s complete. Students who treat
          mocks seriously improve 0.5–1.0 band faster.
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#0d1b35]">
            Exam timeline
          </h2>
          <div className="mt-4 overflow-x-auto pb-2">
            <div className="flex min-w-[640px] items-start">
              {TIMELINE_SECTIONS.map((section, index) => (
                <div key={section.key} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    {index > 0 && (
                      <div
                        className="h-1 flex-1 rounded-full"
                        style={{ backgroundColor: `${section.color}33` }}
                      />
                    )}
                    <div
                      className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black text-white shadow-md"
                      style={{ backgroundColor: section.color }}
                    >
                      {index + 1}
                    </div>
                    {index < TIMELINE_SECTIONS.length - 1 && (
                      <div
                        className="h-1 flex-1 rounded-full"
                        style={{
                          backgroundColor: `${TIMELINE_SECTIONS[index + 1].color}33`,
                        }}
                      />
                    )}
                  </div>
                  <div
                    className="mt-3 w-full rounded-xl border px-3 py-3 text-center"
                    style={{
                      borderColor: `${section.color}40`,
                      backgroundColor: `${section.color}0d`,
                    }}
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-wide"
                      style={{ color: section.color }}
                    >
                      {section.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-[#0d1b35]">
                      {section.time}
                    </p>
                    <p className="text-xs text-slate-500">{section.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-3 flex h-1.5 overflow-hidden rounded-full">
            {TIMELINE_SECTIONS.map((section) => (
              <div
                key={section.key}
                className="flex-1"
                style={{ backgroundColor: section.color }}
                title={section.label}
              />
            ))}
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Total duration · approximately 2 hours 45 minutes
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#0d1b35]">
            Important rules
          </h2>
          <ul className="mt-3 space-y-2">
            {RULES.map((rule) => (
              <li
                key={rule}
                className="flex items-start gap-2 text-sm text-slate-700"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9972c]" />
                {rule}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-[#0d1b35]">
            Exam readiness checklist
          </h2>
          <ul className="mt-3 space-y-2.5">
            {READINESS_ITEMS.map((item, index) => (
              <li key={item}>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 transition hover:border-[#c9972c]/40">
                  <input
                    type="checkbox"
                    checked={Boolean(checked[index])}
                    onChange={() => toggleCheck(index)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-[#c9972c] focus:ring-[#c9972c]"
                  />
                  <span>{item}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!clientMeta) return;
            onBegin({
              examReference: clientMeta.examReference,
              examDateTime: clientMeta.examDateTime,
            });
          }}
          disabled={!allReady || !clientMeta}
          className={`mt-10 w-full rounded-xl py-4 text-lg font-bold shadow-md transition ${
            allReady
              ? "bg-[#c9972c] text-[#0d1b35] hover:bg-[#d4a84a]"
              : "cursor-not-allowed bg-slate-200 text-slate-400"
          }`}
        >
          Begin Exam
        </button>
        {!allReady && (
          <p className="mt-2 text-center text-xs text-slate-400">
            Complete all readiness checks to begin
          </p>
        )}
      </div>
    </div>
  );
}

export function resolveMockPackName(packId: string | null): string {
  if (!packId) return "Single Mock";
  return PACK_LABELS[packId] ?? "Single Mock";
}
