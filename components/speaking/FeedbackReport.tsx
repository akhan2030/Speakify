"use client";

import Link from "next/link";
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

function CriteriaBar({ label, value }: { label: string; value: number }) {
  const pct = Math.min(100, (value / 9) * 100);
  const color = bandColor(value);
  return (
    <div style={{ marginBottom: "12px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
        <span style={{ fontSize: "13px", color: "#0d1b35", fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color }}>{value.toFixed(1)}</span>
      </div>
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
    </div>
  );
}

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
  const chartData = bandHistory.slice(-5).map((h) => ({
    name: `#${h.sessionNumber}`,
    band: h.band,
  }));

  const improvements = (feedback.topImprovements || []).slice(0, 3);
  const vocab = (feedback.vocabularyChallenge || []).slice(0, 5);

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
          Criteria Breakdown
        </h2>
        <CriteriaBar label="Fluency & Coherence" value={feedback.criteria.fluencyCoherence} />
        <CriteriaBar label="Lexical Resource" value={feedback.criteria.lexicalResource} />
        <CriteriaBar label="Grammatical Range" value={feedback.criteria.grammaticalRange} />
        <CriteriaBar label="Pronunciation" value={feedback.criteria.pronunciation} />
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

      {/* Vocabulary challenge */}
      {vocab.length > 0 && (
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
          {vocab.map((word) => (
            <div key={word} style={{ marginBottom: "10px" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "#0d1b35", margin: "0 0 2px" }}>
                {word}
              </p>
              <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
                {WORD_HINTS[word.toLowerCase()] ||
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
