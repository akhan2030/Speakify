"use client";

import Link from "next/link";
import SessionTranscriptReview from "@/components/speaking/SessionTranscriptReview";
import type { TranscriptEntry, TranscriptReview } from "@/lib/speaking/transcriptReview";
import type { StructuredSpeakingScore } from "@/lib/speaking/scoringSchema";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type FeedbackData = {
  overallBand: number;
  criteria: {
    fluencyCoherence: number;
    lexicalResource: number;
    grammaticalRange: number;
    pronunciation: number;
  };
  criterionFeedback?: {
    fluency?: { band: number; note: string; evidence?: string };
    lexical?: { band: number; note: string; evidence?: string; flaggedWords?: string[] };
    grammar?: { band: number; note: string; evidence?: string; exampleError?: string };
    pronunciation?: { band: number; note: string; evidence?: string };
  };
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
  vocabularyChallengeDetailed?: Array<{
    word: string;
    from?: string;
    context?: string;
    personalized?: boolean;
  }>;
  sessionTranscript?: TranscriptEntry[];
  transcriptReview?: TranscriptReview | null;
  structuredScore?: StructuredSpeakingScore;
  fluencyMetrics?: StructuredSpeakingScore["fluency_metrics"];
  pronunciationMetrics?: StructuredSpeakingScore["pronunciation_metrics"];
};

function bandColor(band: number) {
  if (band >= 7) return "#0d9488";
  if (band >= 6) return "#c9972c";
  return "#dc2626";
}

const WORD_HINTS: Record<string, string> = {
  sustainable: "Able to continue without harming the environment or depleting resources.",
  infrastructure: "The basic physical systems of a country — roads, buildings, transport.",
  accommodate: "To provide space or adjust for someone or something.",
  contribute: "To give or add something to help achieve a result.",
  significantly: "In a way that is large or important enough to be noticed.",
};

