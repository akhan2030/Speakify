"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AudioRecorder from "@/components/AudioRecorder";
import ExamChrome, { PrepBanner } from "@/components/mock-test/ExamChrome";
import MockExamWelcome, {
  resolveMockPackName,
} from "@/components/mock-test/MockExamWelcome";
import MockListeningAudio from "@/components/mock-test/MockListeningAudio";
import MockReadingQuestionInput from "@/components/mock-test/MockReadingQuestionInput";
import ExamTextHighlighter from "@/components/exam/ExamTextHighlighter";
import {
  ExamHighlightSection,
  HighlightableInlineText,
} from "@/components/exam/ExamHighlightSection";
import type { TextHighlight } from "@/lib/examHighlight";
import MockWritingChart from "@/components/mock-test/MockWritingChart";
import StickySubmitBar from "@/components/accelerator/StickySubmitBar";
import SectionTransition, {
  ExamCompleteScreen,
} from "@/components/mock-test/SectionTransition";
import {
  LISTENING_CHECK_SECONDS,
  LISTENING_PREP_SECONDS,
  SECTION_DURATIONS,
  SECTION_LABELS,
  SECTION_ORDER,
  TRANSITION_SECONDS,
  WRITING_TASK1_SECONDS,
  WRITING_TASK2_SECONDS,
} from "@/lib/mock-test/constants";
import { buildReadingAnswerKey } from "@/lib/mock-test/generateReadingContent";
import {
  EXAM_CONTENT,
  getStaticExamContent,
} from "@/lib/mock-test/staticExamContent";
import { resolveAcademicExamContent } from "@/lib/mock-test/resolveGeneratedContent";
import {
  LISTENING_EXAM_PARTS,
  getAllListeningExamQuestions,
} from "@/lib/mock-test/listeningExam";
import { computeOverallBand, scoreListening, scoreReading } from "@/lib/mock-test/scoring";
import { SPEAKING_PARTS } from "@/lib/mock-test/speakingContent";
import type {
  ListeningQuestion,
  MockSection,
  NavigatorItem,
} from "@/lib/mock-test/types";
import { answersMatch, blockClipboard, countWords } from "@/lib/mock-test/utils";
import { WRITING_TASK1, WRITING_TASK2 } from "@/lib/mock-test/writingContent";
import {
  GENERAL_EXAM_CONTENT,
  getGeneralMockExamContent,
  pickGeneralMockWritingTasks,
} from "@/lib/ielts-general/mockExamContent";
import {
  checkGtReadingAnswer,
  gtReadingKindToType,
  gtReadingRawToBand,
  scoreGtReadingFromMockContent,
} from "@/lib/ielts-general/readingScore";
import type { MockExamContent } from "@/lib/mock-test/types";
import GeneralMockLetterPrompt from "@/components/ielts-general/mock/GeneralMockLetterPrompt";

type ExamPhase = MockSection | "welcome" | "transition" | "submitting";
type ListeningStep = "intro" | "prep" | "audio" | "break" | "check";

function buildGtReadingSectionBreakdown(
  examContent: MockExamContent,
  answers: Record<string, string>
) {
  const sections: Record<string, { correct: number; total: number; band: number }> = {
    A: { correct: 0, total: 0, band: 0 },
    B: { correct: 0, total: 0, band: 0 },
    C: { correct: 0, total: 0, band: 0 },
  };

  for (const passage of examContent.reading.passages) {
    const secMatch = passage.difficulty.match(/Section ([ABC])/);
    const sec = secMatch?.[1];
    if (!sec || !sections[sec]) continue;
    for (const q of passage.questions) {
      sections[sec].total += 1;
      const gtType = gtReadingKindToType(q.kind);
      if (checkGtReadingAnswer(answers[q.id] ?? "", q.correct ?? "", gtType)) {
        sections[sec].correct += 1;
      }
    }
  }

  for (const key of ["A", "B", "C"]) {
    const row = sections[key];
    row.band = gtReadingRawToBand(row.correct, row.total || 1);
  }

  return sections;
}

type MockExamEngineProps = {
  sectionReady?: typeof EXAM_CONTENT;
  variant?: "academic" | "general";
  resultsPath?: string;
};

function ListeningQuestionField({
  q,
  value,
  onChange,
}: {
  q: ListeningQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  if (q.type === "mcq" && q.options) {
    return (
      <div className="mt-2 space-y-1.5">
        {q.options.map((opt) => (
          <label
            key={opt}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <input type="radio" checked={value === opt} onChange={() => onChange(opt)} />
            {opt}
          </label>
        ))}
      </div>
    );
  }
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      {...blockClipboard}
      className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
    />
  );
}

