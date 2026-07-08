"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ListeningAudioPlayer from "@/components/listening/ListeningAudioPlayer";
import DailyLimitReached from "@/components/DailyLimitReached";
import ListeningExamPrepBanner from "@/components/ListeningExamPrepBanner";
import ListeningSectionAnnouncer from "@/components/ListeningSectionAnnouncer";
import { ListeningQuestionsColumn } from "@/components/listening/ListeningQuestionsColumn";
import type { TextHighlight } from "@/lib/examHighlight";
import {
  LISTENING_SECTION_META,
  MOCK_TARGET_SECONDS,
  type ListeningSectionData,
  type ListeningSubmitResult,
} from "@/components/listening/types";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import StickySubmitBar from "@/components/accelerator/StickySubmitBar";
import {
  getCheckAnnouncement,
  getCheckSeconds,
  getOfficialSectionStartAnnouncement,
  getPrepAnnouncement,
  PREP_SECONDS,
  sectionUsesGroupPrep,
  type ExamFlowPhase,
} from "@/lib/listeningExamFlow";
import {
  buildPrepBannerMessage,
  formatQuestionTypeLabel,
  getGlobalQuestionRange,
} from "@/lib/listeningIeltsInstructions";
import { buildQuestionGroups } from "@/lib/listeningQuestionGroups";
import { getSectionPlan } from "@/lib/listeningSectionTypes";
import {
  BANK_SETUP_HINT,
  POOL_EXHAUSTED_MESSAGE,
} from "@/lib/listeningContentPool";

const SECTION_NUMBERS = [1, 2, 3, 4] as const;
const TIMED_PHASES: ExamFlowPhase[] = ["prep", "checking"];
const LOADING_MESSAGES = [
  "Loading your full mock test…",
  "Preparing all four sections…",
  "Getting audio ready…",
  "Almost ready…",
];

