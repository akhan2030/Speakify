"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import ListeningAudioPlayer from "@/components/listening/ListeningAudioPlayer";
import DailyLimitReached from "@/components/DailyLimitReached";
import ListeningExamPrepBanner from "@/components/ListeningExamPrepBanner";
import ListeningSectionAnnouncer from "@/components/ListeningSectionAnnouncer";
import { ListeningQuestionsColumn } from "@/components/listening/ListeningQuestionsColumn";
import { syncPrepMessageSeconds } from "@/lib/mock-test/prepMessageSync";
import type { TextHighlight } from "@/lib/examHighlight";
import StudentSidebar, { PageSpinner } from "@/components/StudentSidebar";
import { usePathwayStudentContext } from "@/components/pathway/usePathwayStudentContext";
import DailyPracticeFinishBridge from "@/components/practice/DailyPracticeFinishBridge";
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
import { buildQuestionGroups, type QuestionGroup } from "@/lib/listeningQuestionGroups";
import { getSectionPlan } from "@/lib/listeningSectionTypes";
import { sectionHasPlaceholderQuestions } from "@/lib/listeningQuestionContent.js";
import { buildListeningQuestionMeta } from "@/lib/buildListeningQuestionMeta.js";
import ListeningAnswerReview from "@/components/listening/ListeningAnswerReview";
import type {
  ListeningQuestion as SharedListeningQuestion,
  QuestionResult,
} from "@/components/ListeningQuestions";

type ListeningQuestion = SharedListeningQuestion & {
  answer?: string;
};

type SectionData = {
  title: string;
  section: number;
  topic: string;
  transcript: string;
  speakers?: { label: string; name?: string }[];
  questionType: string;
  wordLimit?: string;
  questions: ListeningQuestion[];
  example?: {
    questionText?: string;
    answerText?: string;
    answer?: string;
  } | null;
  fromBank?: boolean;
  testId?: string;
  contentType?: string;
  bankRowId?: number;
};

type SubmitResult = {
  success: boolean;
  score: number;
  total: number;
  band: number;
  accuracy: number;
  wrongIndexes: number[];
  results: QuestionResult[];
};

const SECTION_META: Record<
  number,
  { name: string; difficulty: string }
> = {
  1: { name: "Conversation", difficulty: "Easiest" },
  2: { name: "Social Monologue", difficulty: "Easy-Medium" },
  3: { name: "Academic Discussion", difficulty: "Medium-Hard" },
  4: { name: "Academic Lecture", difficulty: "Hardest" },
};

const LOADING_MESSAGES = [
  "Generating your listening content...",
  "Creating audio...",
  "Almost ready...",
];

const TIMED_PHASES: ExamFlowPhase[] = ["prep", "checking"];

function LoadingScreen({ sectionNumber }: { sectionNumber: number }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const { usesProgramShell } = usePathwayStudentContext();

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen bg-white">
      {!usesProgramShell ? <StudentSidebar activePage="listening" /> : null}
      <main className={`min-h-screen flex-1 bg-slate-50 ${usesProgramShell ? "" : "ml-[200px]"}`}>
        <div className="sticky top-0 z-30 flex min-h-[52px] items-center gap-3 border-b-2 border-[#c9972c] bg-[#0d1b35] px-4 py-2">
          <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-[#c9972c]/30 border-t-[#c9972c]" />
          <p className="line-clamp-2 text-sm font-medium text-white">
            Preparing Section {sectionNumber}… {LOADING_MESSAGES[msgIndex]}
          </p>
        </div>
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="mt-8 h-64 animate-pulse rounded-xl bg-slate-200/80" />
        </div>
      </main>
    </div>
  );
}

