"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { normalizeTriggerPattern } from "@/lib/growthRoadmap/extractDeductions";
import type { GrowthRoadmapItem } from "@/components/growth/GrowthRoadmapPanel";

export default function RoadmapPracticeLink({
  skill,
  criterion,
  errorType,
  reason,
  programme = "ielts",
}: {
  skill: "speaking" | "writing";
  criterion: string;
  errorType?: string | null;
  reason?: string;
  programme?: "ielts" | "ielts_general";
}) {
  const [items, setItems] = useState<GrowthRoadmapItem[]>([]);

  useEffect(() => {
    void fetch("/api/student/growth-roadmap")
      .then((res) => res.json())
      .then((data) => {
        setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch(() => setItems([]));
  }, []);

  const triggerPattern = useMemo(() => {
    const fromType = normalizeTriggerPattern(errorType);
    if (fromType) return fromType;
    const lower = String(reason || "").toLowerCase();
    if (/filler|hesitat/.test(lower)) return "filler_word_overuse";
    if (/repetit|basic vocab/.test(lower)) return "repetitive_vocabulary";
    if (/past tense|tense/.test(lower)) return "past_tense_inconsistency";
    if (/run-on|run on/.test(lower)) return "run_on_sentences";
    if (/linking|coherence/.test(lower)) return "weak_coherence_markers";
    if (/intensifier|very\s/.test(lower)) return "redundant_intensifiers";
    if (/stress|pronunciation/.test(lower)) return "word_stress_error";
    return null;
  }, [errorType, reason]);

  const match = useMemo(() => {
    if (!triggerPattern) return null;
    return (
      items.find(
        (item) =>
          item.skill === skill &&
          item.trigger_pattern === triggerPattern &&
          item.status !== "resolved"
      ) ?? null
    );
  }, [items, skill, triggerPattern]);

  if (!match) return null;

  const href =
    match.task_href ??
    (skill === "speaking"
      ? programme === "ielts_general"
        ? "/dashboard/ielts-general/student/speaking?mode=practice"
        : "/dashboard/ielts/student/speaking?mode=practice"
      : programme === "ielts_general"
        ? "/dashboard/ielts-general/student/writing"
        : "/dashboard/ielts/student/writing");

  return (
    <div
      style={{
        marginTop: "8px",
        padding: "8px 10px",
        background: "#f0fdfa",
        border: "1px solid #99f6e4",
        borderRadius: "8px",
      }}
    >
      <p style={{ fontSize: "11px", fontWeight: 700, color: "#0d9488", margin: "0 0 4px" }}>
        Recommended: {match.task_title} (~{match.estimated_minutes} min)
      </p>
      <p style={{ fontSize: "11px", color: "#475569", margin: "0 0 6px" }}>
        Estimated impact: +{match.estimated_band_impact.toFixed(1)} to {match.criterion_label} if
        resolved
      </p>
      <Link
        href={href}
        style={{
          fontSize: "12px",
          fontWeight: 700,
          color: "#0d9488",
          textDecoration: "none",
        }}
      >
        Start this practice →
      </Link>
    </div>
  );
}
