"use client";

type Improvement = {
  criteria: string;
  title: string;
  advice: string;
};

export type SpeakingEvaluationData = {
  bandFC: number;
  bandLR: number;
  bandGRA: number;
  bandP: number;
  bandOverall: number;
  feedback: {
    fluency: string;
    lexical: string;
    grammar: string;
    pronunciation: string;
    strengths: string;
    improvements: Improvement[];
    modelAnswer: string;
  };
  transcript?: string;
};

function formatBand(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getSpeakingCriteriaStyle(criteria: string) {
  const key = criteria.toLowerCase();
  if (key.includes("fluency") || key === "fc") {
    return { color: "#c9972c", label: "Fluency & Coherence" };
  }
  if (key.includes("lexical") || key === "lr") {
    return { color: "#7c3aed", label: "Lexical Resource" };
  }
  if (key.includes("grammatical") || key === "gra") {
    return { color: "#2563eb", label: "Grammatical Range" };
  }
  if (key.includes("pronunciation") || key === "p") {
    return { color: "#0d9488", label: "Pronunciation" };
  }
  return { color: "#c9972c", label: criteria };
}

function BandScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-bold text-[#c9972c]">
        {formatBand(score)}
        <span className="text-lg text-slate-400">/9</span>
      </p>
    </div>
  );
}

export default function SpeakingEvaluationCard({
  evaluation,
  showTranscript = true,
  showModelAnswer = true,
  hideBandScores = false,
}: {
  evaluation: SpeakingEvaluationData;
  showTranscript?: boolean;
  showModelAnswer?: boolean;
  hideBandScores?: boolean;
}) {
  const { bandFC, bandLR, bandGRA, bandP, bandOverall, feedback, transcript } =
    evaluation;

  return (
    <div className="space-y-6">
      {!hideBandScores ? (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <BandScoreCard label="FC" score={bandFC} />
            <BandScoreCard label="LR" score={bandLR} />
            <BandScoreCard label="GRA" score={bandGRA} />
            <BandScoreCard label="P" score={bandP} />
          </div>

          <div className="text-center">
            <p className="text-5xl font-extrabold text-[#c9972c]">
              {formatBand(bandOverall)}
            </p>
            <p className="mt-1 text-sm text-slate-500">Overall Band</p>
          </div>
        </>
      ) : null}

      <div className="space-y-4">
        <div
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          style={{ borderLeftWidth: 4, borderLeftColor: "#c9972c" }}
        >
          <h3 className="font-bold text-[#0d1b35]">Fluency & Coherence</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {feedback.fluency}
          </p>
        </div>
        <div
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          style={{ borderLeftWidth: 4, borderLeftColor: "#7c3aed" }}
        >
          <h3 className="font-bold text-[#0d1b35]">Lexical Resource</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {feedback.lexical}
          </p>
        </div>
        <div
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          style={{ borderLeftWidth: 4, borderLeftColor: "#2563eb" }}
        >
          <h3 className="font-bold text-[#0d1b35]">
            Grammatical Range & Accuracy
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {feedback.grammar}
          </p>
        </div>
        <div
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          style={{ borderLeftWidth: 4, borderLeftColor: "#0d9488" }}
        >
          <h3 className="font-bold text-[#0d1b35]">Pronunciation</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {feedback.pronunciation}
          </p>
        </div>
      </div>

      {feedback.strengths ? (
        <div
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          style={{ borderLeftWidth: 4, borderLeftColor: "#16a34a" }}
        >
          <h3 className="font-bold text-green-700">What you did well</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {feedback.strengths}
          </p>
        </div>
      ) : null}

      {feedback.improvements?.length > 0 ? (
        <section className="rounded-xl bg-gradient-to-b from-slate-50/80 to-white p-6 shadow-sm">
          <h3 className="text-center text-xl font-bold text-[#0d1b35]">
            Priority Improvements
          </h3>
          <div className="mx-auto mt-2 h-0.5 w-20 bg-[#c9972c]" />
          <div className="mt-6 space-y-4">
            {feedback.improvements.map((item, i) => {
              const style = getSpeakingCriteriaStyle(item.criteria);
              return (
                <div
                  key={i}
                  className="flex items-stretch rounded-r-lg shadow-sm"
                  style={{
                    borderLeft: `4px solid ${style.color}`,
                    backgroundColor: `${style.color}0d`,
                  }}
                >
                  <div className="flex w-[25%] min-w-[88px] shrink-0 flex-col justify-center p-4">
                    <p className="text-sm font-bold text-[#0d1b35]">
                      {style.label}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1 bg-white/60 p-4">
                    <h4 className="font-bold text-[#0d1b35]">{item.title}</h4>
                    <p className="mt-1.5 text-sm text-slate-600">{item.advice}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {showModelAnswer && feedback.modelAnswer ? (
        <div className="rounded-xl bg-[#0d9488] p-5">
          <h3 className="font-bold text-white">
            {hideBandScores ? "Model Answer" : "Band 7-8 Model Answer"}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-white/95">
            {feedback.modelAnswer}
          </p>
          <p className="mt-3 text-xs text-white/70">
            This shows what an excellent response sounds like
          </p>
        </div>
      ) : null}

      {showTranscript && transcript ? (
        <div className="rounded-xl bg-slate-100 p-4">
          <p className="text-xs font-bold text-[#0d1b35]">
            Your response (transcript):
          </p>
          <p className="mt-2 text-sm italic text-slate-600">{transcript}</p>
        </div>
      ) : null}
    </div>
  );
}