function ListeningSectionExam() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const studentId = (session?.user as { id?: string })?.id ?? "";
  const { usesProgramShell, base } = usePathwayStudentContext();

  const sectionId = Number(params?.id);
  const sectionNumber = [1, 2, 3, 4].includes(sectionId) ? sectionId : 0;
  const meta = SECTION_META[sectionNumber];
  const usesGroupPrep = sectionUsesGroupPrep(sectionNumber);

  const [phase, setPhase] = useState<ExamFlowPhase | "loading">("loading");
  const [timerSeconds, setTimerSeconds] = useState(PREP_SECONDS);
  const [prepLookReady, setPrepLookReady] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const [sectionData, setSectionData] = useState<SectionData | null>(null);
  const [answers, setAnswers] = useState<Record<string | number, string>>({});
  const [highlights, setHighlights] = useState<TextHighlight[]>([]);
  const [results, setResults] = useState<SubmitResult | null>(null);
  const [limitBlocked, setLimitBlocked] = useState(false);
  const [limitChecked, setLimitChecked] = useState(false);
  const [attemptKey, setAttemptKey] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  const submittedRef = useRef(false);

  const audioSessionId = useMemo(
    () => `${studentId}-section-${sectionNumber}-${attemptKey}`,
    [studentId, sectionNumber, attemptKey]
  );

  const questionGroups = useMemo(
    () =>
      sectionData
        ? buildQuestionGroups(sectionData.questions, sectionNumber)
        : [],
    [sectionData, sectionNumber]
  );

  const globalRange = getGlobalQuestionRange(sectionNumber);
  const activeGroup = questionGroups[activeGroupIndex] ?? null;

  const announcementText = useMemo(() => {
    if (!activeGroup || activeGroupIndex !== 0) return null;
    return getOfficialSectionStartAnnouncement(sectionNumber);
  }, [sectionNumber, activeGroup, activeGroupIndex]);

  const prepAnnouncementConfig = useMemo(() => {
    if (!meta || phase !== "prep" || !activeGroup || activeGroupIndex === 0) {
      return null;
    }
    const t = getPrepAnnouncement(
      sectionNumber,
      activeGroup.start,
      activeGroup.end,
      false
    );
    return { text: t.lead };
  }, [phase, meta, activeGroup, activeGroupIndex, sectionNumber]);

  const prepBannerConfig = useMemo(() => {
    if (!meta || phase !== "prep" || !activeGroup) return null;

    const isFirst = activeGroupIndex === 0;
    const t = getPrepAnnouncement(
      sectionNumber,
      activeGroup.start,
      activeGroup.end,
      isFirst
    );

    return {
      message: buildPrepBannerMessage(
        t.lead,
        t.detail,
        isFirst ? activeGroup.type : activeGroup.type
      ),
    };
  }, [phase, meta, activeGroup, activeGroupIndex, sectionNumber]);

  const checkBannerConfig = useMemo(() => {
    if (phase !== "checking") return null;
    const t = getCheckAnnouncement(sectionNumber);
    return { message: buildPrepBannerMessage(t.lead, t.detail) };
  }, [phase, sectionNumber]);

  const sectionPlan = getSectionPlan(sectionNumber);

  const activeQuestionTypeLabel = activeGroup
    ? formatQuestionTypeLabel(activeGroup.type)
    : sectionData
      ? formatQuestionTypeLabel(
          getSectionPlan(sectionNumber).blocks[0]?.type ?? ""
        )
      : "";

  const sectionSubtypeLabel =
    activeQuestionTypeLabel || sectionPlan.questionTypeLabel;

  const visibleQuestionGroups = useMemo(() => {
    if (phase === "results" || phase === "checking") return questionGroups;
    if (sectionNumber === 4) return questionGroups;
    if ((phase === "prep" || phase === "playing") && activeGroup) {
      return [activeGroup];
    }
    return questionGroups;
  }, [phase, questionGroups, activeGroup, sectionNumber]);

  const sectionAnswerStats = useMemo(() => {
    const allQuestions = questionGroups.flatMap((g) => g.questions);
    const total = allQuestions.length;
    const answered = allQuestions.filter((q) =>
      String(answers[q.id] ?? "").trim()
    ).length;
    return { total, answered };
  }, [questionGroups, answers]);

  const advanceFromTimer = useCallback(() => {
    if (phase === "prep") {
      setPhase("playing");
      return;
    }
    if (phase === "checking") {
      void handleSubmitRef.current(true);
    }
  }, [phase]);

  const onAnnouncementComplete = useCallback(() => {
    setPhase("prep");
    setTimerSeconds(PREP_SECONDS);
    setPrepLookReady(true);
  }, []);

  const onMidPrepAnnouncementComplete = useCallback(() => {
    setTimerSeconds(PREP_SECONDS);
    setPrepLookReady(true);
  }, []);

  const handleSubmitRef = useRef<(timedOut: boolean) => void>(() => {});

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") router.replace("/login");
    if (sectionNumber === 0) router.replace(`${base}/listening`);
  }, [status, router, sectionNumber]);

  const loadSection = useCallback(async () => {
    if (!studentId || !sectionNumber) return;

    setPhase("loading");
    setLoadError(null);
    setSectionData(null);
    setAnswers({});
    setHighlights([]);
    setResults(null);
    submittedRef.current = false;

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 90_000);

    try {
      const res = await fetch(
        `/api/listening/generate?section=${sectionNumber}&studentId=${encodeURIComponent(studentId)}`,
        { signal: controller.signal }
      );
      const data = await res.json().catch(() => null);

      if (data?.code === "POOL_EXHAUSTED") {
        throw new Error(
          data?.error ??
            "You have completed all available section practice tests for today. New practice content will be available tomorrow."
        );
      }

      if (!res.ok || !data?.success) {
        throw new Error(data?.error ?? `Failed to load section (HTTP ${res.status})`);
      }

      if (sectionHasPlaceholderQuestions(data.questions)) {
        throw new Error(
          "Listening content for this section is unavailable — question labels were not generated correctly. Please try again."
        );
      }

      setSectionData(data as SectionData);

      setActiveGroupIndex(0);
      setPhase("announcement");
    } catch (err) {
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "Listening generation timed out after 90 seconds. Please try again."
          : err instanceof Error
            ? err.message
            : "Failed to load section";
      setLoadError(message);
      setSectionData(null);
      // Stay out of endless loading spinner — show error UI
      setPhase("prep");
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, [studentId, sectionNumber]);

  const handleSubmit = useCallback(
    async (timedOut = false) => {
      if (!studentId || !sectionData || submittedRef.current) return;
      submittedRef.current = true;
      setPhase("submitting");

      const correctAnswers = sectionData.questions.reduce(
        (acc, q) => {
          acc[q.id] = q.answer ?? "";
          return acc;
        },
        {} as Record<number, string>
      );

      const questionMeta = buildListeningQuestionMeta(sectionData.questions, {
        transcript: sectionData.transcript,
        sectionWordLimit: sectionData.wordLimit,
        answerKey: "id",
      });

      const checkSecs = getCheckSeconds(sectionNumber);

      try {
        const res = await fetch("/api/listening/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId,
            sectionNumber,
            questionType: sectionData.questionType,
            answers,
            correctAnswers,
            questionMeta,
            timeTakenSeconds:
              PREP_SECONDS * Math.max(1, questionGroups.length) + checkSecs,
            timedOut,
            testType: "section",
            bankTestId: sectionData.testId,
            contentType: sectionData.contentType,
            bankRowId: sectionData.bankRowId,
          }),
        });

        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.success) {
          throw new Error(data?.error ?? "Submit failed");
        }

        setResults(data as SubmitResult);
        setPhase("results");
      } catch (err) {
        submittedRef.current = false;
        setLoadError(err instanceof Error ? err.message : "Submit failed");
        setPhase("checking");
      }
    },
    [studentId, sectionData, answers, sectionNumber, questionGroups]
  );

  handleSubmitRef.current = handleSubmit;

  useEffect(() => {
    if (status !== "authenticated" || !studentId || !sectionNumber) return;

    let cancelled = false;

    async function init() {
      try {
        const limitRes = await fetch(
          `/api/listening/daily-limit?studentId=${encodeURIComponent(studentId)}`
        );
        const limitData = await limitRes.json().catch(() => null);
        if (cancelled) return;

        const blocked =
          limitRes.ok &&
          limitData &&
          !limitData.unlimited &&
          !limitData.canTakeSection;
        setLimitBlocked(blocked);
        setLimitChecked(true);
        if (!blocked) {
          await loadSection();
        }
      } catch {
        if (!cancelled) {
          setLimitChecked(true);
          await loadSection();
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [status, studentId, sectionNumber, attemptKey, loadSection]);

  useEffect(() => {
    if (phase === "prep") {
      setTimerSeconds(PREP_SECONDS);
      setPrepLookReady(activeGroupIndex === 0);
      return;
    }
    if (phase === "checking") {
      setTimerSeconds(getCheckSeconds(sectionNumber));
      setPrepLookReady(true);
      return;
    }
    setPrepLookReady(false);
  }, [phase, activeGroupIndex, sectionNumber]);

  useEffect(() => {
    if (!TIMED_PHASES.includes(phase as ExamFlowPhase)) return;
    if (!prepLookReady) return;

    if (timerSeconds <= 0) {
      advanceFromTimer();
      return;
    }

    const id = setInterval(() => {
      setTimerSeconds((s) => s - 1);
    }, 1000);

    return () => clearInterval(id);
  }, [phase, timerSeconds, advanceFromTimer, sectionNumber, prepLookReady]);

  const handleAnswerChange = useCallback(
    (questionId: number | string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }));
    },
    []
  );

  const inputsDisabled =
    phase === "loading" || phase === "submitting" || phase === "results";

  const highlightAnswered =
    phase === "playing" || phase === "prep" || phase === "checking";

  const showInlineAudioPlayer = phase === "playing";
  const preloadExamAudio =
    phase === "announcement" || phase === "prep" || phase === "playing";

  const audioPartForGroup =
    sectionNumber === 4 ? "full" : `g${activeGroupIndex}`;

  const ttsQuestions = useMemo(
    () =>
      sectionData?.questions.map((q) => ({
        questionNumber: q.questionNumber,
        answer: q.answer,
        type: q.type,
      })) ?? [],
    [sectionData]
  );

  const onGroupAudioComplete = useCallback(() => {
    const next = activeGroupIndex + 1;
    if (usesGroupPrep && next < questionGroups.length) {
      setActiveGroupIndex(next);
      setPrepLookReady(false);
      setPhase("prep");
      setTimerSeconds(PREP_SECONDS);
      return;
    }
    setPhase("checking");
    setTimerSeconds(getCheckSeconds(sectionNumber));
  }, [activeGroupIndex, questionGroups.length, usesGroupPrep, sectionNumber]);

  const showSectionAnnouncer =
    phase === "announcement" &&
    activeGroupIndex === 0 &&
    announcementText;

  const retrySection = () => {
    setAttemptKey((k) => k + 1);
  };

  if (status === "loading" || !limitChecked) {
    return <PageSpinner />;
  }

  if (limitBlocked) {
    return <DailyLimitReached variant="listening-section" />;
  }

  if (phase === "loading") {
    return <LoadingScreen sectionNumber={sectionNumber} />;
  }

  if (phase === "submitting") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <span className="mx-auto block h-14 w-14 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
          <p className="mt-6 text-lg font-bold text-[#0d1b35]">
            Calculating your score…
          </p>
        </div>
      </div>
    );
  }

  if (phase === "results" && results && sectionData && meta) {
    return (
      <div className="flex min-h-screen bg-white">
        {!usesProgramShell ? <StudentSidebar activePage="listening" /> : null}
        <main className={`min-h-screen flex-1 bg-slate-50 ${usesProgramShell ? "" : "ml-[200px]"}`}>
          <div className="mx-auto max-w-3xl px-6 py-8">
            <Link
              href={`${base}/listening`}
              className="text-sm font-semibold text-[#0d1b35] hover:text-[#c9972c]"
            >
              ← Back to Listening
            </Link>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <p className="text-6xl font-extrabold text-[#c9972c]">
                {results.score} / {results.total}
              </p>
              <p className="mt-2 text-3xl font-bold text-[#0d1b35]">
                Band {results.band.toFixed(1)}
              </p>
              <p className="mt-2 text-slate-500">
                Section {sectionNumber} — {meta.name}
              </p>
              <div className="mx-auto mt-6 h-3 max-w-md overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#c9972c]"
                  style={{
                    width: `${Math.round((results.score / results.total) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <ListeningAnswerReview
              questions={sectionData.questions}
              results={results.results}
              transcript={sectionData.transcript}
              title="Answer Review"
            />

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={retrySection}
                className="flex-1 rounded-xl border-2 border-[#0d1b35] py-3 text-sm font-bold text-[#0d1b35] hover:bg-[#0d1b35] hover:text-white"
              >
                Try Another Section {sectionNumber}
              </button>
              {sectionNumber < 4 ? (
                <Link
                  href={`${base}/listening/section/${sectionNumber + 1}?from=${sectionNumber}`}
                  className="flex-1 rounded-xl bg-[#c9972c] py-3 text-center text-sm font-bold text-[#0d1b35] hover:bg-[#b8862b]"
                >
                  Next: Section {sectionNumber + 1} →
                </Link>
              ) : (
                <Link
                  href={`${base}/listening/results`}
                  className="flex-1 rounded-xl bg-[#c9972c] py-3 text-center text-sm font-bold text-[#0d1b35] hover:bg-[#b8862b]"
                >
                  View Full Results
                </Link>
              )}
            </div>

            <DailyPracticeFinishBridge timeSpentMinutes={15} className="mt-8" />
          </div>
        </main>
      </div>
    );
  }

  const showExamFlow = sectionData && meta && phase !== "results";

  return (
    <div className="flex min-h-screen bg-white">
      {!usesProgramShell ? <StudentSidebar activePage="listening" /> : null}

      <main className={`min-h-screen flex-1 bg-slate-50 ${usesProgramShell ? "" : "ml-[200px]"}`}>
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Link
            href="/dashboard/student/listening"
            className="text-sm font-semibold text-[#0d1b35] hover:text-[#c9972c]"
          >
            ← Back to Listening
          </Link>

          {loadError && !sectionData ? (
            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
              {loadError}
              <button
                type="button"
                onClick={retrySection}
                className="mt-3 block rounded-lg bg-[#c9972c] px-4 py-2 text-sm font-bold text-[#0d1b35]"
              >
                Try Again
              </button>
            </div>
          ) : null}

          {showExamFlow ? (
            <>
              <header className="mt-4">
                <h1 className="text-2xl font-bold text-[#0d1b35]">
                  Section {sectionNumber} — {meta.name}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#0d1b35]/10 px-3 py-1 text-xs font-semibold text-[#0d1b35]">
                    Section {sectionNumber} of 4
                  </span>
                  <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-600">
                    Questions {globalRange.label}
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
                    onComplete={onMidPrepAnnouncementComplete}
                  />
                </div>
              ) : null}

              {prepBannerConfig ? (
                <div className="mt-4 overflow-hidden rounded-xl">
                  <ListeningExamPrepBanner
                    message={syncPrepMessageSeconds(
                      prepBannerConfig.message,
                      timerSeconds
                    )}
                    secondsLeft={timerSeconds}
                    secondsOnly
                  />
                </div>
              ) : null}

              {checkBannerConfig ? (
                <div className="mt-4 overflow-hidden rounded-xl">
                  <ListeningExamPrepBanner
                    message={syncPrepMessageSeconds(
                      checkBannerConfig.message,
                      timerSeconds
                    )}
                    secondsLeft={timerSeconds}
                    secondsOnly
                  />
                </div>
              ) : null}

              {sectionData && preloadExamAudio ? (
                <div
                  className={
                    showInlineAudioPlayer ? "mt-4" : "sr-only absolute h-0 w-0 overflow-hidden"
                  }
                  aria-hidden={!showInlineAudioPlayer}
                >
                  <ListeningAudioPlayer
                    key={`${audioSessionId}-${audioPartForGroup}`}
                    transcript={sectionData.transcript}
                    sectionNumber={sectionNumber}
                    sectionTitle={sectionData.title || meta.name}
                    speakers={sectionData.speakers}
                    allowReplay={false}
                    practiceMode
                    sessionId={`${audioSessionId}-${audioPartForGroup}`}
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
                  sectionNumber={sectionNumber}
                  sectionTitle={sectionData.title}
                  highlights={highlights}
                  onHighlightsChange={setHighlights}
                  example={sectionData.example}
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
          onSubmit={() => handleSubmit(false)}
          offsetSidebar
        />
      ) : null}
    </div>
  );
}

export default function ListeningSectionPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ListeningSectionExam />
    </Suspense>
  );
}
