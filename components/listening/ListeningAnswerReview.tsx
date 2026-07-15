"use client";

import type { QuestionResult } from "@/components/ListeningQuestions";

type ReviewQuestion = {
  id?: number | string;
  questionNumber: number;
  text: string;
  type?: string;
  wordLimit?: string;
  explanation?: string;
};

/**
 * Shared IELTS Listening answer review — shows validation feedback for every question.
 */
export default function ListeningAnswerReview({
  questions,
  results,
  transcript,
  title = "Answer Review",
}: {
  questions: ReviewQuestion[];
  results: QuestionResult[];
  transcript?: string;
  title?: string;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-xl font-bold text-[#0d1b35]">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">
        Official-style marking accepts spelling and format variants where IELTS
        would. Incorrect answers include coaching notes so you can improve.
      </p>
      <div className="mt-4 space-y-4">
        {questions.map((q, i) => {
          const r = results[i];
          const correct = Boolean(r?.correct);
          const fb = r?.feedback;
          return (
            <div
              key={q.id ?? q.questionNumber}
              className={`rounded-xl border p-4 ${
                correct
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                    correct ? "bg-green-600" : "bg-red-600"
                  }`}
                >
                  {correct ? "✓" : "✗"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#0d1b35]">
                    Q{q.questionNumber}. {q.text}
                  </p>
                  {q.wordLimit ? (
                    <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Instruction: {q.wordLimit}
                    </p>
                  ) : null}

                  <p className="mt-2 text-sm">
                    <span className="font-medium">Your answer:</span>{" "}
                    {r?.studentAnswer || "—"}
                  </p>

                  {!correct ? (
                    <>
                      <p className="mt-1 text-sm text-green-800">
                        <span className="font-medium">Correct answer:</span>{" "}
                        {fb?.correctAnswer ?? r?.correctAnswer ?? "—"}
                      </p>
                      {r?.acceptedVariants && r.acceptedVariants.length > 1 ? (
                        <p className="mt-1 text-xs text-slate-600">
                          Also accepted:{" "}
                          {r.acceptedVariants.slice(0, 6).join(" · ")}
                        </p>
                      ) : null}
                      {fb?.whyIncorrect ? (
                        <p className="mt-3 text-sm text-red-900">
                          <span className="font-medium">Why this is wrong:</span>{" "}
                          {fb.whyIncorrect}
                        </p>
                      ) : null}
                      {fb?.explanation ? (
                        <p className="mt-2 text-sm text-[#0d1b35]">
                          <span className="font-medium">Explanation:</span>{" "}
                          {fb.explanation}
                        </p>
                      ) : q.explanation ? (
                        <p className="mt-2 text-sm text-[#0d1b35]">
                          <span className="font-medium">Explanation:</span>{" "}
                          {q.explanation}
                        </p>
                      ) : null}
                      {fb?.transcriptEvidence || transcript ? (
                        <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-sm italic text-slate-700">
                          <span className="not-italic font-medium text-[#0d1b35]">
                            From the recording:
                          </span>{" "}
                          {fb?.transcriptEvidence ||
                            "Replay the section audio and listen for the detail named in the correct answer."}
                        </p>
                      ) : null}
                      {fb?.coachingNote ? (
                        <p className="mt-2 text-sm font-medium text-[#0d1b35]">
                          IELTS tip: {fb.coachingNote}
                        </p>
                      ) : null}
                      <div className="mt-3 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
                        {fb?.skillTested ? (
                          <p>
                            <span className="font-semibold">Skill tested:</span>{" "}
                            {fb.skillTested}
                          </p>
                        ) : null}
                        {fb?.commonTrap ? (
                          <p>
                            <span className="font-semibold">Common trap:</span>{" "}
                            {fb.commonTrap}
                          </p>
                        ) : null}
                        {fb?.lossReason ? (
                          <p>
                            <span className="font-semibold">Mark lost due to:</span>{" "}
                            {fb.lossReason}
                          </p>
                        ) : null}
                        {fb?.studyTip ? (
                          <p>
                            <span className="font-semibold">Study tip:</span>{" "}
                            {fb.studyTip}
                          </p>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <p className="mt-1 text-sm text-green-800">
                      Correct
                      {r?.acceptedVariants && r.acceptedVariants.length > 1
                        ? ` (accepted forms include: ${r.acceptedVariants.slice(0, 3).join(", ")})`
                        : ""}
                      .
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
