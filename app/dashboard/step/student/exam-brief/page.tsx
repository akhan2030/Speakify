import { SPEAKIFY_COLOR } from "@/lib/brand/tokens";
import { STEP_SECTIONS } from "@/lib/step/examModel";
import {
  STEP_EPT_NOTE,
  STEP_SOURCE_CHECKLIST,
  STEP_STUDY_SEQUENCE_NOTE,
} from "@/lib/step/officialBlueprint";
import { STEP_PHASES, STEP_TOTAL_WEEKS } from "@/lib/step/phases";
import Link from "next/link";
import { STEP_ROUTES } from "@/lib/step/paths";

const NAVY = SPEAKIFY_COLOR.navy900;
const GOLD = SPEAKIFY_COLOR.gold;

const CONFIDENCE_LABEL: Record<string, string> = {
  high_public: "High — public ETEC/NCA (+ news where noted)",
  medium_single_source: "Medium — one credible source",
  inferred: "Inferred from published percentages",
  speakify_study: "Speakify study convention",
  unknown: "Not confirmed — do not treat as Qiyas fact",
};

export default function StepExamBriefPage() {
  const sections = Object.values(STEP_SECTIONS);

  return (
    <div className="space-y-8 p-4 pb-24 md:p-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: GOLD }}>
          How STEP works
        </p>
        <h1 className="mt-1 text-2xl font-extrabold" style={{ color: NAVY }}>
          Sourced exam brief
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">
          Train against the four components Qiyas actually tests. Weights and the 100-item MCQ
          paper are well supported. Section order and per-section clocks are Speakify pacing —
          not a 2026 candidate bulletin.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold" style={{ color: NAVY }}>
          What to master
        </h2>
        <p className="mt-2 text-sm text-slate-600">{STEP_STUDY_SEQUENCE_NOTE}</p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {sections.map((s) => (
            <article key={s.id} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase text-slate-400">
                {s.weightPercent}% · {s.questionCount} scored items (inferred)
              </p>
              <h3 className="mt-1 text-base font-bold" style={{ color: NAVY }}>
                {s.label}{" "}
                <span className="text-sm font-medium text-slate-500">({s.labelAr})</span>
              </h3>
              <p className="mt-2 text-sm text-slate-600">{s.description}</p>
              <p className="mt-3 text-xs font-semibold text-slate-500">Highest-yield moves</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-slate-700">
                {s.strategies.slice(0, 3).map((tip) => (
                  <li key={tip}>{tip}</li>
                ))}
              </ul>
              <Link
                href={STEP_ROUTES.practice(s.id)}
                className="mt-3 inline-block text-sm font-semibold"
                style={{ color: GOLD }}
              >
                Practice this section →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold" style={{ color: NAVY }}>
          {STEP_TOTAL_WEEKS}-week Speakify plan
        </h2>
        <ul className="mt-4 space-y-3">
          {STEP_PHASES.map((p) => (
            <li key={p.phase} className="rounded-xl border border-slate-100 px-4 py-3">
              <p className="text-xs font-bold uppercase text-slate-400">
                Phase {p.phase} · Weeks {p.weeks[0]}–{p.weeks[1]} · Speakify exit {p.exitScoreRequired}+
              </p>
              <p className="font-semibold" style={{ color: NAVY }}>
                {p.title} — {p.subtitle}
              </p>
              <p className="text-sm text-slate-600">{p.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold" style={{ color: NAVY }}>
          Fact checklist
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b text-xs uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-3">Topic</th>
                <th className="py-2 pr-3">What we teach</th>
                <th className="py-2">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {STEP_SOURCE_CHECKLIST.filter((f) => f.studentFacing).map((f) => (
                <tr key={f.id} className="border-b border-slate-100 align-top">
                  <td className="py-3 pr-3 font-medium" style={{ color: NAVY }}>
                    {f.label}
                  </td>
                  <td className="py-3 pr-3 text-slate-700">{f.value}</td>
                  <td className="py-3 text-xs text-slate-500">{CONFIDENCE_LABEL[f.confidence]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-slate-600">{STEP_EPT_NOTE}</p>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={STEP_ROUTES.practice("reading")}
          className="rounded-xl px-5 py-3 text-sm font-bold text-speakify-navy"
          style={{ background: GOLD }}
        >
          Start Reading (40%)
        </Link>
        <Link href={STEP_ROUTES.weeklyPlan} className="rounded-xl border-2 px-5 py-3 text-sm font-bold" style={{ borderColor: NAVY, color: NAVY }}>
          Weekly plan
        </Link>
      </div>
    </div>
  );
}
