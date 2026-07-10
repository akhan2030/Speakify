"use client";

import type {
  GtStructuredWritingFeedback,
  GtTask1StructuredFeedback,
} from "@/lib/ielts-general/gtWritingScoringSchema";

function ScoreCard({ label, score }: { label: string; score: number }) {
  const color = score >= 7 ? "#0d9488" : score >= 6 ? "#c9972c" : "#dc2626";
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color }}>
        {score.toFixed(1)}
      </p>
    </div>
  );
}

export default function GeneralGtWritingFeedback({
  feedback,
  overallBand,
}: {
  feedback: GtStructuredWritingFeedback;
  overallBand: number;
}) {
  const isTask1 = feedback.taskType === "task1";
  const task1 = isTask1 ? (feedback as GtTask1StructuredFeedback) : null;

  return (
    <div className="space-y-4">
      <p className="text-center text-4xl font-bold text-[#c9972c]">
        Band {overallBand.toFixed(1)}
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ScoreCard
          label={isTask1 ? "Task Achievement" : "Task Response"}
          score={isTask1 ? feedback.taskAchievement : feedback.taskResponse}
        />
        <ScoreCard label="Coherence & Cohesion" score={feedback.coherenceCohesion} />
        <ScoreCard label="Lexical Resource" score={feedback.lexicalResource} />
        <ScoreCard label="Grammatical Range" score={feedback.grammaticalRange} />
      </div>

      {isTask1 && task1?.letterFormatCheck ? (
        <div
          className="rounded-lg border p-4"
          style={{
            background:
              task1.letterFormatCheck.openingCorrect && task1.letterFormatCheck.signoffCorrect
                ? "#f0fdf4"
                : "#fef2f2",
            borderColor:
              task1.letterFormatCheck.openingCorrect && task1.letterFormatCheck.signoffCorrect
                ? "#0d9488"
                : "#ef4444",
          }}
        >
          <p className="mb-2 font-semibold text-[#0d1b35]">Letter Format Check</p>
          <p className="text-sm text-slate-700">
            Opening: {task1.letterFormatCheck.openingCorrect ? "✅" : "❌"}{" "}
            {task1.letterFormatCheck.openingUsed}
          </p>
          <p className="text-sm text-slate-700">
            Sign-off: {task1.letterFormatCheck.signoffCorrect ? "✅" : "❌"}{" "}
            {task1.letterFormatCheck.signoffUsed}
            {!task1.letterFormatCheck.signoffCorrect && task1.letterFormatCheck.signoffExpected
              ? ` (expected: ${task1.letterFormatCheck.signoffExpected})`
              : ""}
          </p>
          <p className="text-sm text-slate-700">
            Register:{" "}
            {task1.letterFormatCheck.registerConsistent
              ? "✅ Consistent"
              : "❌ Inconsistent register detected"}
          </p>
          <p className="text-sm text-slate-700">
            Bullet points: {task1.letterFormatCheck.bulletPointsCovered}/
            {task1.letterFormatCheck.bulletPointsTotal} covered
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {(isTask1
          ? [
              ["Task Achievement", feedback.criteriaFeedback.taskAchievement],
              ["Coherence & Cohesion", feedback.criteriaFeedback.coherenceCohesion],
              ["Lexical Resource", feedback.criteriaFeedback.lexicalResource],
              ["Grammatical Range", feedback.criteriaFeedback.grammaticalRange],
            ]
          : [
              ["Task Response", feedback.criteriaFeedback.taskResponse],
              ["Coherence & Cohesion", feedback.criteriaFeedback.coherenceCohesion],
              ["Lexical Resource", feedback.criteriaFeedback.lexicalResource],
              ["Grammatical Range", feedback.criteriaFeedback.grammaticalRange],
            ]
        ).map(([label, text]) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-[#0d9488]">{label}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{text}</p>
          </div>
        ))}
      </div>

      {feedback.saudiSpecificErrors?.length > 0 ? (
        <div className="rounded-lg border border-[#c9972c] bg-[#fffbeb] p-4">
          <p className="mb-2 font-semibold text-[#92400e]">
            Common Arabic speaker patterns found:
          </p>
          {feedback.saudiSpecificErrors.map((err, i) => (
            <div key={`${err.type}-${i}`} className="mb-2 text-sm text-slate-800">
              <strong>{err.type}</strong>
              {err.count ? ` (found ${err.count}x)` : ""}
              <br />
              ❌ &ldquo;{err.example}&rdquo;
              <br />
              ✅ &ldquo;{err.correction}&rdquo;
            </div>
          ))}
        </div>
      ) : null}

      {feedback.overallFeedback ? (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm leading-relaxed text-slate-700">{feedback.overallFeedback}</p>
        </div>
      ) : null}

      {"improvedSentence" in feedback && feedback.improvedSentence ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase text-emerald-800">Improved sentence</p>
          <p className="mt-2 text-sm text-emerald-900">{feedback.improvedSentence}</p>
        </div>
      ) : null}

      {"improvedParagraph" in feedback && feedback.improvedParagraph ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs font-bold uppercase text-emerald-800">Improved paragraph</p>
          <p className="mt-2 text-sm text-emerald-900">{feedback.improvedParagraph}</p>
        </div>
      ) : null}
    </div>
  );
}
