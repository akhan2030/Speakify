"use client";

export type ParagraphFeedbackData = {
  stepLabel: string;
  paragraphNumber: number;
  isFinal: boolean;
  paragraphBand: number | null;
  bands: {
    ta: number | null;
    cc: number | null;
    lr: number | null;
    gra: number | null;
    overall: number | null;
  };
  feedback: {
    taskAchievement: string;
    coherenceCohesion: string;
    lexicalResource: string;
    grammaticalRange: string;
    strengths: string;
    priorityFix: string;
    modelSentence: string;
    fullResponseSummary: string;
    nextSteps: string;
  };
};

function formatBand(score: number | null) {
  if (score == null || !Number.isFinite(score)) return "—";
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

function ScorePill({ label, score }: { label: string; score: number | null }) {
  const hasScore = score != null && Number.isFinite(score);
  return (
    <div
      className={`rounded-lg border px-3 py-2 text-center ${
        hasScore ? "border-slate-200 bg-white" : "border-dashed border-slate-200 bg-slate-50"
      }`}
    >
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-[#0d1b35]">
        {hasScore ? formatBand(score) : "—"}
      </p>
      {hasScore ? <p className="text-[10px] text-slate-400">/ 9</p> : null}
    </div>
  );
}

function FeedbackSection({ label, text }: { label: string; text: string }) {
  if (!text.trim()) return null;
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-[#0d9488]">{label}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{text}</p>
    </div>
  );
}

export default function ParagraphFeedbackCard({ data }: { data: ParagraphFeedbackData }) {
  const { feedback, bands, paragraphBand, isFinal } = data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-[#0d1b35]">
          Paragraph {data.paragraphNumber} — {data.stepLabel}
        </p>
        {paragraphBand != null ? (
          <div className="rounded-full bg-[#c9972c]/15 px-4 py-1.5 text-center">
            <span className="text-[10px] font-semibold uppercase text-[#c9972c]">
              Paragraph band
            </span>
            <p className="text-xl font-extrabold text-[#c9972c]">{formatBand(paragraphBand)}</p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <ScorePill label="TA" score={bands.ta} />
        <ScorePill label="CC" score={bands.cc} />
        <ScorePill label="LR" score={bands.lr} />
        <ScorePill label="GRA" score={bands.gra} />
      </div>

      {isFinal && bands.overall != null ? (
        <div className="rounded-xl border-2 border-[#c9972c] bg-[#c9972c]/10 px-6 py-5 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-[#0d1b35]">
            Final overall band
          </p>
          <p className="mt-1 text-5xl font-extrabold text-[#c9972c]">
            {formatBand(bands.overall)}
          </p>
          <p className="mt-1 text-xs text-slate-600">
            (TA + CC + LR + GRA) ÷ 4 — official IELTS rounding
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <FeedbackSection label="Task Achievement" text={feedback.taskAchievement} />
        <FeedbackSection label="Coherence & Cohesion" text={feedback.coherenceCohesion} />
        <FeedbackSection label="Lexical Resource" text={feedback.lexicalResource} />
        <FeedbackSection label="Grammatical Range & Accuracy" text={feedback.grammaticalRange} />
        <FeedbackSection label="Strengths" text={feedback.strengths} />
        <FeedbackSection label="Priority fix" text={feedback.priorityFix} />
        {feedback.modelSentence ? (
          <div className="rounded-lg border border-[#0d9488]/30 bg-[#0d9488]/5 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#0d9488]">
              Model sentence
            </p>
            <p className="mt-1.5 text-sm italic text-[#0d1b35]">{feedback.modelSentence}</p>
          </div>
        ) : null}
        {isFinal ? (
          <>
            <FeedbackSection label="Full response summary" text={feedback.fullResponseSummary} />
            <FeedbackSection label="Next steps" text={feedback.nextSteps} />
          </>
        ) : null}
      </div>
    </div>
  );
}
