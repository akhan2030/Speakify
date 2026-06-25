"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function clampBand(n: number) {
  return Math.max(0, Math.min(9, n));
}

function parseCriterionScore(text: string, label: string): number | null {
  const re = new RegExp(
    `${label}\\s*:\\s*([0-9]+(?:\\.[0-9])?)\\s*/\\s*9`,
    "i"
  );
  const m = text.match(re);
  if (!m) return null;
  const val = Number(m[1]);
  if (!Number.isFinite(val)) return null;
  return clampBand(val);
}

function calculateOverall(
  ta: number | null,
  cc: number | null,
  lr: number | null,
  gra: number | null
): number | null {
  if (ta === null || cc === null || lr === null || gra === null) {
    return null;
  }
  const avg = (ta + cc + lr + gra) / 4;
  return Math.round(avg * 2) / 2;
}

function parseBands(evaluation: string) {
  const text = evaluation || "";
  const ta = parseCriterionScore(text, "TA");
  const cc = parseCriterionScore(text, "CC");
  const lr = parseCriterionScore(text, "LR");
  const gra = parseCriterionScore(text, "GRA");
  const overall = calculateOverall(ta, cc, lr, gra);
  return { overall, ta, cc, lr, gra };
}

function stripMarkdown(text: string) {
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^#{1,6}/gm, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`([^`]+)`/g, "$1");
}

function extractSection(
  text: string,
  sectionTitle: string,
  nextTitles: string[]
): string {
  const escaped = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const endAlternation = nextTitles
    .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|");
  const re = new RegExp(
    `${escaped}:?\\s*([\\s\\S]*?)(?=(?:${endAlternation})\\s*:?|$)`,
    "i"
  );
  const m = text.match(re);
  return m ? m[1].trim() : "";
}

type PriorityImprovement = {
  criteria: string;
  title: string;
  description: string;
};

type CriteriaStyle = {
  label: string;
  pillLabel: string;
  color: string;
};

const CRITERIA_STYLES: CriteriaStyle[] = [
  { label: "Task Achievement", pillLabel: "Task Achievement", color: "#c9972c" },
  {
    label: "Coherence & Cohesion",
    pillLabel: "Coherence & Cohesion",
    color: "#0d9488",
  },
  { label: "Lexical Resource", pillLabel: "Lexical Resource", color: "#7c3aed" },
  {
    label: "Grammatical Range & Accuracy",
    pillLabel: "GRA",
    color: "#1d4ed8",
  },
];

const IMPROVEMENT_CRITERIA_BY_INDEX = [
  "Task Achievement",
  "Lexical Resource",
  "Grammatical Range and Accuracy",
];

const FULL_EVAL_CRITERIA = [
  {
    title: "Task Achievement (25%)",
    feedbackKey: "taskAchievement" as const,
    color: "#c9972c",
    bandKey: "ta" as const,
  },
  {
    title: "Coherence & Cohesion (25%)",
    feedbackKey: "coherence" as const,
    color: "#0d9488",
    bandKey: "cc" as const,
  },
  {
    title: "Lexical Resource / Vocabulary (25%)",
    feedbackKey: "lexical" as const,
    color: "#7c3aed",
    bandKey: "lr" as const,
  },
  {
    title: "Grammatical Range & Accuracy (25%)",
    feedbackKey: "grammar" as const,
    color: "#1d4ed8",
    bandKey: "gra" as const,
  },
];

function feedbackToBullets(text: string, max = 3): string[] {
  if (!text.trim()) return [];

  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, max);
}

function normalizeCriteriaField(raw: string): string {
  return raw
    .replace(/^\[|\]$/g, "")
    .replace(/^Criteria:\s*/i, "")
    .trim();
}

