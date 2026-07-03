"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  coachingLineForCriterion,
  CRITERION_META,
  findWeakestCriterion,
  headlineInsight,
  l1Explanation,
  type CriterionKey,
  type SpeakingCriteria,
} from "@/lib/speaking/mockFeedbackCoaching";
import MockVocabularyChallenge from "@/components/speaking/MockVocabularyChallenge";
import SessionTranscriptReview from "@/components/speaking/SessionTranscriptReview";
import type { TranscriptEntry, TranscriptReview } from "@/lib/speaking/transcriptReview";

export type MockFeedbackData = {
  overallBand: number;
  criteria: SpeakingCriteria;
  topImprovements?: {
    category: string;
    issue: string;
    example?: string;
    suggestion?: string;
    studentQuote?: string;
    improvedVersion?: string;
  }[];
  strengths?: string[];
  saudiSpecificErrors?: {
    type: string;
    example: string;
    correction: string;
    count?: number;
  }[];
  vocabularyChallenge?: string[];
  sessionTranscript?: TranscriptEntry[];
  transcriptReview?: TranscriptReview | null;
};

type MockJourneyPoint = {
  sessionNumber: number;
  overallBand: number | null;
};

type TabId = "breakdown" | "fix" | "vocab" | "strengths" | "transcript";

function bandColor(band: number) {
  if (band >= 7) return "#0d9488";
  if (band >= 6) return "#c9972c";
  return "#dc2626";
}

function useCountUp(target: number, active: boolean, durationMs = 1500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) {
      setValue(0);
      return;
    }
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - (1 - progress) ** 3;
      setValue(target * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, active, durationMs]);

  return value;
}

function AnimatedCriteriaBar({
  label,
  value,
  animate,
}: {
  label: string;
  value: number;
  animate: boolean;
}) {
  const display = useCountUp(value, animate, 1000);
  const pct = Math.min(100, (display / 9) * 100);
  const color = bandColor(value);

  return (
    <div style={{ marginBottom: "16px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "6px",
          alignItems: "baseline",
        }}
      >
        <span style={{ fontSize: "15px", fontWeight: 600, color: "#0d1b35" }}>{label}</span>
        <span style={{ fontSize: "14px", fontWeight: 700, color }}>
          {value.toFixed(1)} / 9.0
        </span>
      </div>
      <div
        style={{
          height: "10px",
          background: "#f1f5f9",
          borderRadius: "6px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: "6px",
            transition: "width 0.2s linear",
          }}
        />
      </div>
    </div>
  );
}

