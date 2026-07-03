"use client";

import { useCallback, useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function bandColor(band: number | null) {
  if (band == null) return "#94a3b8";
  if (band >= 7) return "#0d9488";
  if (band >= 6) return "#c9972c";
  return "#dc2626";
}

type VocabWord = { id: string; word: string };

type ProgressData = {
  totalSessions: number;
  currentBand: number | null;
  bestBand: number | null;
  totalMinutes: number;
  bandHistory: { sessionNumber: number; band: number; date: string }[];
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
  const [markingId, setMarkingId] = useState<string | null>(null);

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
          todayVocabulary: json.todayVocabulary ?? [],
          lastImprovementTip: json.lastImprovementTip ?? null,
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [studentId]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress, refreshKey]);

  const markPracticed = async (id: string) => {
    setMarkingId(id);
    try {
      const res = await fetch("/api/speaking/session/vocabulary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        setData((prev) =>
          prev
            ? {
                ...prev,
                todayVocabulary: prev.todayVocabulary.filter((w) => w.id !== id),
              }
            : prev
        );
      }
    } finally {
      setMarkingId(null);
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

  const chartData = (data?.bandHistory ?? []).slice(-5).map((h) => ({
    name: `#${h.sessionNumber}`,
    band: h.band,
  }));

  return (
    <div
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

      {/* Row 2 — band trend */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#0d1b35", margin: "0 0 8px" }}>
          Your band over last 5 sessions
        </p>
        {chartData.length >= 2 ? (
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[4, 9]} tick={{ fontSize: 11 }} width={28} />
              <Tooltip formatter={(v) => (typeof v === "number" ? v.toFixed(1) : String(v ?? ""))} />
              <Line
                type="monotone"
                dataKey="band"
                stroke="#c9972c"
                strokeWidth={2}
                dot={{ fill: "#c9972c", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ fontSize: "12px", color: "#94a3b8", margin: 0 }}>
            Complete at least 2 sessions to see your band trend.
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
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {data!.todayVocabulary.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: "8px",
                  padding: "8px 12px",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: 600, color: "#0d1b35" }}>
                  {item.word}
                </span>
                <button
                  type="button"
                  onClick={() => markPracticed(item.id)}
                  disabled={markingId === item.id}
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    background: "#0d9488",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 10px",
                    cursor: markingId === item.id ? "wait" : "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {markingId === item.id ? "Saving…" : "Mark as practiced"}
                </button>
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
