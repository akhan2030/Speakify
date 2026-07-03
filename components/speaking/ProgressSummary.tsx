"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  buildCriteriaChartData,
  CRITERION_CHART_LINES,
  type CriteriaHistoryPoint,
} from "@/lib/speaking/progressChartInsight";
function bandColor(band: number | null) {
  if (band == null) return "#94a3b8";
  if (band >= 7) return "#0d9488";
  if (band >= 6) return "#c9972c";
  return "#dc2626";
}

type VocabWord = {
  id: string;
  word: string;
  reviewCount?: number;
  nextReviewDate?: string;
};

type ProgressData = {
  totalSessions: number;
  currentBand: number | null;
  bestBand: number | null;
  totalMinutes: number;
  bandHistory: CriteriaHistoryPoint[];
  chartInsight: string | null;
  todayVocabulary: VocabWord[];
  lastImprovementTip: string | null;
};
function StatCard({
  label,
  value,
  color = "#0d1b35",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      style={{
        flex: "1 1 120px",
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "12px 14px",
      }}
    >
      <p style={{ fontSize: "11px", color: "#888", margin: 0 }}>{label}</p>
      <p style={{ fontSize: "22px", fontWeight: 700, color, margin: "4px 0 0" }}>{value}</p>
    </div>
  );
}