function MockJourneyStrip({
  points,
  targetBand,
  currentBand,
}: {
  points: MockJourneyPoint[];
  targetBand: number;
  currentBand: number;
}) {
  const sorted = [...points].filter((p) => p.overallBand != null).slice(-6);
  const firstBand = sorted[0]?.overallBand ?? currentBand;
  const delta = currentBand - (firstBand ?? currentBand);

  if (sorted.length <= 1) {
    return (
      <div
        style={{
          background: "white",
          borderRadius: "14px",
          border: "1px solid #e5e7eb",
          padding: "16px 20px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          marginBottom: "20px",
        }}
      >
        <p style={{ fontSize: "15px", fontWeight: 600, color: "#0d1b35", margin: "0 0 6px" }}>
          Your Mock Test Journey
        </p>
        <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
          First mock test completed! Take another next week to track your progress.
        </p>
      </div>
    );
  }

  const width = Math.max(280, sorted.length * 72);
  const min = Math.min(...sorted.map((p) => p.overallBand!)) - 0.5;
  const max = Math.max(...sorted.map((p) => p.overallBand!)) + 0.5;
  const range = Math.max(0.5, max - min);

  const coords = sorted.map((p, i) => {
    const x = 24 + (i / Math.max(1, sorted.length - 1)) * (width - 48);
    const y = 36 - ((p.overallBand! - min) / range) * 28;
    return { x, y, band: p.overallBand!, num: p.sessionNumber };
  });

  const polyline = coords.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <div
      style={{
        background: "white",
        borderRadius: "14px",
        border: "1px solid #e5e7eb",
        padding: "16px 20px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
        marginBottom: "20px",
      }}
    >
      <p style={{ fontSize: "15px", fontWeight: 600, color: "#0d1b35", margin: "0 0 12px" }}>
        Your Mock Test Journey
      </p>
      <div style={{ overflowX: "auto" }}>
        <svg width={width} height={72} style={{ display: "block", minWidth: "100%" }}>
          <polyline
            fill="none"
            stroke="#c9972c"
            strokeWidth="2"
            points={polyline}
          />
          {coords.map((c, i) => (
            <g key={c.num}>
              <circle cx={c.x} cy={c.y} r="5" fill="#c9972c" />
              <text
                x={c.x}
                y={c.y - 10}
                textAnchor="middle"
                fontSize="11"
                fill="#0d1b35"
                fontWeight="600"
              >
                {c.band.toFixed(1)}
              </text>
              <text x={c.x} y={64} textAnchor="middle" fontSize="10" fill="#94a3b8">
                #{c.num}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "8px",
          fontSize: "13px",
          color: "#64748b",
        }}
      >
        <span>🎯 Target: {targetBand.toFixed(1)}</span>
        <span style={{ color: delta >= 0 ? "#0d9488" : "#dc2626", fontWeight: 600 }}>
          {delta >= 0 ? "📈" : "📉"} {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)} overall
        </span>
      </div>
    </div>
  );
}

