"use client";

import { Suspense, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageSpinner } from "@/components/StudentSidebar";
import SkillBandHeader from "@/components/ielts/SkillBandHeader";
import ActiveSession from "@/components/speaking/ActiveSession";
import FeedbackReport from "@/components/speaking/FeedbackReport";
import MockSpeakingFeedbackReport from "@/components/speaking/MockSpeakingFeedbackReport";
import ProgressSummary from "@/components/speaking/ProgressSummary";
import NoSpeechDetected from "@/components/speaking/NoSpeechDetected";

type Part = 1 | 2 | 3;
type Mode = "home" | "practice" | "mock" | "feedback" | "no_speech";

type CueCard = {
  id: string;
  topic: string;
  prompt: string;
  bullets: string[];
  closing: string;
};

function SpeakingPartnerContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const studentId = session?.user?.id;

  const [mode, setMode] = useState<Mode>("home");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentPart, setCurrentPart] = useState<Part>(1);
  const [conversationHistory, setConversationHistory] = useState<
    { role: "student" | "examiner"; text: string }[]
  >([]);
  const [examinerSpeech, setExaminerSpeech] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isExaminerSpeaking, setIsExaminerSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [cueCard, setCueCard] = useState<CueCard | null>(null);
  const [sessionNumber, setSessionNumber] = useState(0);
  const [feedback, setFeedback] = useState<Record<string, unknown> | null>(null);
  const [bandHistory, setBandHistory] = useState<
    { sessionNumber: number; band: number; date: string }[]
  >([]);
  const [part2Timer, setPart2Timer] = useState<number | null>(null);
  const [part2Phase, setPart2Phase] = useState<"prep" | "speaking" | "done">("prep");
  const [sessionStatus, setSessionStatus] = useState<
    "idle" | "active" | "scoring" | "complete"
  >("idle");
  const [starting, setStarting] = useState(false);
  const [progressRefreshKey, setProgressRefreshKey] = useState(0);
  const [feedbackSessionType, setFeedbackSessionType] = useState<"practice" | "mock">(
    "practice"
  );
  const [mockJourney, setMockJourney] = useState<
    { sessionNumber: number; overallBand: number | null }[]
  >([]);
  const [noSpeechMessage, setNoSpeechMessage] = useState<string | null>(null);

  const resetSessionState = useCallback(() => {
    setSessionId(null);
    setCurrentPart(1);
    setConversationHistory([]);
    setExaminerSpeech("");
    setIsListening(false);
    setIsExaminerSpeaking(false);
    setTranscript("");
    setCueCard(null);
    setSessionNumber(0);
    setPart2Timer(null);
    setPart2Phase("prep");
    setSessionStatus("idle");
  }, []);

  const startSession = async (type: "practice" | "mock") => {
    if (!studentId || starting) return;
    setStarting(true);

    try {
      const res = await fetch("/api/speaking/session/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          sessionType: type,
          programme: "ielts",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not start session");

      resetSessionState();
      setSessionId(data.sessionId);
      setSessionNumber(data.sessionNumber);
      setCueCard(data.cueCard);
      setMode(type);
    } catch (err) {
      console.error(err);
      alert(
        err instanceof Error
          ? err.message
          : "Could not start session. Make sure speaking tables are set up in Supabase."
      );
    } finally {
      setStarting(false);
    }
  };

  const handleComplete = async (fb: unknown) => {
    const result = fb as Record<string, unknown>;
    if (result.insufficientSpeech) {
      setNoSpeechMessage(
        typeof result.message === "string"
          ? result.message
          : "No speech detected. Please complete the speaking session before requesting a score."
      );
      setMode("no_speech");
      return;
    }

    setFeedback(result);
    setFeedbackSessionType(mode === "mock" ? "mock" : "practice");
    setProgressRefreshKey((k) => k + 1);
    try {
      const prog = await fetch("/api/speaking/session/progress");
      const data = await prog.json();
      setBandHistory(data.bandHistory || []);
    } catch {
      setBandHistory([]);
    }
    if (mode === "mock") {
      try {
        const hist = await fetch("/api/speaking/session/history?mockOnly=true");
        const data = await hist.json();
        setMockJourney(
          (data.sessions ?? []).map(
            (s: { sessionNumber: number; overallBand: number | null }) => ({
              sessionNumber: s.sessionNumber,
              overallBand: s.overallBand,
            })
          )
        );
      } catch {
        setMockJourney([]);
      }
    } else {
      setMockJourney([]);
    }
    setMode("feedback");
  };

  if (mode === "no_speech") {
    return (
      <NoSpeechDetected
        message={noSpeechMessage ?? undefined}
        onTryAgain={() => {
          setNoSpeechMessage(null);
          resetSessionState();
          setMode("home");
        }}
      />
    );
  }

  if (mode === "feedback" && feedback && !("insufficientSpeech" in feedback)) {
    if (feedbackSessionType === "mock") {
      return (
        <MockSpeakingFeedbackReport
          feedback={
            feedback as Parameters<typeof MockSpeakingFeedbackReport>[0]["feedback"]
          }
          mockJourney={mockJourney}
          onStartNext={() => {
            setFeedback(null);
            resetSessionState();
            startSession("mock");
          }}
          onStartPractice={() => {
            setFeedback(null);
            resetSessionState();
            startSession("practice");
          }}
          onReturnHome={() => {
            setFeedback(null);
            resetSessionState();
            setMode("home");
          }}
        />
      );
    }

    return (
      <FeedbackReport
        feedback={feedback as Parameters<typeof FeedbackReport>[0]["feedback"]}
        bandHistory={bandHistory}
        onStartNext={() => {
          setFeedback(null);
          resetSessionState();
          startSession("practice");
        }}
        onReturnHome={() => {
          setFeedback(null);
          resetSessionState();
          router.push("/dashboard/ielts/student");
        }}
      />
    );
  }

  if (mode === "practice" || mode === "mock") {
    return (
      <ActiveSession
        sessionId={sessionId}
        sessionNumber={sessionNumber}
        currentPart={currentPart}
        setCurrentPart={setCurrentPart}
        conversationHistory={conversationHistory}
        setConversationHistory={setConversationHistory}
        examinerSpeech={examinerSpeech}
        setExaminerSpeech={setExaminerSpeech}
        isListening={isListening}
        setIsListening={setIsListening}
        isExaminerSpeaking={isExaminerSpeaking}
        setIsExaminerSpeaking={setIsExaminerSpeaking}
        transcript={transcript}
        setTranscript={setTranscript}
        cueCard={cueCard}
        part2Timer={part2Timer}
        setPart2Timer={setPart2Timer}
        part2Phase={part2Phase}
        setPart2Phase={setPart2Phase}
        sessionStatus={sessionStatus}
        setSessionStatus={setSessionStatus}
        sessionType={mode}
        studentId={studentId}
        onComplete={handleComplete}
      />
    );
  }

  return (
    <div style={{ maxWidth: "800px" }}>
      <h1
        style={{
          fontSize: "22px",
          fontWeight: 600,
          color: "#0d1b35",
          marginBottom: "8px",
        }}
      >
        Speaking Practice
      </h1>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "2rem" }}>
        Choose your practice mode below
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1.5rem",
          marginBottom: "2rem",
        }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => startSession("practice")}
          onKeyDown={(e) => e.key === "Enter" && startSession("practice")}
          style={{
            background: "white",
            border: "2px solid #0d9488",
            borderRadius: "16px",
            padding: "2rem",
            cursor: starting ? "wait" : "pointer",
            transition: "all 0.2s",
            opacity: starting ? 0.7 : 1,
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "1rem" }}>🎤</div>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#0d1b35",
              margin: "0 0 8px",
            }}
          >
            Daily Speaking Practice
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "#0d9488",
              fontWeight: 600,
              margin: "0 0 12px",
            }}
          >
            Talk to your AI examiner — live conversation
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "#888",
              margin: "0 0 1rem",
              lineHeight: 1.6,
            }}
          >
            Have a real conversation with Sarah, your AI IELTS examiner. She listens,
            responds, and asks follow-up questions — just like the real exam.
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["Parts 1, 2 & 3", "Live feedback", "15 minutes", "Band score"].map(
              (tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: "11px",
                    background: "#f0fdf4",
                    color: "#0d9488",
                    padding: "3px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {tag}
                </span>
              )
            )}
          </div>
          <div
            style={{
              marginTop: "1.5rem",
              background: "#0d9488",
              color: "white",
              padding: "10px",
              borderRadius: "8px",
              textAlign: "center",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Start Practice Session →
          </div>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => startSession("mock")}
          onKeyDown={(e) => e.key === "Enter" && startSession("mock")}
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "2rem",
            cursor: starting ? "wait" : "pointer",
            opacity: starting ? 0.7 : 1,
          }}
        >
          <div style={{ fontSize: "40px", marginBottom: "1rem" }}>📝</div>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 600,
              color: "#0d1b35",
              margin: "0 0 8px",
            }}
          >
            Mock Speaking Test
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "#c9972c",
              fontWeight: 600,
              margin: "0 0 12px",
            }}
          >
            Full exam simulation — record and submit
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "#888",
              margin: "0 0 1rem",
              lineHeight: 1.6,
            }}
          >
            Simulate the real IELTS Speaking test exactly. No interruptions. Timed.
            Full band score report when you finish.
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {["All 3 parts", "Timed", "14 minutes", "Band report"].map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "11px",
                  background: "#fffbeb",
                  color: "#c9972c",
                  padding: "3px 8px",
                  borderRadius: "4px",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div
            style={{
              marginTop: "1.5rem",
              background: "#c9972c",
              color: "white",
              padding: "10px",
              borderRadius: "8px",
              textAlign: "center",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Start Mock Test →
          </div>
        </div>
      </div>

      <ProgressSummary studentId={studentId} refreshKey={progressRefreshKey} />

      <div style={{ marginTop: "1rem", textAlign: "right" }}>
        <button
          type="button"
          onClick={() => router.push("/dashboard/ielts/student/speaking/history")}
          style={{
            background: "none",
            border: "none",
            color: "#0d9488",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          View history →
        </button>
      </div>

      <button
        type="button"
        onClick={() => router.push("/dashboard/ielts/student")}
        style={{
          marginTop: "1.5rem",
          background: "none",
          border: "none",
          color: "#64748b",
          fontSize: "13px",
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        ← Back to dashboard
      </button>
    </div>
  );
}

export default function IeltsSpeakingPage() {
  return (
    <main className="min-h-screen flex-1 bg-slate-50 p-4 pb-24 md:p-6 md:pb-6">
      <SkillBandHeader
        skill="speaking"
        title="Speaking"
        subtitle="AI examiner Sarah — live conversation across Parts 1, 2 & 3"
      />
      <Suspense fallback={<PageSpinner />}>
        <SpeakingPartnerContent />
      </Suspense>
    </main>
  );
}