function normalizeCriteriaKey(raw: string): string {
  return normalizeCriteriaField(raw)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanImprovementText(text: string): string {
  return text
    .replace(/\s*\|\s*Time:\s*.+$/i, "")
    .replace(/\bTime:\s*~?\d+\s*(weeks?|months?|days?).*$/i, "")
    .replace(/\bTime:\s*.+$/i, "")
    .trim();
}


function getCriteriaStyle(criteria: string): CriteriaStyle {
  const key = normalizeCriteriaKey(criteria);

  if (
    key.includes("coherence") ||
    key === "cc" ||
    key.includes("cohesion")
  ) {
    return CRITERIA_STYLES[1];
  }
  if (key.includes("lexical") || key === "lr") {
    return CRITERIA_STYLES[2];
  }
  if (
    key.includes("grammatical") ||
    key.includes("accuracy") ||
    key === "gra"
  ) {
    return CRITERIA_STYLES[3];
  }
  if (key.includes("task achievement") || key === "ta") {
    return CRITERIA_STYLES[0];
  }

  return CRITERIA_STYLES[0];
}

type ParsedEvaluation = {
  taskAchievement: string;
  coherence: string;
  lexical: string;
  grammar: string;
  spellingMap: Map<string, string>;
  improvements: PriorityImprovement[];
  corrections: { original: string; corrected: string; why: string }[];
};

function parseSpellingErrors(text: string): Map<string, string> {
  const block = extractSection(text, "Spelling Errors", [
    "Priority Improvements",
  ]);
  const map = new Map<string, string>();

  if (!block || /^none$/i.test(block.trim())) {
    return map;
  }

  for (const line of block.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || /^none$/i.test(trimmed)) continue;
    const m = trimmed.match(/^(.+?)\s*(?:→|->)\s*(.+)$/);
    if (m) {
      const wrong = m[1].trim();
      const correct = m[2].trim();
      if (wrong && correct) {
        map.set(wrong.toLowerCase(), correct);
      }
    }
  }

  return map;
}

function parsePriorityImprovements(block: string): PriorityImprovement[] {
  return block
    .split("\n")
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3)
    .map((line, index) => {
      const parts = line.split("|").map((p) => p.trim());
      const criteria = IMPROVEMENT_CRITERIA_BY_INDEX[index] ?? "";

      if (parts.length >= 3) {
        return {
          criteria,
          title: cleanImprovementText(parts[1]),
          description: cleanImprovementText(parts.slice(2).join(" | ")),
        };
      }
      if (parts.length === 2) {
        return {
          criteria,
          title: cleanImprovementText(parts[0]),
          description: cleanImprovementText(parts[1]),
        };
      }
      return { criteria, title: parts[0] || "", description: "" };
    })
    .filter((item) => item.title || item.description);
}

function parseEvaluationSections(evaluation: string): ParsedEvaluation {
  const text = stripMarkdown(evaluation);

  const taskAchievement = extractSection(text, "Task Achievement", [
    "Coherence and Cohesion",
    "Coherence & Cohesion",
  ]);
  const coherence = extractSection(text, "Coherence and Cohesion", [
    "Lexical Resource",
  ]);
  const lexical = extractSection(text, "Lexical Resource", [
    "Grammatical Range and Accuracy",
    "Grammatical Range & Accuracy",
  ]);
  const grammar = extractSection(text, "Grammatical Range and Accuracy", [
    "Spelling Errors",
  ]);

  const spellingMap = parseSpellingErrors(text);

  const improvementsBlock = extractSection(text, "Priority Improvements", [
    "Corrected Sentences",
  ]);
  const improvements = parsePriorityImprovements(improvementsBlock);

  const correctionsBlock = extractSection(text, "Corrected Sentences", []);
  const corrections: ParsedEvaluation["corrections"] = [];
  const correctionRe =
    /Original:\s*([\s\S]*?)\n\s*Corrected:\s*([\s\S]*?)\n\s*Why:\s*([\s\S]*?)(?=\n\s*Original:|$)/gi;
  let match;
  while ((match = correctionRe.exec(correctionsBlock)) !== null) {
    corrections.push({
      original: match[1].trim(),
      corrected: match[2].trim(),
      why: match[3].trim(),
    });
  }

  return {
    taskAchievement,
    coherence,
    lexical,
    grammar,
    spellingMap,
    improvements,
    corrections,
  };
}

