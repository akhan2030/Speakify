"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ExamHighlightQuestionText,
  ExamHighlightSection,
  HighlightableInlineText,
  HighlightableRadioOption,
} from "@/components/exam/ExamHighlightSection";
import type { TextHighlight } from "@/lib/examHighlight";
import {
  GRADUATION_SECTION_ORDER,
  GRADUATION_TOTAL_SECONDS,
  type GraduationSkill,
} from "@/lib/pathway/graduationTestConfig";
import type { GraduationTestContent } from "@/lib/pathway/generateGraduationContent";
import PathwayCertificate, {
  type PathwayCertificateData,
} from "@/components/pathway/PathwayCertificate";

type TestPayload = {
  level: { id: string; slug: string; code: string; name: string };
  totalSeconds: number;
  passScore: number;
  sections: Array<{ key: GraduationSkill; title: string; timeLimitSeconds: number; questionCount: string }>;
  content: GraduationTestContent;
};

type SectionResult = {
  skill: string;
  score: number;
  grade: string;
  passed: boolean;
};

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 40 }).map((_, i) => (
        <span
          key={i}
          className="absolute animate-bounce text-2xl"
          style={{
            left: `${(i * 17) % 100}%`,
            top: `${(i * 13) % 40}%`,
            animationDelay: `${(i % 10) * 0.15}s`,
            color: i % 2 ? "#c9972c" : "#0d9488",
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

function McqSection({
  questions,
  answers,
  onChange,
}: {
  questions: GraduationTestContent["grammar"];
  answers: Record<string, number>;
  onChange: (id: string, index: number) => void;
}) {
  return (
    <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
      {questions.map((q, qi) => (
        <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="font-medium text-[#0d1b35]">
            <ExamHighlightQuestionText
              blockId={`${q.id}-stem`}
              number={qi + 1}
              text={q.question}
            />
          </p>
          <div className="mt-3 space-y-2">
            {q.options.map((opt, oi) => (
              <HighlightableRadioOption
                key={opt}
                blockId={`${q.id}-opt-${oi}`}
                name={q.id}
                label={opt}
                checked={answers[q.id] === oi}
                onSelect={() => onChange(q.id, oi)}
                className={
                  answers[q.id] === oi
                    ? "border-[#c9972c] bg-[#c9972c]/10"
                    : "border-slate-200"
                }
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function GraduationTestRunner({ levelId }: { levelId: string }) {
  const [phase, setPhase] = useState<
    "loading" | "locked" | "intro" | "test" | "submitting" | "pass" | "fail"
  >("loading");
  const [payload, setPayload] = useState<TestPayload | null>(null);
  const [retestAt, setRetestAt] = useState<string | null>(null);
  const [sectionIndex, setSectionIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(GRADUATION_TOTAL_SECONDS);
  const [grammarAns, setGrammarAns] = useState<Record<string, number>>({});
  const [vocabAns, setVocabAns] = useState<Record<string, number>>({});
  const [readingAns, setReadingAns] = useState<Record<string, string>>({});
  const [listeningAns, setListeningAns] = useState<Record<string, string>>({});
  const [writingAns, setWritingAns] = useState("");
  const [speakingTranscripts, setSpeakingTranscripts] = useState<string[]>(["", ""]);
  const [audioPlayed, setAudioPlayed] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState<number | null>(null);
  const [result, setResult] = useState<{
    overallScore: number;
    sectionResults: SectionResult[];
    weakAreas: string[];
    retestAvailableAt: string | null;
    certificate: PathwayCertificateData | null;
    levelName: string;
  } | null>(null);

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const submittedRef = useRef(false);
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);

  useEffect(() => {
    setHighlights([]);
  }, [sectionIndex]);

  const submitTest = useCallback(async () => {
    if (submittedRef.current || !payload) return;
    submittedRef.current = true;
    setPhase("submitting");

    const res = await fetch(`/api/pathway/graduation-test/${levelId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        answers: {
          grammar: grammarAns,
          vocabulary: vocabAns,
          reading: readingAns,
          listening: listeningAns,
          writing: writingAns,
          speaking: speakingTranscripts,
        },
        content: payload.content,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      submittedRef.current = false;
      setPhase("test");
      return;
    }

    setResult({
      overallScore: json.overallScore,
      sectionResults: json.sectionResults ?? [],
      weakAreas: json.weakAreas ?? [],
      retestAvailableAt: json.retestAvailableAt,
      certificate: json.certificate,
      levelName: json.levelName,
    });
    setPhase(json.passed ? "pass" : "fail");
  }, [
    grammarAns,
    vocabAns,
    readingAns,
    listeningAns,
    writingAns,
    speakingTranscripts,
    levelId,
    payload,
  ]);

  useEffect(() => {
    fetch(`/api/pathway/graduation-test/${levelId}`)
      .then((r) => r.json())
      .then((json) => {
        if (json.locked) {
          setRetestAt(json.retestAvailableAt);
          setPhase("locked");
          return;
        }
        if (json.error) {
          setPhase("locked");
          return;
        }
        setPayload(json);
        setPhase("intro");
      })
      .catch(() => setPhase("locked"));
  }, [levelId]);

  useEffect(() => {
    if (phase !== "test") return;
    const id = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          submitTest();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, submitTest]);

  useEffect(() => {
    if (!payload || sectionIndex !== 3 || audioUrl) return;
    const transcript = payload.content.listening.transcript;
    fetch("/api/listening/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: transcript, announcement: true, voice: "nova" }),
    })
      .then((r) => r.blob())
      .then((blob) => setAudioUrl(URL.createObjectURL(blob)))
      .catch(() => null);
  }, [payload, sectionIndex, audioUrl]);

  const startTest = () => {
    submittedRef.current = false;
    setSecondsLeft(GRADUATION_TOTAL_SECONDS);
    setSectionIndex(0);
    setPhase("test");
  };

  const playListeningOnce = () => {
    if (!audioUrl || audioPlayed) return;
    const audio = new Audio(audioUrl);
    audio.play();
    setAudioPlayed(true);
  };

  const startRecording = async (index: number) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const form = new FormData();
      form.append("audio", blob, "answer.webm");
      const res = await fetch("/api/speaking/transcribe", { method: "POST", body: form });
      const json = await res.json();
      setSpeakingTranscripts((prev) => {
        const next = [...prev];
        next[index] = json.transcript ?? "";
        return next;
      });
      stream.getTracks().forEach((t) => t.stop());
    };
    mediaRef.current = recorder;
    recorder.start();
    setRecording(index);
  };

  const stopRecording = () => {
    mediaRef.current?.stop();
    setRecording(null);
  };

  const currentSkill = GRADUATION_SECTION_ORDER[sectionIndex];

  if (phase === "loading") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
        <p className="mt-4 text-sm text-slate-500">Loading graduation test…</p>
      </div>
    );
  }

  if (phase === "locked") {
    return (
      <div className="max-w-lg rounded-2xl border border-red-200 bg-red-50 p-8">
        <h2 className="text-xl font-bold text-[#0d1b35]">Retest not available yet</h2>
        <p className="mt-2 text-sm text-red-800">
          You must wait 7 days after a failed attempt before retaking this exam.
        </p>
        {retestAt ? (
          <p className="mt-4 text-sm font-semibold text-[#0d1b35]">
            Retest unlocks on:{" "}
            {new Date(retestAt).toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        ) : null}
        <Link
          href={`/dashboard/student/pathway/${levelId}`}
          className="mt-6 inline-block text-sm font-semibold text-[#0d9488] hover:underline"
        >
          ← Back to level
        </Link>
      </div>
    );
  }

  if (phase === "intro" && payload) {
    return (
      <div className="max-w-2xl rounded-2xl border border-[#c9972c]/40 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-[#0d1b35]">Graduation Test</h1>
        <p className="mt-2 text-lg text-[#c9972c]">{payload.level.name}</p>
        <p className="mt-4 text-sm text-slate-600">
          90 minutes · 6 sections · 70% required to pass and unlock the next level.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-slate-600">
          {payload.sections.map((s) => (
            <li key={s.key}>
              <strong className="text-[#0d1b35]">{s.title}</strong> — {s.questionCount}
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={startTest}
          className="mt-8 rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35]"
        >
          Begin Graduation Test
        </button>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
        <p className="mt-4 text-sm text-slate-500">Scoring your exam…</p>
      </div>
    );
  }

  if (phase === "pass" && result?.certificate) {
    return (
      <>
        <Confetti />
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-[#0d1b35]">Congratulations!</h2>
            <p className="mt-2 text-lg text-[#c9972c]">
              You passed {result.levelName}!
            </p>
            <p className="mt-4 text-5xl font-bold text-[#c9972c]">
              {Math.round(result.overallScore)}%
            </p>
          </div>
          <PathwayCertificate data={result.certificate} />
        </div>
      </>
    );
  }

  if (phase === "fail" && result) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="text-xl font-bold text-red-800">Below passing score</h2>
          <p className="mt-2 text-sm text-red-900">
            You scored {Math.round(result.overallScore)}% — you need 70% to pass.
          </p>
          {result.retestAvailableAt ? (
            <p className="mt-3 text-sm font-semibold text-[#0d1b35]">
              Retest unlocks on:{" "}
              {new Date(result.retestAvailableAt).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold text-[#0d1b35]">Section results</h3>
          <ul className="mt-4 space-y-2">
            {result.sectionResults.map((s) => (
              <li
                key={s.skill}
                className={`flex justify-between rounded-lg px-3 py-2 text-sm ${
                  s.passed ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                }`}
              >
                <span className="capitalize">{s.skill}</span>
                <span>
                  {s.passed ? "✓" : "✗"} {Math.round(s.score)}%
                </span>
              </li>
            ))}
          </ul>
          {result.weakAreas.length ? (
            <div className="mt-6">
              <p className="text-sm font-semibold text-[#0d1b35]">
                Focus areas before retesting:
              </p>
              <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
                {result.weakAreas.map((w) => (
                  <li key={w} className="capitalize">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <Link
            href={`/dashboard/student/pathway/${levelId}`}
            className="mt-6 inline-block rounded-xl bg-[#0d1b35] px-5 py-3 text-sm font-bold text-white"
          >
            Study Plan for Remedial Week →
          </Link>
        </div>
      </div>
    );
  }

  if (!payload) return null;

  return (
    <div>
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <div>
          <p className="text-xs uppercase text-slate-500">Graduation Test</p>
          <p className="font-bold text-[#0d1b35]">
            Section {sectionIndex + 1}/6 —{" "}
            {payload.sections.find((s) => s.key === currentSkill)?.title}
          </p>
        </div>
        <p
          className={`font-mono text-lg font-bold ${
            secondsLeft <= 600 ? "text-red-600" : "text-[#0d1b35]"
          }`}
        >
          {formatTime(secondsLeft)}
        </p>
      </div>

      <div className="mt-6">
        <ExamHighlightSection
          sectionId={`pathway-graduation-${currentSkill}`}
          highlights={highlights}
          onHighlightsChange={setHighlights}
        >
        {currentSkill === "grammar" ? (
          <McqSection
            questions={payload.content.grammar}
            answers={grammarAns}
            onChange={(id, idx) => setGrammarAns((p) => ({ ...p, [id]: idx }))}
          />
        ) : null}

        {currentSkill === "vocabulary" ? (
          <McqSection
            questions={payload.content.vocabulary}
            answers={vocabAns}
            onChange={(id, idx) => setVocabAns((p) => ({ ...p, [id]: idx }))}
          />
        ) : null}

        {currentSkill === "reading" ? (
          <div>
            <div className="rounded-xl bg-white p-5 text-sm leading-relaxed text-slate-700 shadow-sm">
              <HighlightableInlineText
                blockId="graduation-reading-passage"
                text={payload.content.reading.passage}
              />
            </div>
            <div className="mt-4 space-y-3">
              {payload.content.reading.questions.map((q, i) => (
                <div key={q.id} className="rounded-xl border bg-white p-4">
                  <p className="text-sm font-medium text-[#0d1b35]">
                    <ExamHighlightQuestionText
                      blockId={`${q.id}-stem`}
                      number={i + 1}
                      text={q.question}
                    />
                  </p>
                  {q.options ? (
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt, oi) => (
                        <HighlightableRadioOption
                          key={opt}
                          blockId={`${q.id}-opt-${oi}`}
                          name={q.id}
                          label={opt}
                          checked={readingAns[q.id] === opt}
                          onSelect={() =>
                            setReadingAns((p) => ({ ...p, [q.id]: opt }))
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <input
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      value={readingAns[q.id] ?? ""}
                      onChange={(e) =>
                        setReadingAns((p) => ({ ...p, [q.id]: e.target.value }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {currentSkill === "listening" ? (
          <div>
            <button
              type="button"
              disabled={audioPlayed || !audioUrl}
              onClick={playListeningOnce}
              className="rounded-xl bg-[#0d1b35] px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
            >
              {audioPlayed ? "Audio played (once only)" : "▶ Play audio (once only)"}
            </button>
            <div className="mt-4 space-y-3">
              {payload.content.listening.questions.map((q, i) => (
                <div key={q.id} className="rounded-xl border bg-white p-4">
                  <p className="text-sm font-medium">
                    <ExamHighlightQuestionText
                      blockId={`${q.id}-stem`}
                      number={i + 1}
                      text={q.question}
                    />
                  </p>
                  {q.options ? (
                    <div className="mt-2 space-y-1">
                      {q.options.map((opt, oi) => (
                        <HighlightableRadioOption
                          key={opt}
                          blockId={`${q.id}-opt-${oi}`}
                          name={q.id}
                          label={opt}
                          checked={listeningAns[q.id] === opt}
                          onSelect={() =>
                            setListeningAns((p) => ({ ...p, [q.id]: opt }))
                          }
                        />
                      ))}
                    </div>
                  ) : (
                    <input
                      className="mt-2 w-full rounded-lg border px-3 py-2 text-sm"
                      value={listeningAns[q.id] ?? ""}
                      onChange={(e) =>
                        setListeningAns((p) => ({ ...p, [q.id]: e.target.value }))
                      }
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {currentSkill === "writing" ? (
          <div className="rounded-xl border bg-white p-5">
            <p className="text-sm text-slate-600">
              <HighlightableInlineText
                blockId="graduation-writing-instruction"
                text={payload.content.writing.instruction}
              />
            </p>
            <p className="mt-3 font-medium text-[#0d1b35]">
              <HighlightableInlineText
                blockId="graduation-writing-prompt"
                text={payload.content.writing.prompt}
              />
            </p>
            <textarea
              className="mt-4 min-h-[200px] w-full rounded-xl border px-4 py-3 text-sm"
              value={writingAns}
              onChange={(e) => setWritingAns(e.target.value)}
              placeholder="Write your answer here…"
            />
          </div>
        ) : null}

        {currentSkill === "speaking" ? (
          <div className="space-y-4">
            {payload.content.speaking.map((q, i) => (
              <div key={q.id} className="rounded-xl border bg-white p-5">
                <p className="font-medium text-[#0d1b35]">
                  Question {i + 1}:{" "}
                  <HighlightableInlineText
                    blockId={`${q.id}-prompt`}
                    text={q.prompt}
                  />
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {recording === i ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white"
                    >
                      Stop recording
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => startRecording(i)}
                      className="rounded-lg bg-[#c9972c] px-4 py-2 text-sm font-bold text-[#0d1b35]"
                    >
                      🎤 Record answer
                    </button>
                  )}
                </div>
                {speakingTranscripts[i] ? (
                  <p className="mt-3 text-sm text-slate-600">
                    Transcript: {speakingTranscripts[i]}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        </ExamHighlightSection>
      </div>

      <div className="mt-8 flex justify-between">
        <button
          type="button"
          disabled={sectionIndex === 0}
          onClick={() => setSectionIndex((i) => i - 1)}
          className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-40"
        >
          ← Previous
        </button>
        {sectionIndex < GRADUATION_SECTION_ORDER.length - 1 ? (
          <button
            type="button"
            onClick={() => setSectionIndex((i) => i + 1)}
            className="rounded-xl bg-[#0d9488] px-5 py-2 text-sm font-bold text-white"
          >
            Next section →
          </button>
        ) : (
          <button
            type="button"
            onClick={submitTest}
            className="rounded-xl bg-[#c9972c] px-5 py-2 text-sm font-bold text-[#0d1b35]"
          >
            Submit graduation test
          </button>
        )}
      </div>
    </div>
  );
}