export default function ProgressSummary({
  studentId,
  refreshKey = 0,
}: {
  studentId?: string;
  refreshKey?: number;
}) {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingId, setCheckingId] = useState<string | null>(null);
  const [sentences, setSentences] = useState<Record<string, string>>({});
  const [vocabFeedback, setVocabFeedback] = useState<
    Record<string, { correct: boolean; message: string }>
  >({});

  const loadProgress = useCallback(() => {
    if (!studentId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch("/api/speaking/session/progress")
      .then((r) => r.json())
      .then((json) => {
        setData({
          totalSessions: json.totalSessions ?? 0,
          currentBand: json.currentBand ?? null,
          bestBand: json.bestBand ?? null,
          totalMinutes: json.totalMinutes ?? 0,
          bandHistory: json.bandHistory ?? [],
          chartInsight: json.chartInsight ?? null,
          todayVocabulary: json.todayVocabulary ?? [],          lastImprovementTip: json.lastImprovementTip ?? null,
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress, refreshKey]);

  const checkVocabulary = async (item: VocabWord) => {
    const sentence = sentences[item.id]?.trim();
    if (!sentence) return;

    setCheckingId(item.id);
    try {
      const res = await fetch("/api/speaking/session/vocabulary-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, word: item.word, sentence }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Could not check your sentence");
      }

      setVocabFeedback((prev) => ({
        ...prev,
        [item.id]: {
          correct: json.correct === true,
          message: String(json.message ?? ""),
        },
      }));

      if (json.correct === true) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                todayVocabulary: prev.todayVocabulary.filter((w) => w.id !== item.id),
              }
            : prev
        );
      }
    } catch (err) {
      setVocabFeedback((prev) => ({
        ...prev,
        [item.id]: {
          correct: false,
          message: err instanceof Error ? err.message : "Could not check your sentence",
        },
      }));
    } finally {
      setCheckingId(null);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          padding: "1.5rem",
        }}
      >
        <p style={{ fontSize: "13px", color: "#888", margin: 0 }}>Loading your progress…</p>
      </div>
    );
  }

  const chartData = buildCriteriaChartData(data?.bandHistory ?? []);
  const hasCriteriaTrend = chartData.some((point) =>
    CRITERION_CHART_LINES.some((line) => point[line.key] != null)
  );

  return (    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "1.5rem",
      }}
    >
      <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#0d1b35", margin: "0 0 1.25rem" }}>
        Your Speaking Progress
      </h3>

      {/* Row 1 — stat cards */}
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <StatCard label="Total sessions" value={String(data?.totalSessions ?? 0)} />
        <StatCard
          label="Current band"
          value={data?.currentBand != null ? data.currentBand.toFixed(1) : "—"}
          color={bandColor(data?.currentBand ?? null)}
        />
        <StatCard
          label="Best band"
          value={data?.bestBand != null ? data.bestBand.toFixed(1) : "—"}
          color={bandColor(data?.bestBand ?? null)}
        />
        <StatCard label="Total minutes" value={String(data?.totalMinutes ?? 0)} />
      </div>

      {/* Row 2 — criteria trends */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#0d1b35", margin: "0 0 8px" }}>
          Criteria trends over last 5 sessions
        </p>
        {chartData.length >= 2 && hasCriteriaTrend ? (
          <>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis domain={[4, 9]} tick={{ fontSize: 11 }} width={28} />
                <Tooltip
                  formatter={(value, name) => {
                    if (typeof value !== "number") return ["—", String(name ?? "")];
                    const label =
                      CRITERION_CHART_LINES.find((line) => line.key === name)?.label ??
                      String(name ?? "");
                    return [value.toFixed(1), label];
                  }}
                />
                <Legend
                  iconType="line"
                  wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                />
                {CRITERION_CHART_LINES.map((line) => (
                  <Line
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    name={line.label}
                    stroke={line.color}
                    strokeWidth={2}
                    dot={{ fill: line.color, r: 3 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
            {data?.chartInsight ? (
              <p
                style={{
                  fontSize: "13px",
                  color: "#475569",
                  margin: "10px 0 0",
                  lineHeight: 1.5,
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  padding: "10px 12px",
                }}
              >
                {data.chartInsight}
              </p>
            ) : null}
          </>
        ) : (
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
            Complete at least 2 sessions to see how each criterion is moving.
          </p>
        )}
      </div>
      {/* Row 3 — vocabulary challenge */}
      <div
        style={{
          borderTop: "1px solid #f1f5f9",
          paddingTop: "1.25rem",
          marginBottom: "1.25rem",
        }}
      >
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#0d1b35", margin: "0 0 10px" }}>
          Today&apos;s vocabulary challenge
        </p>
        {(data?.todayVocabulary?.length ?? 0) > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data!.todayVocabulary.map((item) => (
              <div
                key={item.id}
                style={{
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "10px",
                  padding: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "10px",
                    alignItems: "baseline",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ fontSize: "15px", fontWeight: 700, color: "#0d1b35" }}>
                    {item.word}
                  </span>
                  <span style={{ fontSize: "11px", color: "#92400e", fontWeight: 600 }}>
                    Review {Number(item.reviewCount ?? 0) + 1}
                  </span>
                </div>

                <label
                  htmlFor={`vocab-${item.id}`}
                  style={{ fontSize: "12px", fontWeight: 600, color: "#64748b" }}
                >
                  Use this word in a sentence.
                </label>
                <div style={{ display: "flex", gap: "8px", marginTop: "6px", flexWrap: "wrap" }}>
                  <input
                    id={`vocab-${item.id}`}
                    type="text"
                    value={sentences[item.id] ?? ""}
                    onChange={(e) =>
                      setSentences((prev) => ({ ...prev, [item.id]: e.target.value }))
                    }
                    placeholder={`Write a sentence with "${item.word}"…`}
                    style={{
                      flex: "1 1 220px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "8px",
                      padding: "9px 10px",
                      fontSize: "13px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => checkVocabulary(item)}
                    disabled={checkingId === item.id || !sentences[item.id]?.trim()}
                    style={{
                      fontSize: "12px",
                      fontWeight: 700,
                      background: "#0d9488",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      padding: "9px 12px",
                      cursor: checkingId === item.id ? "wait" : "pointer",
                      opacity:
                        checkingId === item.id || !sentences[item.id]?.trim() ? 0.6 : 1,
                    }}
                  >
                    {checkingId === item.id ? "Checking…" : "Check ✓"}
                  </button>
                </div>
                {vocabFeedback[item.id] ? (
                  <p
                    style={{
                      fontSize: "12px",
                      color: vocabFeedback[item.id].correct ? "#0d9488" : "#b45309",
                      margin: "8px 0 0",
                      lineHeight: 1.45,
                    }}
                  >
                    {vocabFeedback[item.id].correct ? "✅" : "❌"}{" "}
                    {vocabFeedback[item.id].message}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
            Complete a speaking session to get today&apos;s vocabulary.
          </p>
        )}
      </div>

      {/* Row 4 — quick tips */}
      <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1.25rem" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#0d1b35", margin: "0 0 8px" }}>
          Quick tip
        </p>
        {data?.lastImprovementTip ? (
          <p
            style={{
              fontSize: "13px",
              color: "#64748b",
              margin: 0,
              lineHeight: 1.6,
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              padding: "10px 12px",
            }}
          >
            <span style={{ fontWeight: 600, color: "#0d9488" }}>From your last session: </span>
            {data.lastImprovementTip}
          </p>
        ) : (
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
            Complete your first session to get personalised tips.
          </p>
        )}
      </div>
    </div>
  );
}