function PriorityImprovementsSection({
  improvements,
}: {
  improvements: PriorityImprovement[];
}) {
  if (improvements.length === 0) return null;

  return (
    <section className="rounded-xl bg-gradient-to-b from-slate-50/80 to-white p-6 shadow-sm">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-[#0d1b35]">
          Your Path to a Higher Band
        </h2>
        <div className="mx-auto mt-2 h-0.5 w-20 bg-[#c9972c]" />
      </div>

      <div className="mt-6 space-y-4">
        {improvements.map((item, i) => {
          const style = getCriteriaStyle(item.criteria);
          const displayTitle = cleanImprovementText(item.title);
          const displayDescription = cleanImprovementText(item.description);

          return (
            <div
              key={i}
              className="group relative flex items-stretch rounded-r-lg shadow-sm transition-shadow duration-200 ease-in-out hover:shadow-md"
              style={{
                borderLeft: `4px solid ${style.color}`,
                backgroundColor: `${style.color}0d`,
              }}
            >
              <div className="flex w-[25%] min-w-[88px] shrink-0 flex-col justify-center p-4">
                <p className="break-words text-sm font-bold leading-snug text-[#0d1b35]">
                  {style.label}
                </p>
              </div>
              <div className="relative min-w-0 flex-1 bg-white/60 p-4 pr-10">
                <h4 className="break-words text-base font-bold text-[#0d1b35]">
                  {displayTitle}
                </h4>
                {displayDescription ? (
                  <p className="mt-1.5 break-words text-sm leading-relaxed text-slate-600">
                    {displayDescription}
                  </p>
                ) : null}
                <span
                  className="absolute right-4 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full"
                  style={{ backgroundColor: style.color }}
                  aria-hidden
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PencilIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function SpellingReviewCard({
  spellingMap,
}: {
  spellingMap: Map<string, string>;
}) {
  const entries = Array.from(spellingMap.entries());

  return (
    <div className="rounded-xl border border-slate-200 border-l-4 border-l-[#c9972c] bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-bold text-[#0d1b35]">Spelling Review</h3>
        <PencilIcon className="h-4 w-4 text-[#c9972c]" />
      </div>
      <p className="mt-1 text-sm text-slate-500">
        Identified spelling errors in your essay
      </p>

      {entries.length === 0 ? (
        <div className="mt-4 rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          ✓ No spelling errors found — excellent lexical precision!
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="pb-2 text-left font-bold text-[#E24B4A]">
                  Your spelling
                </th>
                <th className="pb-2 text-left font-bold text-[#185FA5]">
                  Correct spelling
                </th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([wrong, correct]) => (
                <tr
                  key={wrong}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="py-2.5 font-bold text-[#E24B4A]">
                    <span className="mr-1.5 text-[#E24B4A]/70">✗</span>
                    {wrong}
                  </td>
                  <td className="py-2.5 font-bold text-[#185FA5]">
                    <span className="mr-1.5 text-[#185FA5]/70">✓</span>
                    {correct}
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

function formatBand(score: number | null) {
  if (score === null) return "—";
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function CriterionCard({
  title,
  score,
}: {
  title: string;
  score: number | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <div className="text-xs font-medium text-slate-600">{title}</div>
      <div className="mt-2 text-2xl font-bold text-[#c9972c]">
        {formatBand(score)}
        {typeof score === "number" ? (
          <span className="text-sm font-normal text-slate-500"> / 9</span>
        ) : null}
      </div>
    </div>
  );
}

function GoldCheck({ children }: { children: string }) {
  return (
    <li className="mb-1 flex gap-1.5 text-[12px] leading-snug text-slate-600 last:mb-0">
      <span className="shrink-0 text-[#c9972c]">✓</span>
      <span>{children}</span>
    </li>
  );
}

const COLUMN_CARD_CLASS =
  "flex h-full flex-col rounded-xl bg-white p-4";
const COLUMN_LABEL_CLASS =
  "text-xs font-semibold uppercase tracking-wider text-[#c9972c]";
const COLUMN_TITLE_CLASS =
  "mt-1 text-[16px] font-bold leading-snug text-[#0d1b35]";
const DURATION_BADGE_CLASS =
  "mt-1.5 inline-flex w-fit rounded-full bg-[#0d1b35] px-2.5 py-0.5 text-[11px] font-semibold text-white";
const COLUMN_DESC_CLASS =
  "mt-2 flex-1 text-[13px] leading-snug text-slate-600";
const FEATURE_LIST_CLASS = "mt-2.5 list-none p-0";
const COLUMN_PRICE_CLASS = "mt-2.5 text-[22px] font-bold text-[#c9972c]";
const COLUMN_BTN_GOLD_CLASS =
  "mt-2.5 block w-full rounded-xl bg-[#c9972c] py-2.5 text-center text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b]";
const COLUMN_BTN_NAVY_CLASS =
  "mt-2.5 block w-full rounded-xl bg-[#0d1b35] py-2.5 text-center text-sm font-bold text-white transition-colors hover:bg-[#152a4d]";

function ConsultationModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consultation-modal-title"
    >
      <button
        type="button"
        className="fixed inset-0 bg-black/60"
        aria-label="Close modal"
        onClick={onClose}
      />

      <div className="relative z-10 my-4 w-full max-w-[900px]">
        <div className="rounded-2xl bg-white p-5 shadow-2xl">
          <div className="relative pr-8">
            <h2
              id="consultation-modal-title"
              className="mb-1 text-xl font-bold text-[#0d1b35]"
            >
              Choose Your Learning Path
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Select the option that fits your goal
            </p>
            <button
              type="button"
              onClick={onClose}
              className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              aria-label="Close"
            >
              <span className="text-2xl leading-none">&times;</span>
            </button>
          </div>

          <div className="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
            {/* Column 2 — Popular */}
            <div
              className={`${COLUMN_CARD_CLASS} border-2 border-[#0d1b35]`}
            >
              <div className="mb-2 flex justify-center">
                <span className="rounded-full bg-[#c9972c] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#0d1b35]">
                  Most Popular
                </span>
              </div>
              <p className={COLUMN_LABEL_CLASS}>Skill Development</p>
              <h3 className={COLUMN_TITLE_CLASS}>Writing Skills Course</h3>
              <span className={DURATION_BADGE_CLASS}>8 hours</span>
              <p className={COLUMN_DESC_CLASS}>
                An intensive 8-hour writing course designed to systematically
                improve your Task 1 and Task 2 performance with guided practice
                and feedback.
              </p>
              <ul className={FEATURE_LIST_CLASS}>
                <GoldCheck>Task 1 and Task 2 mastery</GoldCheck>
                <GoldCheck>Band descriptor training</GoldCheck>
                <GoldCheck>4 guided essay sessions</GoldCheck>
                <GoldCheck>Personalised feedback</GoldCheck>
                <GoldCheck>Certificate of completion</GoldCheck>
              </ul>
              <div className="mt-auto">
                <p className={COLUMN_PRICE_CLASS}>925 SAR</p>
                <a href="#" className={COLUMN_BTN_GOLD_CLASS}>
                  Enrol Now
                </a>
              </div>
            </div>

            {/* Column 3 — Premium */}
            <div className={`${COLUMN_CARD_CLASS} border border-slate-200`}>
              <p className={COLUMN_LABEL_CLASS}>Complete Preparation</p>
              <h3 className={COLUMN_TITLE_CLASS}>Full IELTS Accelerator</h3>
              <span className={DURATION_BADGE_CLASS}>Full Programme</span>
              <p className={COLUMN_DESC_CLASS}>
                A comprehensive IELTS preparation programme covering all four
                skills — Writing, Speaking, Reading and Listening — with full mock
                tests and expert coaching.
              </p>
              <ul className={FEATURE_LIST_CLASS}>
                <GoldCheck>All 4 IELTS skills covered</GoldCheck>
                <GoldCheck>Full mock tests with feedback</GoldCheck>
                <GoldCheck>Writing + Speaking coaching</GoldCheck>
                <GoldCheck>Reading and Listening strategies</GoldCheck>
                <GoldCheck>Target band guarantee support</GoldCheck>
                <GoldCheck>Flexible schedule</GoldCheck>
              </ul>
              <div className="mt-auto">
                <p className={COLUMN_PRICE_CLASS}>3,800 SAR</p>
                <div className="mt-1.5">
                  <p className="text-[11px] text-slate-500">Pay in instalments with</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <div className="min-w-0 flex-1 rounded-full border-2 border-[#7B2FBE] bg-white px-2 py-1.5 text-center">
                      <p className="text-sm font-bold italic text-[#7B2FBE]">
                        tabby
                      </p>
                      <p className="text-[9px] leading-tight text-slate-500">
                        4 interest-free payments
                      </p>
                    </div>
                    <div className="min-w-0 flex-1 rounded-full border-2 border-[#00A862] bg-white px-2 py-1.5 text-center">
                      <p className="text-sm font-bold text-[#00A862]">tamara</p>
                      <p className="text-[9px] leading-tight text-slate-500">
                        Pay later, stress-free
                      </p>
                    </div>
                  </div>
                </div>
                <a href="#" className={COLUMN_BTN_NAVY_CLASS}>
                  Get Started
                </a>
              </div>
            </div>
          </div>

          <div className="mt-4 space-y-1 text-center">
            <p className="text-xs text-slate-500">
              All sessions conducted by certified Speakify IELTS trainers
            </p>
            <a href="#" className="text-xs font-medium text-[#c9972c] hover:underline">
              Questions? Contact us on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsultationBanner() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div
        className="w-full rounded-2xl p-6 text-white shadow-lg"
        style={{
          background: "linear-gradient(135deg, #0d4f4f 0%, #0d3b3b 100%)",
        }}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="lg:w-[70%]">
            <h3 className="text-xl font-bold text-white sm:text-2xl">
              Want to improve faster?
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              Work with a certified Speakify IELTS trainer for personalised
              feedback and a study plan built around your results.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white">
              <li className="flex gap-2">
                <span className="text-[#c9972c]">✓</span>
                <span>One-on-one writing review</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#c9972c]">✓</span>
                <span>Personalised study plan</span>
              </li>
              <li className="flex gap-2">
                <span className="text-[#c9972c]">✓</span>
                <span>Certified IELTS trainers</span>
              </li>
            </ul>
          </div>

          <div className="flex w-full items-center justify-center lg:w-[30%]">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex w-full items-center justify-center rounded-xl bg-[#c9972c] px-7 py-3.5 text-center text-sm font-bold text-[#0d1b35] shadow-sm transition-colors hover:bg-[#b8862b] sm:w-auto"
            >
              Book a Consultation
            </button>
          </div>
        </div>
      </div>

      <ConsultationModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

function CriterionFeedbackCard({
  title,
  feedback,
  band,
  color,
}: {
  title: string;
  feedback: string;
  band: number | null;
  color: string;
}) {
  const bullets = feedbackToBullets(feedback);

  return (
    <div
      className="mb-3 overflow-hidden rounded-r-lg bg-white p-4 last:mb-0"
      style={{ borderLeft: `3px solid ${color}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-bold text-[#0d1b35]">{title}</h3>
        {typeof band === "number" ? (
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            Band {formatBand(band)}
          </span>
        ) : null}
      </div>
      {bullets.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {bullets.map((bullet, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-[#374151]">
              <span
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function EvaluationDisplay({
  parsed,
  bands,
}: {
  parsed: ParsedEvaluation;
  bands: {
    ta: number | null;
    cc: number | null;
    lr: number | null;
    gra: number | null;
  };
}) {
  return (
    <div className="space-y-6">
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-[#0d1b35]">Full Evaluation</h2>

      <div className="mt-4">
        {FULL_EVAL_CRITERIA.map((criterion) => (
          <CriterionFeedbackCard
            key={criterion.bandKey}
            title={criterion.title}
            feedback={parsed[criterion.feedbackKey]}
            band={bands[criterion.bandKey]}
            color={criterion.color}
          />
        ))}
      </div>
    </div>

      <SpellingReviewCard spellingMap={parsed.spellingMap} />

      <PriorityImprovementsSection improvements={parsed.improvements} />

      <ConsultationBanner />

      {parsed.corrections.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <section>
          <h3 className="font-bold text-[#0d1b35]">Corrected Sentences</h3>
          <div className="mt-3 space-y-4">
            {parsed.corrections.map((c, i) => (
              <div
                key={i}
                className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm"
              >
                <p>
                  <span className="font-semibold text-[#0d1b35]">Original: </span>
                  <span className="text-[#E24B4A]">{c.original}</span>
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-[#0d1b35]">Corrected: </span>
                  <span className="text-green-700">{c.corrected}</span>
                </p>
                <p className="mt-2">
                  <span className="font-semibold text-[#0d1b35]">Why: </span>
                  <span className="text-slate-600">{c.why}</span>
                </p>
              </div>
            ))}
          </div>
        </section>
        </div>
      ) : null}
    </div>
  );
}

export default function StudentWritingPage() {
  const router = useRouter();
  const { status } = useSession();

  const [taskType, setTaskType] = useState<"task1" | "task2">("task2");
  const [essay, setEssay] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<string | null>(null);

  const words = useMemo(() => countWords(essay), [essay]);
  const minWords = taskType === "task1" ? 150 : 250;
  const belowMinimum = words > 0 && words < minWords;
  const meetsMinimum = words >= minWords;

  const bands = useMemo(() => parseBands(evaluation ?? ""), [evaluation]);
  const parsedEvaluation = useMemo(
    () => (evaluation ? parseEvaluationSections(evaluation) : null),
    [evaluation]
  );

  const wordCountClass =
    words === 0
      ? "text-slate-500"
      : belowMinimum
        ? "text-[#E24B4A]"
        : "text-green-600";

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  useEffect(() => {
    setError(null);
  }, [taskType]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!essay.trim()) {
      setError("Please paste or write your essay first.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ essay, taskType }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        setError(data?.error || "Something went wrong. Please try again.");
        return;
      }

      setEvaluation(String(data.evaluation || ""));
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function onReset() {
    setEssay("");
    setEvaluation(null);
    setError(null);
    setTaskType("task2");
  }

  if (status === "loading" || status === "unauthenticated") {
    return <PageSpinner />;
  }

  return (
    <div className="min-h-screen flex bg-white">
      <StudentSidebar activePage="writing" />

      <main className="ml-[200px] min-h-screen flex-1 bg-white p-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-xl font-bold text-[#0d1b35]">IELTS Writing Practice</h1>
          <p className="mt-1 text-sm text-slate-500">
            Submit your essay and get an instant band score
          </p>

          {!evaluation ? (
            <form onSubmit={onSubmit} className="mt-8 space-y-6">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setTaskType("task1")}
                  disabled={loading}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                    taskType === "task1"
                      ? "bg-[#c9972c] text-[#0d1b35]"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Task 1
                  <span className="mt-0.5 block text-xs font-normal opacity-80">
                    graphs and charts
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setTaskType("task2")}
                  disabled={loading}
                  className={`flex-1 rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                    taskType === "task2"
                      ? "bg-[#c9972c] text-[#0d1b35]"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Task 2
                  <span className="mt-0.5 block text-xs font-normal opacity-80">essay</span>
                </button>
              </div>

              <div>
                <textarea
                  value={essay}
                  onChange={(e) => setEssay(e.target.value)}
                  placeholder="Paste or write your essay here..."
                  rows={12}
                  disabled={loading}
                  className="min-h-[300px] w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-900 shadow-sm focus:border-[#c9972c] focus:outline-none focus:ring-2 focus:ring-[#c9972c]/30 disabled:bg-slate-50"
                />
                <p className={`mt-2 text-sm font-medium ${wordCountClass}`}>
                  Word count: {words}
                </p>

                {belowMinimum ? (
                  <div className="mt-3 rounded-xl border border-[#E24B4A]/40 bg-red-50 px-4 py-3 text-sm text-[#E24B4A]">
                    {taskType === "task2" ? (
                      <>
                        ⚠ Your essay is below 250 words. Task 2 requires a minimum of
                        250 words. Your score will be penalised.
                      </>
                    ) : (
                      <>
                        ⚠ Your essay is below 150 words. Task 1 requires a minimum of
                        150 words. Your score will be penalised.
                      </>
                    )}
                  </div>
                ) : null}

                {meetsMinimum && words > 0 ? (
                  <p className="mt-2 text-xs text-green-600">
                    Word count meets the minimum for {taskType === "task1" ? "Task 1" : "Task 2"}.
                  </p>
                ) : null}
              </div>

              {error ? (
                <p className="text-sm text-[#E24B4A]">{error}</p>
              ) : null}

              <button
                type="submit"
                disabled={loading || !essay.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#c9972c] py-3 font-semibold text-[#0d1b35] shadow-sm hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 rounded-full border-2 border-[#0d1b35]/30 border-t-[#0d1b35] animate-spin" />
                    Evaluating...
                  </>
                ) : (
                  "Get Band Score"
                )}
              </button>
            </form>
          ) : (
            <div className="mt-8 space-y-8">
              <div className="text-center">
                <div className="text-6xl font-extrabold text-[#c9972c]">
                  {formatBand(bands.overall)}
                </div>
                <p className="mt-2 text-sm text-slate-500">Overall Estimated Band</p>
                <p className="mt-1 text-xs text-slate-400">
                  Calculated from TA, CC, LR, and GRA (average rounded to 0.5)
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <CriterionCard title="Task Achievement (TA)" score={bands.ta} />
                <CriterionCard title="Coherence & Cohesion (CC)" score={bands.cc} />
                <CriterionCard title="Lexical Resource (LR)" score={bands.lr} />
                <CriterionCard
                  title="Grammatical Range & Accuracy (GRA)"
                  score={bands.gra}
                />
              </div>

              {parsedEvaluation ? (
                <EvaluationDisplay parsed={parsedEvaluation} bands={bands} />
              ) : null}

              <button
                type="button"
                onClick={onReset}
                className="w-full rounded-xl border border-slate-200 bg-white py-3 font-semibold text-[#0d1b35] hover:bg-slate-50"
              >
                Evaluate Another Essay
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