function MiniProgressBar({ value }: { value: number }) {
  const pct = Math.min(100, (value / 9) * 100);
  const color = bandColor(value);
  return (
    <div style={{ height: "8px", background: "#f1f5f9", borderRadius: "4px", overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${pct}%`,
          background: color,
          borderRadius: "4px",
          transition: "width 0.6s ease",
        }}
      />
    </div>
  );
}

const CRITERION_CARDS = [
  {
    key: "fluency" as const,
    structuredKey: "fluency_coherence" as const,
    label: "Fluency & Coherence",
    scoreKey: "fluencyCoherence" as const,
    fallback:
      "Build longer answers with clear linking phrases and fewer restarts.",
  },
  {
    key: "lexical" as const,
    structuredKey: "lexical_resource" as const,
    label: "Lexical Resource",
    scoreKey: "lexicalResource" as const,
    fallback:
      "Upgrade repeated basic words with more precise topic vocabulary.",
  },
  {
    key: "grammar" as const,
    structuredKey: "grammatical_range_accuracy" as const,
    label: "Grammatical Range & Accuracy",
    scoreKey: "grammaticalRange" as const,
    fallback:
      "Control tense and sentence structure before adding more complex grammar.",
  },
  {
    key: "pronunciation" as const,
    structuredKey: "pronunciation" as const,
    label: "Pronunciation",
    scoreKey: "pronunciation" as const,
    fallback:
      "Pronunciation is estimated here. Practise word stress and sentence rhythm.",
  },
];

export default function FeedbackReport({
  feedback,
  bandHistory = [],
  onStartNext,
  onReturnHome,
}: {
  feedback: FeedbackData;
  bandHistory?: { sessionNumber: number; band: number; date: string }[];
  onStartNext: () => void;
  onReturnHome: () => void;
}) {
  const overallColor = bandColor(feedback.overallBand);
  const chartData = bandHistory
    .slice(-5)
    .map((h, index) => {
      const sessionNo = Number(h.sessionNumber);
      const band = Number(h.band);
      return {
        name:
          Number.isFinite(sessionNo) && sessionNo > 0 && sessionNo < 10000
            ? `S${sessionNo}`
            : `S${index + 1}`,
        band: Number.isFinite(band) ? band : 0,
      };
    })
    .filter((row) => row.band > 0);

  const improvements = (feedback.topImprovements || []).slice(0, 3);
  const vocabDetailed =
    feedback.vocabularyChallengeDetailed?.length
      ? feedback.vocabularyChallengeDetailed.slice(0, 5)
      : (feedback.vocabularyChallenge || []).slice(0, 5).map((word) => ({
          word,
          personalized: true as boolean | undefined,
          from: undefined as string | undefined,
          context: undefined as string | undefined,
        }));

  return (
    <div style={{ maxWidth: "800px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 600, color: "#0d1b35", marginBottom: "8px" }}>
        Session Complete
      </h1>
      <p style={{ color: "#888", fontSize: "14px", marginBottom: "2rem" }}>
        Your band score report from Sarah, your AI examiner
      </p>

      {/* Overall band */}
      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          padding: "2rem",
          textAlign: "center",
          marginBottom: "1.5rem",
        }}
      >
        <p style={{ fontSize: "13px", color: "#888", margin: "0 0 8px" }}>Overall Speaking Band</p>
        <p style={{ fontSize: "64px", fontWeight: 800, color: overallColor, margin: 0, lineHeight: 1 }}>
          {feedback.overallBand.toFixed(1)}
        </p>
      </div>

      {/* Criteria */}
      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#0d1b35", margin: "0 0 1rem" }}>
          IELTS Criteria Breakdown (25% each)
        </h2>
        {feedback.fluencyMetrics ? (
          <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 12px", lineHeight: 1.5 }}>
            Measured fluency: {feedback.fluencyMetrics.words_per_minute} WPM ·{" "}
            {feedback.fluencyMetrics.pause_count} pauses ·{" "}
            {feedback.fluencyMetrics.filler_word_count} fillers ·{" "}
            {feedback.fluencyMetrics.speaking_seconds}s speaking
            {feedback.pronunciationMetrics?.estimated
              ? " · Pronunciation estimated (no dedicated audio API)"
              : ""}
          </p>
        ) : null}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
          {CRITERION_CARDS.map((criterion) => {
            const structured = feedback.structuredScore?.criteria?.[criterion.structuredKey];
            const detail = feedback.criterionFeedback?.[criterion.key];
            const value =
              structured?.band ?? detail?.band ?? feedback.criteria[criterion.scoreKey];
            const deductions = structured?.deductions ?? [];
            return (
              <div
                key={criterion.key}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "12px",
                  padding: "14px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", marginBottom: "8px" }}>
                  <p style={{ fontSize: "13px", color: "#0d1b35", fontWeight: 700, margin: 0 }}>
                    {criterion.label}
                  </p>
                  <p style={{ fontSize: "13px", color: bandColor(value), fontWeight: 800, margin: 0 }}>
                    {value.toFixed(1)}
                  </p>
                </div>
                <MiniProgressBar value={value} />
                {deductions.length > 0 ? (
                  <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {deductions.map((deduction, index) => (
                      <div
                        key={`${criterion.key}-${index}`}
                        style={{
                          background: "#fff7ed",
                          border: "1px solid #fed7aa",
                          borderRadius: "8px",
                          padding: "8px",
                        }}
                      >
                        <p style={{ fontSize: "12px", color: "#9a3412", fontWeight: 700, margin: "0 0 4px" }}>
                          {deduction.band_impact < 0 ? `${deduction.band_impact}` : `-${Math.abs(deduction.band_impact)}`}{" "}
                          · {deduction.reason}
                        </p>
                        <p style={{ fontSize: "12px", color: "#64748b", margin: 0, fontStyle: "italic" }}>
                          Evidence: &ldquo;{deduction.evidence}&rdquo;
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <p style={{ fontSize: "13px", color: "#475569", margin: "10px 0 0", lineHeight: 1.55 }}>
                      {detail?.note || criterion.fallback}
                    </p>
                    {detail?.evidence ? (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#64748b",
                          fontStyle: "italic",
                          margin: "8px 0 0",
                          background: "#f8fafc",
                          borderRadius: "8px",
                          padding: "7px 8px",
                        }}
                      >
                        Evidence: &ldquo;{detail.evidence}&rdquo;
                      </p>
                    ) : null}
                  </>
                )}
                {structured?.strengths?.length ? (
                  <p style={{ fontSize: "12px", color: "#0d9488", margin: "8px 0 0" }}>
                    ✓ {structured.strengths[0]}
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Trend chart */}
      {chartData.length >= 2 && (
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#0d1b35", margin: "0 0 1rem" }}>
            Progress Trend
          </h2>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis domain={[4, 9]} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="band"
                stroke="#c9972c"
                strokeWidth={2}
                dot={{ fill: "#c9972c", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Session transcript */}
      <SessionTranscriptReview
        transcript={feedback.sessionTranscript}
        feedback={feedback as Record<string, unknown>}
        transcriptReview={feedback.transcriptReview}
      />

      {/* Top improvements */}
      {improvements.length > 0 && (
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#0d1b35", margin: "0 0 1rem" }}>
            Top Improvements
          </h2>
          {improvements.map((item, i) => (
            <div
              key={i}
              style={{
                borderLeft: "3px solid #c9972c",
                paddingLeft: "12px",
                marginBottom: i < improvements.length - 1 ? "1rem" : 0,
              }}
            >
              <p style={{ fontSize: "11px", fontWeight: 700, color: "#c9972c", margin: "0 0 4px" }}>
                {item.category}
              </p>
              <p style={{ fontSize: "13px", color: "#0d1b35", margin: "0 0 6px" }}>{item.issue}</p>
              {item.studentQuote && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    fontStyle: "italic",
                    margin: "0 0 4px",
                    background: "#f8fafc",
                    padding: "6px 8px",
                    borderRadius: "6px",
                  }}
                >
                  &ldquo;{item.studentQuote}&rdquo;
                </p>
              )}
              {item.improvedVersion && (
                <p style={{ fontSize: "12px", color: "#0d9488", margin: 0 }}>
                  ✓ {item.improvedVersion}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Strengths */}
      {(feedback.strengths?.length ?? 0) > 0 && (
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#0d1b35", margin: "0 0 1rem" }}>
            Strengths
          </h2>
          {feedback.strengths!.map((s, i) => (
            <p key={i} style={{ fontSize: "13px", color: "#0d9488", margin: "0 0 6px" }}>
              ✓ {s}
            </p>
          ))}
        </div>
      )}

      {/* Saudi-specific errors */}
      {(feedback.saudiSpecificErrors?.length ?? 0) > 0 && (
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#0d1b35", margin: "0 0 1rem" }}>
            Saudi-Specific Errors
          </h2>
          {feedback.saudiSpecificErrors!.map((err, i) => (
            <div
              key={i}
              style={{
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "8px",
                padding: "10px 12px",
                marginBottom: "8px",
              }}
            >
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#92400e", margin: "0 0 4px" }}>
                {err.type}
                {err.count ? ` (${err.count}×)` : ""}
              </p>
              <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 2px" }}>
                ✗ {err.example}
              </p>
              <p style={{ fontSize: "12px", color: "#0d9488", margin: 0 }}>✓ {err.correction}</p>
            </div>
          ))}
        </div>
      )}

      {/* Vocabulary challenge — transcript-derived upgrades */}
      {vocabDetailed.length > 0 && (
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: "16px",
            padding: "1.5rem",
            marginBottom: "2rem",
          }}
        >
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#0d1b35", margin: "0 0 1rem" }}>
            Vocabulary Challenge
          </h2>
          <p style={{ fontSize: "12px", color: "#64748b", margin: "0 0 12px" }}>
            Upgrades based on words and phrases you actually used in this session.
          </p>
          {vocabDetailed.map((item) => (
            <div key={item.word} style={{ marginBottom: "10px" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#0d1b35", margin: "0 0 2px" }}>
                {item.word}
                {item.personalized === false ? (
                  <span style={{ fontSize: "11px", color: "#94a3b8", marginLeft: "8px" }}>
                    (general)
                  </span>
                ) : null}
              </p>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                {item.from
                  ? `Try this instead of “${item.from}”${item.context ? ` — ${item.context}` : ""}`
                  : item.context ||
                    WORD_HINTS[item.word.toLowerCase()] ||
                    "Practice using this word in a full sentence about your daily life."}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
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
          Start next session →
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
          Practice vocabulary →
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
          Return to dashboard
        </button>
      </div>
    </div>
  );
}