const MOCK_RESULTS_STORAGE_KEY = "listening-mock-results";

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ListeningMockExam() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const studentId = (session?.user as { id?: string })?.id ?? "";

  const [phase, setPhase] = useState<
    ExamFlowPhase | "loading" | "submitting"
  >("loading");
  const [currentSection, setCurrentSection] = useState(1);
  const [sectionsData, setSectionsData] = useState<
    Record<number, ListeningSectionData>
  >({});
  const [answers, setAnswers] = useState<Record<string | number, string>>({});
  const [highlightsBySection, setHighlightsBySection] = useState<
    Record<number, TextHighlight[]>
  >({});
  const [timerSeconds, setTimerSeconds] = useState(PREP_SECONDS);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [limitBlocked, setLimitBlocked] = useState(false);
  const [limitChecked, setLimitChecked] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [poolExhausted, setPoolExhausted] = useState(false);
  const [bankSetupRequired, setBankSetupRequired] = useState(false);
  const [bankTestId, setBankTestId] = useState<string | null>(null);
  const [attemptKey, setAttemptKey] = useState(0);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  const submittedRef = useRef(false);
  const examStartedRef = useRef(false);

  const mockSessionId = useMemo(
    () => `${studentId}-mock-${attemptKey}`,
    [studentId, attemptKey]
  );

  const sectionData = sectionsData[currentSection] ?? null;
  const meta = LISTENING_SECTION_META[currentSection];
  const usesGroupPrep = sectionUsesGroupPrep(currentSection);

  const questionGroups = useMemo(
    () =>
      sectionData
        ? buildQuestionGroups(sectionData.questions, currentSection)
        : [],
    [sectionData, currentSection]
  );

  const activeGroup = questionGroups[activeGroupIndex] ?? null;

  const announcementText = useMemo(() => {
    if (!activeGroup || activeGroupIndex !== 0) return null;
    return getOfficialSectionStartAnnouncement(currentSection);
  }, [currentSection, activeGroup, activeGroupIndex]);

  const prepAnnouncementConfig = useMemo(() => {
    if (phase !== "prep" || !activeGroup || activeGroupIndex === 0) return null;
    const t = getPrepAnnouncement(
      currentSection,
      activeGroup.start,
      activeGroup.end,
      false
    );
    return { text: t.lead };
  }, [phase, activeGroup, activeGroupIndex, currentSection]);

  const prepBannerConfig = useMemo(() => {
    if (phase !== "prep" || !activeGroup) return null;
    const isFirst = activeGroupIndex === 0;
    const t = getPrepAnnouncement(
      currentSection,
      activeGroup.start,
      activeGroup.end,
      isFirst
    );
    return {
      message: buildPrepBannerMessage(t.lead, t.detail, activeGroup.type),
    };
  }, [phase, activeGroup, activeGroupIndex, currentSection]);

  const checkBannerConfig = useMemo(() => {
    if (phase !== "checking") return null;
    const t = getCheckAnnouncement(currentSection);
    return { message: buildPrepBannerMessage(t.lead, t.detail) };
  }, [phase, currentSection]);

  const sectionSubtypeLabel = activeGroup
    ? formatQuestionTypeLabel(activeGroup.type)
    : sectionData
      ? formatQuestionTypeLabel(
          getSectionPlan(currentSection).blocks[0]?.type ?? ""
        )
      : "";

  const visibleQuestionGroups = useMemo(() => {
    if (phase === "checking") return questionGroups;
    if (currentSection === 4) return questionGroups;
    if ((phase === "prep" || phase === "playing") && activeGroup) {
      return [activeGroup];
    }
    return questionGroups;
  }, [phase, activeGroup, questionGroups, currentSection]);

  const sectionAnswerStats = useMemo(() => {
    const allQuestions = questionGroups.flatMap((g) => g.questions);
    const total = allQuestions.length;
    const answered = allQuestions.filter((q) =>
      String(answers[q.questionNumber] ?? answers[String(q.questionNumber)] ?? "").trim()
    ).length;
    return { total, answered };
  }, [questionGroups, answers]);

  const audioPartForGroup =
    currentSection === 4 ? "full" : `g${activeGroupIndex}`;

  const ttsQuestions = useMemo(
    () =>
      sectionData?.questions.map((q) => ({
        questionNumber: q.questionNumber,
        answer: q.answer,
        type: q.type,
      })) ?? [],
    [sectionData]
  );

  const advanceToNextSection = useCallback(() => {
    if (currentSection < 4) {
      setCurrentSection((s) => s + 1);
      setActiveGroupIndex(0);
      setPhase("announcement");
      return;
    }
    setPhase("submitting");
    void handleFinalSubmitRef.current(false);
  }, [currentSection]);

  const advanceFromTimer = useCallback(() => {
    if (phase === "prep") {
      if (!examStartedRef.current) examStartedRef.current = true;
      setPhase("playing");
      return;
    }
    if (phase === "checking") {
      advanceToNextSection();
    }
  }, [phase, advanceToNextSection]);

  const handleFinalSubmitRef = useRef<(timedOut: boolean) => void>(() => {});

  const handleFinalSubmit = useCallback(
    async (timedOut = false) => {
      if (!studentId || submittedRef.current) return;
      submittedRef.current = true;
      setPhase("submitting");

      const allQuestions = SECTION_NUMBERS.flatMap(
        (n) => sectionsData[n]?.questions ?? []
      );

      const correctAnswers = allQuestions.reduce(
        (acc, q) => {
          acc[String(q.questionNumber)] = q.answer ?? "";
          return acc;
        },
        {} as Record<string, string>
      );

      const payloadAnswers = allQuestions.reduce(
        (acc, q) => {
          acc[String(q.questionNumber)] =
            answers[q.questionNumber] ?? answers[String(q.questionNumber)] ?? "";
          return acc;
        },
        {} as Record<string, string>
      );

      try {
        const res = await fetch("/api/listening/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            sectionNumber: 0,
            questionType: "full-mock",
            answers: payloadAnswers,
            correctAnswers,
            timeTakenSeconds: elapsedSeconds,
            timedOut,
            testType: "mock",
            testId: mockSessionId,
            bankTestId: bankTestId ?? undefined,
            contentType: "full_mock",
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(data?.error ?? "Submit failed");
        }

        const result = data as ListeningSubmitResult;
        const payload = {
          result,
          sections: sectionsData,
          answers: payloadAnswers,
          elapsedSeconds,
          testId: mockSessionId,
          sectionScores: result.sectionScores,
          attemptId: result.attemptId,
        };
        sessionStorage.setItem(
          MOCK_RESULTS_STORAGE_KEY,
          JSON.stringify(payload)
        );
        router.push("/dashboard/student/listening/test/results");
      } catch (err) {
        submittedRef.current = false;
        setLoadError(err instanceof Error ? err.message : "Submit failed");
        setPhase("checking");
      }
    },
    [studentId, sectionsData, answers, elapsedSeconds, router, mockSessionId, bankTestId]
  );

  handleFinalSubmitRef.current = handleFinalSubmit;

  const loadAllSections = useCallback(async () => {
    if (!studentId) return;

    setPhase("loading");
    setLoadError(null);
    setPoolExhausted(false);
    setBankSetupRequired(false);
    setBankTestId(null);
    setAnswers({});
    setHighlightsBySection({});
    setSectionsData({});
    setCurrentSection(1);
    setActiveGroupIndex(0);
    submittedRef.current = false;
    examStartedRef.current = false;
    setElapsedSeconds(0);

    try {
      const res = await fetch(
        `/api/listening/mock-test?studentId=${encodeURIComponent(studentId)}`
      );
      const data = await res.json().catch(() => null);

      if (data?.code === "POOL_EXHAUSTED") {
        setPoolExhausted(true);
        setLoadError(data.error ?? POOL_EXHAUSTED_MESSAGE);
        setPhase("loading");
        return;
      }

      if (data?.code === "BANK_SETUP_REQUIRED") {
        setBankSetupRequired(true);
        setLoadError(data.error ?? BANK_SETUP_HINT);
        setPhase("loading");
        return;
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.error ?? "Failed to load mock test");
      }

      const map: Record<number, ListeningSectionData> = {};
      for (const section of SECTION_NUMBERS) {
        const sectionPayload = data.sections?.[section];
        if (!sectionPayload) {
          throw new Error(`Mock test missing section ${section}`);
        }
        map[section] = sectionPayload as ListeningSectionData;
      }

      setBankTestId(data.testId ?? null);
      setSectionsData(map);
      setPhase("announcement");
      setTimerSeconds(PREP_SECONDS);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load mock test"
      );
      setPhase("loading");
    }
  }, [studentId]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated" || !studentId) return;

    let cancelled = false;

    async function init() {
      try {
        const limitRes = await fetch(
          `/api/listening/daily-limit?studentId=${encodeURIComponent(studentId)}`
        );
        const limitData = await limitRes.json().catch(() => null);
        if (cancelled) return;

        if (!limitRes.ok || !limitData) {
          setLoadError("Could not verify your daily test limit. Please try again.");
          setLimitChecked(true);
          return;
        }

        const blocked =
          !limitData.unlimited && !limitData.canTakeMock;
        setLimitBlocked(blocked);
        setLimitChecked(true);
        if (!blocked) await loadAllSections();
      } catch {
        if (!cancelled) {
          setLoadError("Could not verify your daily test limit. Please try again.");
          setLimitChecked(true);
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [status, studentId, attemptKey, loadAllSections]);

  useEffect(() => {
    if (phase !== "loading") return;
    const id = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase === "loading" || phase === "submitting") return;

    const id = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (!TIMED_PHASES.includes(phase as ExamFlowPhase)) return;

    if (timerSeconds <= 0) {
      advanceFromTimer();
      return;
    }

    const id = setInterval(() => {
      setTimerSeconds((s) => s - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [phase, timerSeconds, advanceFromTimer]);

  const onAnnouncementComplete = useCallback(() => {
    setPhase("prep");
    setTimerSeconds(PREP_SECONDS);
  }, []);

  const onGroupAudioComplete = useCallback(() => {
    const next = activeGroupIndex + 1;
    if (usesGroupPrep && next < questionGroups.length) {
      setActiveGroupIndex(next);
      setPhase("prep");
      setTimerSeconds(PREP_SECONDS);
      return;
    }
    setPhase("checking");
    setTimerSeconds(getCheckSeconds(currentSection));
  }, [
    activeGroupIndex,
    questionGroups.length,
    usesGroupPrep,
    currentSection,
  ]);

  const handleAnswerChange = useCallback(
    (key: number | string, value: string) => {
      setAnswers((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const inputsDisabled =
    phase === "loading" || phase === "submitting";
  const highlightAnswered =
    phase === "playing" || phase === "prep" || phase === "checking";
  const showInlineAudioPlayer = phase === "playing";
  const preloadExamAudio =
    phase === "announcement" || phase === "prep" || phase === "playing";
  const showSectionAnnouncer =
    phase === "announcement" &&
    activeGroupIndex === 0 &&
    announcementText;

  const progressPct = (currentSection / 4) * 100;
  const globalRange = getGlobalQuestionRange(currentSection);
  const isLastSection = currentSection === 4;

  if (status === "loading" || !limitChecked) {
    return <PageSpinner />;
  }

  if (limitBlocked) {
    return <DailyLimitReached variant="listening-mock" />;
  }

  if (poolExhausted || bankSetupRequired) {
    return (
      <div className="flex min-h-screen bg-white">
        <StudentSidebar activePage="listening" />
        <main className="ml-[200px] flex min-h-screen flex-1 items-center justify-center bg-slate-50 px-6">
          <div
            className={`max-w-md rounded-2xl border p-8 text-center shadow-sm ${
              bankSetupRequired
                ? "border-red-200 bg-red-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <p className="text-lg font-bold text-[#0d1b35]">
              {bankSetupRequired
                ? "Listening content not ready"
                : "All mock tests completed"}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              {loadError ??
                (bankSetupRequired ? BANK_SETUP_HINT : POOL_EXHAUSTED_MESSAGE)}
            </p>
            <Link
              href="/dashboard/student/listening"
              className="mt-6 inline-block rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35] hover:bg-[#b8862b]"
            >
              Back to Listening
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (loadError && phase === "loading" && Object.keys(sectionsData).length === 0) {
    return (
      <div className="flex min-h-screen bg-white">
        <StudentSidebar activePage="listening" />
        <main className="ml-[200px] flex min-h-screen flex-1 items-center justify-center bg-slate-50 px-6">
          <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-lg font-bold text-[#0d1b35]">Unable to start test</p>
            <p className="mt-2 text-sm text-slate-600">{loadError}</p>
            <Link
              href="/dashboard/student/listening"
              className="mt-6 inline-block rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35] hover:bg-[#b8862b]"
            >
              Back to Listening
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (phase === "loading") {
    return (
      <div className="flex min-h-screen bg-white">
        <StudentSidebar activePage="listening" />
        <main className="ml-[200px] min-h-screen flex-1 bg-slate-50">
          <div className="sticky top-0 z-30 border-b border-slate-200 bg-white px-6 py-4">
            <p className="text-sm font-semibold text-[#0d1b35]">
              Full Listening Mock Test
            </p>
            <p className="text-xs text-slate-500">
              {LOADING_MESSAGES[loadingMsgIndex]}
            </p>
          </div>
          <div className="mx-auto max-w-6xl px-6 py-8">
            <div className="h-64 animate-pulse rounded-xl bg-slate-200/80" />
          </div>
        </main>
      </div>
    );
  }

  if (phase === "submitting") {
    return (
      <div className="flex min-h-screen bg-white">
        <StudentSidebar activePage="listening" />
        <main className="ml-[200px] flex min-h-screen flex-1 items-center justify-center bg-slate-50">
          <div className="text-center">
            <span className="mx-auto block h-14 w-14 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
            <p className="mt-6 text-lg font-bold text-[#0d1b35]">
              Scoring your full test…
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <StudentSidebar activePage="listening" />

      <main className="ml-[200px] min-h-screen flex-1 bg-slate-50">
        <div className="sticky top-0 z-30 border-b border-slate-200 bg-white shadow-sm">
          <div className="px-6 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#c9972c]">
                  IELTS Listening — Full Mock Test
                </p>
                <p className="text-sm font-semibold text-[#0d1b35]">
                  Section {currentSection} of 4 — {meta.name}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Time elapsed</p>
                <p className="font-mono text-lg font-bold tabular-nums text-[#0d1b35]">
                  {formatElapsed(elapsedSeconds)}
                  <span className="text-sm font-normal text-slate-400">
                    {" "}
                    / {formatElapsed(MOCK_TARGET_SECONDS)}
                  </span>
                </p>
              </div>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#c9972c] transition-[width] duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {currentSection === 1
                ? "Starting test"
                : `Section ${currentSection} of 4`}{" "}
              · Questions {globalRange.label} · {meta.speakers}
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-6 py-8">
          <Link
            href="/dashboard/student/listening"
            className="text-sm font-semibold text-[#0d1b35] hover:text-[#c9972c]"
          >
            ← Exit mock test
          </Link>

          {loadError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {loadError}
              <button
                type="button"
                onClick={() => setAttemptKey((k) => k + 1)}
                className="mt-3 block rounded-lg bg-[#c9972c] px-4 py-2 text-sm font-bold text-[#0d1b35]"
              >
                Try Again
              </button>
            </div>
          ) : null}

          {sectionData ? (
            <>
              <header className="mt-4">
                <h1 className="text-2xl font-bold text-[#0d1b35]">
                  Section {currentSection} — {meta.name}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#0d1b35]/10 px-3 py-1 text-xs font-semibold text-[#0d1b35]">
                    Q{globalRange.label}
                  </span>
                  {sectionSubtypeLabel ? (
                    <span className="rounded-full bg-[#c9972c]/20 px-3 py-1 text-xs font-semibold text-[#0d1b35]">
                      {sectionSubtypeLabel}
                    </span>
                  ) : null}
                </div>
              </header>

              {showSectionAnnouncer ? (
                <div className="mt-4">
                  <ListeningSectionAnnouncer
                    text={announcementText!}
                    onComplete={onAnnouncementComplete}
                  />
                </div>
              ) : null}

              {prepAnnouncementConfig ? (
                <div className="mt-4">
                  <ListeningSectionAnnouncer
                    text={prepAnnouncementConfig.text}
                    onComplete={() => {}}
                  />
                </div>
              ) : null}

              {prepBannerConfig ? (
                <div className="mt-4 overflow-hidden rounded-xl">
                  <ListeningExamPrepBanner
                    message={prepBannerConfig.message}
                    secondsLeft={timerSeconds}
                  />
                </div>
              ) : null}

              {checkBannerConfig ? (
                <div className="mt-4 overflow-hidden rounded-xl">
                  <ListeningExamPrepBanner
                    message={checkBannerConfig.message}
                    secondsLeft={timerSeconds}
                  />
                </div>
              ) : null}

              {preloadExamAudio ? (
                <div
                  className={
                    showInlineAudioPlayer
                      ? "mt-4"
                      : "sr-only absolute h-0 w-0 overflow-hidden"
                  }
                  aria-hidden={!showInlineAudioPlayer}
                >
                  <ListeningAudioPlayer
                    key={`${mockSessionId}-s${currentSection}-${audioPartForGroup}`}
                    transcript={sectionData.transcript}
                    sectionNumber={currentSection}
                    sectionTitle={sectionData.title || meta.name}
                    speakers={sectionData.speakers}
                    allowReplay={false}
                    practiceMode
                    sessionId={`${mockSessionId}-s${currentSection}-${audioPartForGroup}`}
                    suppressReadyUI={!showInlineAudioPlayer}
                    autoStart={phase === "playing"}
                    audioPart={audioPartForGroup}
                    questions={ttsQuestions}
                    onStart={() => {}}
                    onComplete={onGroupAudioComplete}
                  />
                </div>
              ) : null}

              <div className="mt-6">
                <ListeningQuestionsColumn
                  groups={visibleQuestionGroups}
                  answers={answers}
                  onChange={handleAnswerChange}
                  disabled={inputsDisabled}
                  highlightAnswered={highlightAnswered}
                  sectionNumber={currentSection}
                  sectionTitle={sectionData.title}
                  answerKey="questionNumber"
                  highlights={highlightsBySection[currentSection] ?? []}
                  onHighlightsChange={(next) =>
                    setHighlightsBySection((prev) => ({
                      ...prev,
                      [currentSection]: next,
                    }))
                  }
                />

              </div>
            </>
          ) : null}
        </div>
      </main>
      {phase === "checking" && sectionAnswerStats.total > 0 ? (
        <StickySubmitBar
          answeredCount={sectionAnswerStats.answered}
          totalQuestions={sectionAnswerStats.total}
          onSubmit={() =>
            isLastSection ? handleFinalSubmit(false) : advanceToNextSection()
          }
          offsetSidebar
        />
      ) : null}
    </div>
  );
}

export { MOCK_RESULTS_STORAGE_KEY };