export default function MockExamEngine({
  sectionReady = EXAM_CONTENT,
  variant = "academic",
  resultsPath,
}: MockExamEngineProps) {
  const isGeneral = variant === "general";
  const router = useRouter();
  const { data: session } = useSession();
  const [attemptId] = useState(() => {
    if (typeof window === "undefined") return `local_${crypto.randomUUID()}`;
    const stored = sessionStorage.getItem("mock_test_attempt_id");
    return stored?.trim() || `local_${crypto.randomUUID()}`;
  });
  const mockNumber = useMemo(() => {
    if (typeof window === "undefined") return 1;
    try {
      const raw = sessionStorage.getItem("mock_test_number");
      return Math.max(1, Number(raw) || 1);
    } catch {
      return 1;
    }
  }, []);
  const [generatedAcademicContent, setGeneratedAcademicContent] =
    useState<MockExamContent | null>(null);
  const examContent = useMemo(() => {
    if (isGeneral) return getGeneralMockExamContent(mockNumber);
    return generatedAcademicContent ?? getStaticExamContent();
  }, [isGeneral, mockNumber, generatedAcademicContent]);
  const writingTasks = useMemo(() => {
    if (!isGeneral) {
      return { task1: WRITING_TASK1, task2: WRITING_TASK2 };
    }
    const picked = pickGeneralMockWritingTasks(mockNumber);
    return { task1: picked.task1, task2: picked.task2 };
  }, [isGeneral, mockNumber]);
  const readyFlags = isGeneral ? GENERAL_EXAM_CONTENT : sectionReady;
  const [phase, setPhase] = useState<ExamPhase>("welcome");
  const [transitionFrom, setTransitionFrom] = useState<MockSection>("listening");
  const [transitionTo, setTransitionTo] = useState<MockSection>("reading");
  const [transitionLeft, setTransitionLeft] = useState(TRANSITION_SECONDS);
  const [packName, setPackName] = useState("Single Mock");

  const studentName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "Candidate";

  const [sectionTimeLeft, setSectionTimeLeft] = useState(SECTION_DURATIONS.listening);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [transcripts, setTranscripts] = useState<Record<string, string>>({});

  const [listeningPartIdx, setListeningPartIdx] = useState(0);
  const [listeningBlockIdx, setListeningBlockIdx] = useState(0);
  const [listeningStep, setListeningStep] = useState<ListeningStep>("intro");
  const [countdownLeft, setCountdownLeft] = useState(LISTENING_PREP_SECONDS);
  const [activeListeningQ, setActiveListeningQ] = useState(0);

  const [readingPassageIdx, setReadingPassageIdx] = useState(0);
  const [readingQIdx, setReadingQIdx] = useState(0);
  const [notesOpen, setNotesOpen] = useState(true);
  const [passageNotes, setPassageNotes] = useState<Record<string, string>>({});
  const [readingHighlights, setReadingHighlights] = useState<
    Record<string, TextHighlight[]>
  >({});
  const [listeningHighlights, setListeningHighlights] = useState<TextHighlight[]>([]);

  useEffect(() => {
    setListeningHighlights([]);
  }, [listeningPartIdx]);

  const [writingTask, setWritingTask] = useState<1 | 2>(1);
  const [writingTaskTimeLeft, setWritingTaskTimeLeft] = useState(WRITING_TASK1_SECONDS);

  const [speakingPartIdx, setSpeakingPartIdx] = useState(0);
  const [speakingQIdx, setSpeakingQIdx] = useState(0);
  const [speakingPrepLeft, setSpeakingPrepLeft] = useState(60);
  const [speakingInPrep, setSpeakingInPrep] = useState(false);
  const [recordedKeys, setRecordedKeys] = useState<Set<string>>(new Set());
  const [processingKey, setProcessingKey] = useState<string | null>(null);

  const answersRef = useRef(answers);
  const transcriptsRef = useRef(transcripts);
  const flaggedRef = useRef(flagged);
  const submittingRef = useRef(false);
  const advancingListeningRef = useRef(false);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = params.get("pack");
      const fromStorage = sessionStorage.getItem("mock_test_pack");
      setPackName(resolveMockPackName(fromUrl ?? fromStorage));
    } catch {
      setPackName("Single Mock");
    }
  }, []);

  useEffect(() => {
    if (isGeneral || !attemptId || attemptId.startsWith("local_")) return;
    let cancelled = false;
    fetch(`/api/mock-test/session/${encodeURIComponent(attemptId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.attempt?.exam_content) return;
        const resolved = resolveAcademicExamContent(
          data.attempt.exam_content as Record<string, unknown>
        );
        setGeneratedAcademicContent(resolved);
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, [attemptId, isGeneral]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    transcriptsRef.current = transcripts;
  }, [transcripts]);
  useEffect(() => {
    flaggedRef.current = flagged;
  }, [flagged]);

  const allListeningQuestions = useMemo(() => getAllListeningExamQuestions(), []);
  const readingPassages = examContent?.reading.passages ?? [];
  const allReadingQuestions = useMemo(
    () => readingPassages.flatMap((p) => p.questions),
    [readingPassages]
  );
  const readingAnswerKey = useMemo(
    () => (examContent ? buildReadingAnswerKey(examContent) : {}),
    [examContent]
  );

  const saveProgress = useCallback(
    async (extra?: Record<string, unknown>) => {
      if (!attemptId || attemptId.startsWith("local_")) return;
      await fetch("/api/mock-test/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId,
          answers: answersRef.current,
          flagged: Array.from(flaggedRef.current),
          transcripts: transcriptsRef.current,
          ...extra,
        }),
      }).catch(() => null);
    },
    [attemptId]
  );

  const overallProgress = useMemo(() => {
    const idx = SECTION_ORDER.indexOf(phase as MockSection);
    if (idx < 0) return phase === "submitting" ? 100 : 0;
    let within = 0;
    if (phase === "listening") within = activeListeningQ / 40;
    if (phase === "reading" && allReadingQuestions.length)
      within = readingQIdx / allReadingQuestions.length;
    if (phase === "writing") within = writingTask === 1 ? 0.25 : 0.75;
    if (phase === "speaking") {
      const total = 4 + 1 + 3;
      const done = speakingPartIdx === 0 ? speakingQIdx : speakingPartIdx === 1 ? 4 + 1 : 4 + 1 + speakingQIdx;
      within = done / total;
    }
    return Math.round((idx + within) * 25);
  }, [
    phase,
    activeListeningQ,
    readingQIdx,
    allReadingQuestions.length,
    writingTask,
    speakingPartIdx,
    speakingQIdx,
  ]);

  const startTransition = useCallback(
    (from: MockSection) => {
      const idx = SECTION_ORDER.indexOf(from);
      const next = SECTION_ORDER[idx + 1];
      if (!next) return;
      saveProgress({ currentSection: next });
      setTransitionFrom(from);
      setTransitionTo(next);
      setTransitionLeft(TRANSITION_SECONDS);
      setPhase("transition");
    },
    [saveProgress]
  );

  const beginExam = useCallback(() => {
    setPhase("listening");
    setSectionTimeLeft(SECTION_DURATIONS.listening);
    setListeningPartIdx(0);
    setListeningBlockIdx(0);
    setListeningStep("intro");
    setActiveListeningQ(0);
  }, []);

  const beginSection = useCallback((section: MockSection) => {
    setPhase(section);
    setSectionTimeLeft(SECTION_DURATIONS[section]);
    if (section === "listening") {
      setListeningPartIdx(0);
      setListeningBlockIdx(0);
      setListeningStep("intro");
      setActiveListeningQ(0);
    }
    if (section === "reading") {
      setReadingPassageIdx(0);
      setReadingQIdx(0);
    }
    if (section === "writing") {
      setWritingTask(1);
      setWritingTaskTimeLeft(WRITING_TASK1_SECONDS);
    }
    if (section === "speaking") {
      setSpeakingPartIdx(0);
      setSpeakingQIdx(0);
      setSpeakingInPrep(false);
    }
  }, []);

  const finishExam = useCallback(async () => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setPhase("submitting");

    const listening = scoreListening(answersRef.current);
    const reading = isGeneral
      ? scoreGtReadingFromMockContent(answersRef.current, examContent)
      : scoreReading(answersRef.current, examContent);
    const sectionScores = {
      listening,
      reading,
    };
    const overallBand = computeOverallBand({
      listening: listening.band,
      reading: reading.band,
    });

    const readingSectionBreakdown = isGeneral
      ? buildGtReadingSectionBreakdown(examContent, answersRef.current)
      : undefined;

    const payload = {
      answers: answersRef.current,
      flagged: Array.from(flaggedRef.current),
      transcripts: transcriptsRef.current,
      sectionScores,
      overallBand,
      examVariant: variant,
      mockNumber,
      readingSectionBreakdown,
      writingMeta: isGeneral
        ? {
            letterType: (writingTasks.task1 as { letter?: { letterType?: string } }).letter
              ?.letterType,
            letterPrompt: writingTasks.task1.prompt,
            essayPrompt: writingTasks.task2.prompt,
            task1Id: writingTasks.task1.id,
            task2Id: writingTasks.task2.id,
          }
        : undefined,
    };

    const id = attemptId ?? `local_${crypto.randomUUID()}`;
    try {
      sessionStorage.setItem(`mock_test_${id}`, JSON.stringify(payload));
    } catch {
      /* ignore */
    }

    if (isGeneral) {
      await fetch("/api/ielts-general/mock-exam/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attemptId: id,
          mockNumber,
          sectionScores,
          overallBand,
          readingSectionBreakdown,
        }),
      }).catch(() => null);
    }

    if (attemptId && !attemptId.startsWith("local_")) {
      await fetch("/api/mock-test/session", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attemptId, ...payload, report: {} }),
      }).catch(() => null);
    }

    await new Promise((r) => setTimeout(r, 2500));
    const destination =
      resultsPath ??
      (isGeneral
        ? `/dashboard/ielts-general/student/mock-exam/results?attemptId=${encodeURIComponent(id)}`
        : `/mock-test/results/${id}`);
    router.replace(destination);
  }, [attemptId, examContent, router, variant, isGeneral, writingTasks, resultsPath, mockNumber]);

  const handleSectionTimeUp = useCallback(() => {
    if (phase === "listening") startTransition("listening");
    else if (phase === "reading") startTransition("reading");
    else if (phase === "writing") {
      if (writingTask === 1) {
        setWritingTask(2);
        setWritingTaskTimeLeft(WRITING_TASK2_SECONDS);
      } else startTransition("writing");
    } else if (phase === "speaking") finishExam();
  }, [phase, writingTask, startTransition, finishExam]);

  useEffect(() => {
    if (phase === "welcome" || phase === "transition" || phase === "submitting") return;
    const id = window.setInterval(() => {
      setSectionTimeLeft((t) => {
        if (t <= 1) {
          handleSectionTimeUp();
          return 0;
        }
        return t - 1;
      });
      if (phase === "writing") {
        setWritingTaskTimeLeft((t) => Math.max(0, t - 1));
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, handleSectionTimeUp]);

  useEffect(() => {
    if (phase !== "transition") return;
    const id = window.setInterval(() => {
      setTransitionLeft((t) => {
        if (t <= 1) {
          beginSection(transitionTo);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, transitionTo, beginSection]);

  const advanceAfterCheck = useCallback(() => {
    if (advancingListeningRef.current) return;
    advancingListeningRef.current = true;

    setListeningPartIdx((idx) => {
      if (idx >= LISTENING_EXAM_PARTS.length - 1) {
        startTransition("listening");
        return idx;
      }
      return idx + 1;
    });

    setListeningBlockIdx(0);
    setListeningStep("intro");

    window.setTimeout(() => {
      advancingListeningRef.current = false;
    }, 800);
  }, [startTransition]);

  const onAudioComplete = useCallback(() => {
    const part = LISTENING_EXAM_PARTS[listeningPartIdx];
    if (listeningBlockIdx < part.blocks.length - 1) {
      setListeningBlockIdx((i) => i + 1);
      setListeningStep("break");
    } else {
      setListeningStep("check");
    }
  }, [listeningPartIdx, listeningBlockIdx]);

  useEffect(() => {
    if (phase !== "listening") return;
    if (listeningStep !== "prep" && listeningStep !== "break") return;

    setCountdownLeft(LISTENING_PREP_SECONDS);
    let left = LISTENING_PREP_SECONDS;

    const id = window.setInterval(() => {
      left -= 1;
      setCountdownLeft(left);
      if (left <= 0) {
        window.clearInterval(id);
        setListeningStep("audio");
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [phase, listeningPartIdx, listeningBlockIdx, listeningStep]);

  useEffect(() => {
    if (phase !== "listening" || listeningStep !== "check") return;

    setCountdownLeft(LISTENING_CHECK_SECONDS);
    let left = LISTENING_CHECK_SECONDS;

    const id = window.setInterval(() => {
      left -= 1;
      setCountdownLeft(left);
      if (left <= 0) {
        window.clearInterval(id);
        advanceAfterCheck();
      }
    }, 1000);

    return () => window.clearInterval(id);
  }, [phase, listeningPartIdx, listeningStep, advanceAfterCheck]);

  useEffect(() => {
    if (phase !== "speaking" || !speakingInPrep) return;
    const id = window.setInterval(() => {
      setSpeakingPrepLeft((t) => {
        if (t <= 1) {
          setSpeakingInPrep(false);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase, speakingInPrep]);

  const setAnswer = useCallback((id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }, []);

  const toggleFlag = useCallback((id: string) => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const currentNavigator = useMemo((): NavigatorItem[] => {
    if (phase === "listening") {
      return allListeningQuestions.map((q) => ({
        id: q.id,
        label: String(q.number),
        answered: Boolean(answers[q.id]?.trim()),
        flagged: flagged.has(q.id),
      }));
    }
    if (phase === "reading") {
      return allReadingQuestions.map((q) => ({
        id: q.id,
        label: String(q.globalNumber),
        answered: Boolean(answers[q.id]?.trim()),
        flagged: flagged.has(q.id),
      }));
    }
    if (phase === "writing") {
      return [
        {
          id: writingTasks.task1.id,
          label: "T1",
          answered: countWords(answers[writingTasks.task1.id] ?? "") >= 50,
          flagged: flagged.has(writingTasks.task1.id),
        },
        {
          id: writingTasks.task2.id,
          label: "T2",
          answered: countWords(answers[writingTasks.task2.id] ?? "") >= 50,
          flagged: flagged.has(writingTasks.task2.id),
        },
      ];
    }
    if (phase === "speaking") {
      const items: NavigatorItem[] = [];
      SPEAKING_PARTS.forEach((part) => {
        if (part.part === 2) {
          items.push({ id: "speaking-p2", label: "P2", answered: recordedKeys.has("speaking-p2"), flagged: flagged.has("speaking-p2") });
        } else {
          part.questions.forEach((_, i) => {
            const key = `speaking-p${part.part}-q${i}`;
            items.push({ id: key, label: `P${part.part}.${i + 1}`, answered: recordedKeys.has(key), flagged: flagged.has(key) });
          });
        }
      });
      return items;
    }
    return [];
  }, [phase, answers, flagged, recordedKeys, allListeningQuestions, allReadingQuestions, writingTasks]);

  const activeNavIndex = useMemo(() => {
    if (phase === "listening") return activeListeningQ;
    if (phase === "reading") return readingQIdx;
    if (phase === "writing") return writingTask - 1;
    if (phase === "speaking") {
      let idx = 0;
      for (let p = 0; p < speakingPartIdx; p++) {
        idx += SPEAKING_PARTS[p].part === 2 ? 1 : SPEAKING_PARTS[p].questions.length;
      }
      idx += speakingQIdx;
      return idx;
    }
    return 0;
  }, [phase, activeListeningQ, readingQIdx, writingTask, speakingPartIdx, speakingQIdx]);

  const activeQuestionId = currentNavigator[activeNavIndex]?.id ?? "";

  const handleNavigate = (index: number) => {
    if (phase === "listening") setActiveListeningQ(index);
    if (phase === "reading") {
      setReadingQIdx(index);
      const q = allReadingQuestions[index];
      const pIdx = readingPassages.findIndex(
        (p) => q && q.globalNumber >= p.startNumber && q.globalNumber <= p.endNumber
      );
      if (pIdx >= 0) setReadingPassageIdx(pIdx);
    }
    if (phase === "writing") setWritingTask(index === 0 ? 1 : 2);
  };

  const listeningBanner = useMemo(() => {
    if (phase !== "listening") return null;
    const part = LISTENING_EXAM_PARTS[listeningPartIdx];
    const block = part?.blocks[listeningBlockIdx];
    if (listeningStep === "prep" && block?.prepMessage)
      return <PrepBanner message={block.prepMessage} secondsLeft={countdownLeft} />;
    if (listeningStep === "break" && block?.breakMessage)
      return <PrepBanner message={block.breakMessage} secondsLeft={countdownLeft} />;
    if (listeningStep === "check")
      return (
        <PrepBanner
          message="You now have 30 seconds to check your answers."
          secondsLeft={countdownLeft}
        />
      );
    return null;
  }, [phase, listeningStep, listeningPartIdx, listeningBlockIdx, countdownLeft]);

  const visibleListeningQuestions = useMemo(() => {
    if (phase !== "listening") return [];
    const part = LISTENING_EXAM_PARTS[listeningPartIdx];
    if (!part) return [];
    if (listeningStep === "check") return part.questions;
    if (listeningStep === "intro") return [];
    const block = part.blocks[listeningBlockIdx];
    if (!block) return part.questions;
    return part.questions.filter(
      (q) => q.number >= block.questionStart && q.number <= block.questionEnd
    );
  }, [phase, listeningPartIdx, listeningBlockIdx, listeningStep]);

  const listeningStickyStats = useMemo(() => {
    if (phase !== "listening" || listeningStep !== "check") return null;
    const part = LISTENING_EXAM_PARTS[listeningPartIdx];
    if (!part?.questions.length) return null;
    const total = part.questions.length;
    const answered = part.questions.filter((q) => Boolean(answers[q.id]?.trim())).length;
    return { total, answered };
  }, [phase, listeningStep, listeningPartIdx, answers]);

  if (phase === "welcome") {
    return (
      <MockExamWelcome
        studentName={studentName}
        packName={packName}
        onBegin={beginExam}
      />
    );
  }

  if (phase === "submitting") return <ExamCompleteScreen />;

  if (phase === "transition") {
    return (
      <SectionTransition
        completedSection={SECTION_LABELS[transitionFrom]}
        nextSection={SECTION_LABELS[transitionTo]}
        secondsLeft={transitionLeft}
        customMessage={
          transitionFrom === "listening" && transitionTo === "reading"
            ? "Listening complete. Reading begins in…"
            : undefined
        }
      />
    );
  }

  const displayTime = phase === "writing" ? writingTaskTimeLeft : sectionTimeLeft;
  const passage = readingPassages[readingPassageIdx];
  const readingQ = allReadingQuestions[readingQIdx];
  const speakingPart = SPEAKING_PARTS[speakingPartIdx];
  const speakingKey =
    speakingPart.part === 2
      ? "speaking-p2"
      : `speaking-p${speakingPart.part}-q${speakingQIdx}`;

  const taskWords = countWords(
    answers[writingTask === 1 ? writingTasks.task1.id : writingTasks.task2.id] ?? ""
  );
  const taskMin =
    writingTask === 1 ? writingTasks.task1.minWords : writingTasks.task2.minWords;

  return (
    <>
    <ExamChrome
      sectionName={SECTION_LABELS[phase as MockSection]}
      timeRemaining={displayTime}
      navigator={currentNavigator}
      activeIndex={activeNavIndex}
      overallProgress={overallProgress}
      onNavigate={handleNavigate}
      onFlag={() => toggleFlag(activeQuestionId)}
      isFlagged={flagged.has(activeQuestionId)}
      banner={listeningBanner}
    >
      {phase === "listening" && readyFlags.listening.ready && (
        <div className="h-full overflow-y-auto p-4">
          {listeningStep === "intro" && (
            <div className="mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm leading-relaxed text-slate-700">
                {LISTENING_EXAM_PARTS[listeningPartIdx].introText}
              </p>
              <button
                type="button"
                onClick={() => {
                  const block = LISTENING_EXAM_PARTS[listeningPartIdx].blocks[0];
                  setActiveListeningQ(block.questionStart - 1);
                  setListeningStep("prep");
                }}
                className="mt-6 rounded-lg bg-[#0d1b35] px-6 py-2.5 text-sm font-bold text-white"
              >
                Continue
              </button>
            </div>
          )}

          {listeningStep === "audio" && (
            <MockListeningAudio
              key={`${listeningPartIdx}-${listeningBlockIdx}`}
              transcript={
                LISTENING_EXAM_PARTS[listeningPartIdx].blocks[listeningBlockIdx]
                  .transcript
              }
              voice={
                LISTENING_EXAM_PARTS[listeningPartIdx].blocks[listeningBlockIdx]
                  .voice
              }
              sectionNumber={LISTENING_EXAM_PARTS[listeningPartIdx].partNumber}
              onComplete={onAudioComplete}
            />
          )}

          {["prep", "break", "audio", "check"].includes(listeningStep) && (
            <ExamHighlightSection
              sectionId={`mock-listening-part-${listeningPartIdx}`}
              highlights={listeningHighlights}
              onHighlightsChange={setListeningHighlights}
              className="mx-auto max-w-2xl space-y-3"
              toolbarClassName="mb-3"
            >
              {visibleListeningQuestions.map((q) => (
                <div
                  key={q.id}
                  id={`lq-${q.number}`}
                  className={`rounded-xl border bg-white p-4 shadow-sm ${
                    activeListeningQ === q.number - 1
                      ? "border-[#c9972c]"
                      : "border-slate-200"
                  }`}
                >
                  <p className="text-xs font-bold text-[#c9972c]">Question {q.number}</p>
                  <p className="mt-1 text-sm text-[#0d1b35]">
                    <HighlightableInlineText
                      blockId={`mock-lq-${q.id}`}
                      text={q.prompt}
                    />
                  </p>
                  <ListeningQuestionField
                    q={q}
                    value={answers[q.id] ?? ""}
                    onChange={(v) => setAnswer(q.id, v)}
                  />
                </div>
              ))}
            </ExamHighlightSection>
          )}
        </div>
      )}

      {phase === "reading" && readyFlags.reading.ready && passage && (
        <div className="flex h-full min-h-0">
          <div className="flex min-w-0 flex-1 flex-col border-r border-slate-200 bg-white">
            <div className="flex gap-1 border-b border-slate-200 px-3 py-2">
              {readingPassages.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setReadingPassageIdx(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                    i === readingPassageIdx ? "bg-[#0d1b35] text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {isGeneral ? `Text ${p.index}` : `Passage ${p.index}`}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed">
              <h2 className="mb-1 text-lg font-bold text-[#0d1b35]">{passage.title}</h2>
              <p className="mb-4 text-xs text-slate-500">{passage.difficulty}</p>
              <ExamTextHighlighter
                sectionId={passage.id}
                blocks={passage.paragraphs.map((para) => ({
                  id: para.id,
                  text: para.label ? `${para.label} ${para.text}` : para.text,
                }))}
                highlights={readingHighlights[passage.id] ?? []}
                onHighlightsChange={(next) =>
                  setReadingHighlights((prev) => ({ ...prev, [passage.id]: next }))
                }
                textClassName="text-sm leading-relaxed text-slate-800"
                blockClassName="mb-3"
              />
            </div>
          </div>
          <div className="flex w-full max-w-md flex-col bg-[#f8f9fa]">
            <button
              type="button"
              onClick={() => setNotesOpen((o) => !o)}
              className="border-b border-slate-200 px-3 py-2 text-left text-xs font-bold text-slate-600"
            >
              Notes {notesOpen ? "▼" : "▶"}
            </button>
            {notesOpen && (
              <textarea
                value={passageNotes[passage.id] ?? ""}
                onChange={(e) =>
                  setPassageNotes((n) => ({ ...n, [passage.id]: e.target.value }))
                }
                {...blockClipboard}
                rows={3}
                className="border-b border-slate-200 px-3 py-2 text-xs"
                placeholder="Passage notes…"
              />
            )}
            <div className="flex-1 overflow-y-auto p-4">
              {readingQ && (
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs font-bold text-[#c9972c]">
                    Q{readingQ.globalNumber} · {readingQ.typeLabel}
                  </p>
                  <p className="mt-2 text-sm">{readingQ.text}</p>
                  <MockReadingQuestionInput
                    question={readingQ}
                    value={answers[readingQ.id] ?? ""}
                    onChange={(v) => setAnswer(readingQ.id, v)}
                  />
                  <div className="mt-4 flex justify-between">
                    <button
                      type="button"
                      disabled={readingQIdx <= 0}
                      onClick={() => {
                        setReadingQIdx((i) => i - 1);
                        handleNavigate(readingQIdx - 1);
                      }}
                      className="rounded-lg border px-3 py-1.5 text-xs disabled:opacity-40"
                    >
                      Prev
                    </button>
                    {readingQIdx >= allReadingQuestions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() => startTransition("reading")}
                        className="rounded-lg bg-[#0d1b35] px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Finish Reading
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setReadingQIdx((i) => i + 1)}
                        className="rounded-lg bg-[#0d1b35] px-3 py-1.5 text-xs font-bold text-white"
                      >
                        Next
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {phase === "writing" && readyFlags.writing.ready && (
        <div className="h-full overflow-y-auto p-4">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
              <p className="text-sm font-bold">
                {writingTask === 1
                  ? isGeneral
                    ? "Task 1 — Letter (20 minutes)"
                    : "Task 1 — 20 minutes"
                  : isGeneral
                    ? "Task 2 — Essay (40 minutes)"
                    : "Task 2 — 40 minutes"}
              </p>
              <p className={`text-sm font-mono font-bold ${taskWords < taskMin ? "text-red-600" : "text-[#c9972c]"}`}>
                {taskWords} words {taskWords < taskMin && `(minimum ${taskMin})`}
              </p>
            </div>
            {writingTask === 1 && !isGeneral && (
              <MockWritingChart data={WRITING_TASK1.chartData} />
            )}
            {writingTask === 1 && isGeneral && (
              <GeneralMockLetterPrompt
                task={
                  writingTasks.task1 as import("@/lib/ielts-general/mockExamContent").GeneralMockWritingTask1
                }
              />
            )}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              {(!isGeneral || writingTask !== 1) && (
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {writingTask === 1 ? writingTasks.task1.prompt : writingTasks.task2.prompt}
                </p>
              )}
              <textarea
                value={
                  answers[writingTask === 1 ? writingTasks.task1.id : writingTasks.task2.id] ?? ""
                }
                onChange={(e) =>
                  setAnswer(
                    writingTask === 1 ? writingTasks.task1.id : writingTasks.task2.id,
                    e.target.value
                  )
                }
                {...blockClipboard}
                rows={16}
                className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
            </div>
            {writingTask === 1 ? (
              <button
                type="button"
                onClick={() => {
                  setWritingTask(2);
                  setWritingTaskTimeLeft(WRITING_TASK2_SECONDS);
                }}
                className="w-full rounded-lg bg-[#0d1b35] py-3 text-sm font-bold text-white"
              >
                Submit Task 1 and continue to Task 2
              </button>
            ) : (
              <button
                type="button"
                onClick={() => startTransition("writing")}
                className="w-full rounded-lg bg-[#0d1b35] py-3 text-sm font-bold text-white"
              >
                Finish Writing
              </button>
            )}
          </div>
        </div>
      )}

      {phase === "speaking" && readyFlags.speaking.ready && (
        <div className="h-full overflow-y-auto p-4">
          <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-xs font-bold uppercase text-[#c9972c]">
              Speaking Part {speakingPart.part}
            </p>

            {speakingInPrep && speakingPart.cueCard && (
              <div className="mt-4 rounded-lg bg-amber-50 p-4">
                <p className="font-bold">Preparation: {speakingPrepLeft}s</p>
                <p className="mt-2 text-sm">{speakingPart.cueCard.topic}</p>
                <ul className="mt-2 list-inside list-disc text-sm">
                  {speakingPart.cueCard.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {!speakingInPrep && speakingPart.part === 2 && speakingPart.cueCard && (
              <div className="mt-4">
                <p className="font-semibold">{speakingPart.cueCard.topic}</p>
                <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
                  {speakingPart.cueCard.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            )}

            {!speakingInPrep && speakingPart.part !== 2 && (
              <p className="mt-4 text-lg font-medium">{speakingPart.questions[speakingQIdx]}</p>
            )}

            {!speakingInPrep && !recordedKeys.has(speakingKey) && (
              <div className="mt-6">
                <AudioRecorder
                  key={speakingKey}
                  maxDuration={speakingPart.answerSeconds}
                  minDuration={5}
                  autoSubmit
                  onRecordingComplete={() => setProcessingKey(speakingKey)}
                  onTranscriptReady={(text) => {
                    setTranscripts((prev) => ({ ...prev, [speakingKey]: text }));
                    setRecordedKeys((prev) => new Set(prev).add(speakingKey));
                    setProcessingKey(null);
                  }}
                />
              </div>
            )}

            {processingKey === speakingKey && (
              <p className="mt-4 text-center text-sm text-slate-500">Processing…</p>
            )}

            {transcripts[speakingKey] && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                <p className="text-xs font-bold uppercase text-slate-400">Transcript</p>
                {transcripts[speakingKey]}
              </div>
            )}

            {recordedKeys.has(speakingKey) && (
              <button
                type="button"
                onClick={() => {
                  if (speakingPart.part === 2) {
                    if (speakingPartIdx < SPEAKING_PARTS.length - 1) {
                      setSpeakingPartIdx((i) => i + 1);
                      setSpeakingQIdx(0);
                    } else finishExam();
                    return;
                  }
                  if (speakingQIdx < speakingPart.questions.length - 1) {
                    setSpeakingQIdx((i) => i + 1);
                  } else if (speakingPartIdx < SPEAKING_PARTS.length - 1) {
                    const next = SPEAKING_PARTS[speakingPartIdx + 1];
                    setSpeakingPartIdx((i) => i + 1);
                    setSpeakingQIdx(0);
                    if (next.prepSeconds) {
                      setSpeakingInPrep(true);
                      setSpeakingPrepLeft(next.prepSeconds);
                    }
                  } else finishExam();
                }}
                className="mt-6 w-full rounded-lg bg-[#0d1b35] py-3 text-sm font-bold text-white"
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </ExamChrome>
    {listeningStickyStats ? (
      <StickySubmitBar
        answeredCount={listeningStickyStats.answered}
        totalQuestions={listeningStickyStats.total}
        onSubmit={() => advanceAfterCheck()}
        label="Submit Answers"
      />
    ) : null}
    </>
  );
}