export default function MockSpeakingFeedbackReport({
  feedback,
  mockJourney = [],
  targetBand = 6.5,
  onStartNext,
  onStartPractice,
  onReturnHome,
}: {
  feedback: MockFeedbackData;
  mockJourney?: MockJourneyPoint[];
  targetBand?: number;
  onStartNext: () => void;
  onStartPractice?: () => void;
  onReturnHome: () => void;
}) {
  const [showFullReport, setShowFullReport] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("breakdown");
  const [barsAnimate, setBarsAnimate] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const animatedScore = useCountUp(feedback.overallBand, true);
  const insight = useMemo(
    () => headlineInsight(feedback.criteria, targetBand),
    [feedback.criteria, targetBand]
  );

  const previousBand = useMemo(() => {
    const prior = mockJourney.filter((p) => p.overallBand != null);
    if (prior.length < 2) return null;
    return prior[prior.length - 2]?.overallBand ?? null;
  }, [mockJourney]);

  const deltaFromLast =
    previousBand != null ? feedback.overallBand - previousBand : null;

  const revealReport = useCallback(() => {
    setShowFullReport(true);
    setBarsAnimate(true);
    requestAnimationFrame(() => {
      reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const practiceFocus = (key: CriterionKey) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(
        "speaking_practice_focus",
        CRITERION_META[key].practiceFocus
      );
    }
    (onStartPractice ?? onStartNext)();
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: "breakdown", label: "Score Breakdown" },
    { id: "fix", label: "What to Fix" },
    { id: "transcript", label: "Transcript" },
    { id: "vocab", label: "Vocabulary Coach" },
    { id: "strengths", label: "Strengths" },
  ];

  const weakest = findWeakestCriterion(feedback.criteria);
  const improvements = feedback.topImprovements ?? [];
  const errors = feedback.saudiSpecificErrors ?? [];
  const strengths = feedback.strengths ?? [];
  const vocab = feedback.vocabularyChallenge ?? [];

  return (
    <div style={{ maxWidth: "820px", margin: "0 auto" }}>
      <style>{`
        @keyframes mockScorePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes mockFadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes mockCheckPop {
          0% { transform: scale(0.96); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .mock-tab-btn:hover { transform: translateY(-1px); }
        .mock-criterion-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
      `}</style>

      {/* Stage 1 — Hero */}
      <div
        style={{
          background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f0fdf4 100%)",
          borderRadius: "16px",
          padding: "2.5rem 1.5rem",
          textAlign: "center",
          marginBottom: showFullReport ? "2rem" : "1.5rem",
          boxShadow: "0 4px 24px rgba(13,27,53,0.08)",
        }}
      >
        <p
          style={{
            fontSize: "56px",
            fontWeight: 700,
            color: bandColor(feedback.overallBand),
            margin: 0,
            lineHeight: 1,
            animation: "mockScorePulse 1.5s ease-out",
          }}
        >
          {animatedScore.toFixed(1)}
        </p>
        <p style={{ fontSize: "13px", color: "#64748b", margin: "8px 0 16px" }}>
          Mock Speaking Band
        </p>
        <p
          style={{
            fontSize: "20px",
            fontWeight: 500,
            color: "#334155",
            margin: "0 auto 12px",
            maxWidth: "480px",
            lineHeight: 1.45,
          }}
        >
          {insight}
        </p>
        <p style={{ fontSize: "14px", color: "#94a3b8", margin: "0 0 24px" }}>
          {deltaFromLast != null
            ? `${deltaFromLast >= 0 ? "↑" : "↓"} ${Math.abs(deltaFromLast).toFixed(1)} from last mock`
            : "First attempt — keep going"}
        </p>
        {!showFullReport ? (
          <button
            type="button"
            onClick={revealReport}
            style={{
              background: "#c9972c",
              color: "white",
              border: "none",
              borderRadius: "12px",
              padding: "14px 28px",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
              transition: "opacity 0.3s ease",
            }}
          >
            See Full Report ↓
          </button>
        ) : null}
      </div>

      {/* Stage 2 — Full report */}
      {showFullReport ? (
        <div ref={reportRef} style={{ animation: "mockFadeUp 0.4s ease-out" }}>
          <MockJourneyStrip
            points={mockJourney}
            targetBand={targetBand}
            currentBand={feedback.overallBand}
          />

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                className="mock-tab-btn"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: "1 1 auto",
                  minWidth: "120px",
                  padding: "10px 14px",
                  borderRadius: "10px",
                  border:
                    activeTab === tab.id
                      ? "2px solid #c9972c"
                      : "1px solid #e2e8f0",
                  background: activeTab === tab.id ? "#fffbeb" : "white",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: activeTab === tab.id ? "#0d1b35" : "#64748b",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div
            style={{
              background: "white",
              borderRadius: "14px",
              border: "1px solid #e5e7eb",
              padding: "1.5rem",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              marginBottom: "1.5rem",
              minHeight: "200px",
            }}
          >
            {activeTab === "breakdown" ? (
              <div>
                {(Object.keys(CRITERION_META) as CriterionKey[]).map((key, i) => (
                  <div
                    key={key}
                    className="mock-criterion-card"
                    style={{
                      border: "1px solid #f1f5f9",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      marginBottom: "12px",
                      transition: "all 0.3s ease",
                      animation: `mockFadeUp 0.4s ease-out ${i * 0.08}s both`,
                      borderLeft:
                        key === weakest ? "4px solid #c9972c" : "4px solid transparent",
                    }}
                  >
                    <AnimatedCriteriaBar
                      label={CRITERION_META[key].label}
                      value={feedback.criteria[key]}
                      animate={barsAnimate}
                    />
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#64748b",
                        fontStyle: "italic",
                        margin: "8px 0 12px",
                        lineHeight: 1.5,
                      }}
                    >
                      {coachingLineForCriterion(key, feedback.criteria[key])}
                    </p>
                    <button
                      type="button"
                      onClick={() => practiceFocus(key)}
                      style={{
                        background: "none",
                        border: "1px solid #0d9488",
                        color: "#0d9488",
                        borderRadius: "8px",
                        padding: "8px 12px",
                        fontSize: "13px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Practice This →
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            {activeTab === "fix" ? (
              <div>
                {improvements.length > 0 ? (
                  improvements.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        borderLeft: "3px solid #c9972c",
                        paddingLeft: "12px",
                        marginBottom: "16px",
                      }}
                    >
                      <p
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#c9972c",
                          margin: "0 0 4px",
                        }}
                      >
                        {item.category}
                      </p>
                      <p style={{ fontSize: "15px", color: "#0d1b35", margin: "0 0 6px" }}>
                        {item.issue}
                      </p>
                      {item.studentQuote ? (
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#64748b",
                            fontStyle: "italic",
                            background: "#f8fafc",
                            padding: "8px",
                            borderRadius: "6px",
                          }}
                        >
                          &ldquo;{item.studentQuote}&rdquo;
                        </p>
                      ) : null}
                      {item.improvedVersion ? (
                        <p style={{ fontSize: "13px", color: "#0d9488", marginTop: "6px" }}>
                          ✓ {item.improvedVersion}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#64748b", fontSize: "14px" }}>
                    No major issues flagged — focus on your weakest criterion in the
                    breakdown tab.
                  </p>
                )}

                {errors.length > 0 ? (
                  <div style={{ marginTop: "20px" }}>
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#0d1b35",
                        marginBottom: "12px",
                      }}
                    >
                      Saudi / Arabic L1 patterns
                    </h3>
                    {errors.map((err, i) => (
                      <details
                        key={i}
                        style={{
                          background: "#fffbeb",
                          border: "1px solid #fde68a",
                          borderRadius: "10px",
                          padding: "10px 12px",
                          marginBottom: "10px",
                        }}
                      >
                        <summary
                          style={{
                            fontSize: "13px",
                            fontWeight: 600,
                            color: "#92400e",
                            cursor: "pointer",
                          }}
                        >
                          {err.type}
                          {err.count ? ` (${err.count}×)` : ""}
                        </summary>
                        <p style={{ fontSize: "13px", color: "#64748b", margin: "8px 0 4px" }}>
                          ✗ {err.example}
                        </p>
                        <p style={{ fontSize: "13px", color: "#0d9488", margin: "0 0 8px" }}>
                          ✓ {err.correction}
                        </p>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#475569",
                            margin: 0,
                            lineHeight: 1.5,
                            background: "#f8fafc",
                            padding: "8px 10px",
                            borderRadius: "8px",
                          }}
                        >
                          💡 Why this happens: {l1Explanation(err.type)}
                        </p>
                      </details>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            {activeTab === "vocab" ? <MockVocabularyChallenge words={vocab} /> : null}

            {activeTab === "transcript" ? (
              <SessionTranscriptReview
                embedded
                transcript={feedback.sessionTranscript}
                feedback={feedback as Record<string, unknown>}
                transcriptReview={feedback.transcriptReview}
              />
            ) : null}

            {activeTab === "strengths" ? (
              <div>
                {strengths.length > 0 ? (
                  strengths.map((s, i) => (
                    <p
                      key={i}
                      style={{
                        fontSize: "15px",
                        color: "#0d9488",
                        margin: "0 0 10px",
                        animation: `mockFadeUp 0.3s ease-out ${i * 0.1}s both`,
                      }}
                    >
                      ✓ {s}
                    </p>
                  ))
                ) : (
                  <p style={{ fontSize: "14px", color: "#64748b" }}>
                    Complete more mock tests to build a strengths profile.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={onStartNext}
              style={{
                background: "#0d9488",
                color: "white",
                border: "none",
                borderRadius: "10px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Take another mock →
            </button>
            <Link
              href="/dashboard/ielts/student/vocabulary"
              style={{
                background: "#c9972c",
                color: "white",
                borderRadius: "10px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              Vocabulary bank →
            </Link>
            <button
              type="button"
              onClick={onReturnHome}
              style={{
                background: "white",
                color: "#0d1b35",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Back to Speaking
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
