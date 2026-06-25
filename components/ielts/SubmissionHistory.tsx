"use client";

import { useEffect, useState } from "react";

type HistoryItem = {
  id: string;
  taskType?: string;
  part?: string | number;
  overallBand: number | null;
  dateLabel: string;
  breakdown?: Record<string, number | null>;
};

export default function SubmissionHistory({ skill }: { skill: "writing" | "speaking" }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/student/ielts-skills/history?skill=${skill}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.error) setItems(json.items ?? []);
      })
      .finally(() => setLoading(false));
  }, [skill]);

  if (loading) {
    return <p className="text-sm text-slate-500">Loading history…</p>;
  }

  if (!items.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">No submissions yet. Complete a practice task above.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div>
            <p className="font-semibold text-[#0d1b35]">
              {skill === "writing"
                ? String(item.taskType ?? "Essay").replace(/_/g, " ")
                : `Speaking Part ${item.part ?? "—"}`}
            </p>
            <p className="text-xs text-slate-500">{item.dateLabel}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#c9972c]">
              {item.overallBand != null ? item.overallBand.toFixed(1) : "—"}
            </p>
            <p className="text-[10px] uppercase text-slate-400">Overall band</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
