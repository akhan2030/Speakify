"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import CourseCertificate from "@/components/course/CourseCertificate";

const TEST_QUESTIONS = [
  {
    id: "q1",
    prompt: "Choose the best answer: She ___ to the library every Saturday.",
    options: ["go", "goes", "going", "gone"],
    correct: 1,
  },
  {
    id: "q2",
    prompt: "Which sentence uses academic vocabulary appropriately?",
    options: [
      "The thing was really big.",
      "The phenomenon was substantial.",
      "It was like super huge.",
      "Big stuff happened.",
    ],
    correct: 1,
  },
  {
    id: "q3",
    prompt: "Reading: Infer the author's main purpose.",
    options: ["To entertain", "To inform", "To persuade", "To describe"],
    correct: 2,
  },
  {
    id: "q4",
    prompt: "Listening strategy: What should you do BEFORE audio plays?",
    options: [
      "Write the essay",
      "Predict answers from questions",
      "Skip to Section 2",
      "Memorize the transcript",
    ],
    correct: 1,
  },
  {
    id: "q5",
    prompt: "Writing: A strong Task 2 introduction should…",
    options: [
      "List random ideas",
      "Paraphrase the question and state your position",
      "Copy the prompt exactly",
      "Use only bullet points",
    ],
    correct: 1,
  },
];

export default function LevelTestPage() {
  const params = useParams();
  const levelSlug = String(params.levelSlug);
  const testType = String(params.testType);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    passed: boolean;
    score: number;
    message: string;
    certificate?: {
      certificate_code: string;
      title: string;
      nextLevel?: string | null;
      nextLevelSlug?: string | null;
    };
  } | null>(null);
  const [meta, setMeta] = useState<{ title: string; passScore: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/course/levels/${levelSlug}`)
      .then((r) => r.json())
      .then((d) => {
        const assessment = (d.assessments ?? []).find(
          (a: { assessment_type: string }) => a.assessment_type === testType
        );
        setMeta({
          title: assessment?.title ?? testType,
          passScore: assessment?.pass_score ?? 70,
        });
      })
      .finally(() => setLoading(false));
  }, [levelSlug, testType]);

  const submit = async () => {
    let correct = 0;
    for (const q of TEST_QUESTIONS) {
      if (answers[q.id] === q.correct) correct += 1;
    }
    const score = Math.round((correct / TEST_QUESTIONS.length) * 100);

    setSubmitting(true);
    const res = await fetch("/api/course/assessment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ levelSlug, assessmentType: testType, score }),
    });
    const data = await res.json();
    setResult({
      passed: data.passed,
      score: data.score,
      message: data.message,
      certificate: data.certificate,
    });
    setSubmitting(false);
  };

  if (loading) return <PageSpinner />;

  const isGraduation = testType === "graduation";

  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar activePage="course" />

      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50 p-6">
        <Link
          href={`/dashboard/student/course/${levelSlug}`}
          className="text-sm font-semibold text-[#0d9488] hover:underline"
        >
          ← Back to level
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-[#0d1b35]">{meta?.title}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {isGraduation
            ? "Pass to earn your graduation certificate and advance to the next track."
            : "Pass to unlock the second half of your track (70/30 progression)."}
        </p>
        <p className="mt-1 text-xs text-slate-500">Pass score: {meta?.passScore}%</p>

        {!result ? (
          <div className="mt-8 max-w-2xl space-y-6">
            {TEST_QUESTIONS.map((q, idx) => (
              <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-5">
                <p className="font-medium text-[#0d1b35]">
                  {idx + 1}. {q.prompt}
                </p>
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, i) => (
                    <label
                      key={opt}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 hover:bg-slate-50"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        checked={answers[q.id] === i}
                        onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                      />
                      <span className="text-sm text-slate-700">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={submit}
              disabled={submitting || Object.keys(answers).length < TEST_QUESTIONS.length}
              className="rounded-xl bg-[#0d1b35] px-6 py-3 text-sm font-bold text-white hover:opacity-95 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Submit test"}
            </button>
          </div>
        ) : (
          <div className="mt-8 max-w-xl">
            <div
              className={`rounded-2xl border p-6 ${
                result.passed
                  ? "border-[#0d9488]/40 bg-[#0d9488]/10"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <p className="text-3xl font-bold text-[#0d1b35]">{result.score}%</p>
              <p className="mt-2 font-semibold">{result.message}</p>
            </div>

            {result.certificate ? (
              <div className="mt-8">
                <CourseCertificate
                  data={{
                    certificateCode: result.certificate.certificate_code,
                    title: result.certificate.title,
                    score: result.score,
                    nextLevel: result.certificate.nextLevel,
                    nextLevelSlug: result.certificate.nextLevelSlug,
                  }}
                />
              </div>
            ) : null}

            <Link
              href={`/dashboard/student/course/${levelSlug}`}
              className="mt-6 inline-block text-sm font-semibold text-[#0d9488] hover:underline"
            >
              Return to level home →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
