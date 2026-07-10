"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export type GrowthRoadmapItem = {
  id: string;
  skill: "speaking" | "writing";
  criterion: string;
  criterion_label: string;
  trigger_pattern: string;
  status: string;
  task_title: string;
  task_description: string;
  estimated_band_impact: number;
  estimated_minutes: number;
  estimated_sessions_to_resolve: number;
  task_href: string | null;
  resolved_at: string | null;
};

function statusMeta(status: string) {
  switch (status) {
    case "resolved":
      return { icon: "✅", label: "Resolved", className: "text-emerald-700 bg-emerald-50" };
    case "still_present":
      return { icon: "🎯", label: "Still needs work", className: "text-amber-800 bg-amber-50" };
    case "completed":
      return { icon: "⏳", label: "Awaiting verification", className: "text-sky-800 bg-sky-50" };
    case "in_progress":
      return { icon: "⏳", label: "In progress", className: "text-sky-800 bg-sky-50" };
    default:
      return { icon: "🎯", label: "Recommended", className: "text-[#0d1b35] bg-slate-50" };
  }
}

export default function GrowthRoadmapPanel({
  programme = "ielts",
  showResolved = true,
}: {
  programme?: "ielts" | "ielts_general";
  showResolved?: boolean;
}) {
  const [items, setItems] = useState<GrowthRoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const progressBase =
    programme === "ielts_general"
      ? "/dashboard/ielts-general/student/progress"
      : "/dashboard/ielts/student/progress";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/growth-roadmap?all=${showResolved ? "1" : "0"}`);
      const data = await res.json();
      setItems(Array.isArray(data.items) ? data.items : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [showResolved]);

  useEffect(() => {
    void load();
  }, [load]);

  const markComplete = async (itemId: string) => {
    setMessage(null);
    const res = await fetch("/api/student/growth-roadmap", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId, action: "complete" }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error ?? "Could not update item");
      return;
    }
    setMessage(
      "Practice marked complete. Take a new scored session to verify improvement — your band only changes there."
    );
    await load();
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading your growth roadmap…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-[#0d1b35]">My Growth Roadmap</h2>
        <p className="mt-2 text-sm text-slate-600">
          Complete a scored Speaking or Writing session and targeted practice tasks will appear here
          based on your real deductions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-[#0d1b35]">My Growth Roadmap</h2>
        <p className="mt-1 text-sm text-slate-600">
          Ordered by estimated impact — practice these first for the fastest band gain. Completing a
          task does not change your score; only a new scored session can verify improvement.
        </p>
      </div>

      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {message}
        </p>
      ) : null}

      <ul className="space-y-3">
        {items.map((item) => {
          const meta = statusMeta(item.status);
          const href =
            item.task_href ??
            (item.skill === "speaking"
              ? programme === "ielts_general"
                ? "/dashboard/ielts-general/student/speaking?mode=practice"
                : "/dashboard/ielts/student/speaking?mode=practice"
              : programme === "ielts_general"
                ? "/dashboard/ielts-general/student/writing"
                : "/dashboard/ielts/student/writing");

          return (
            <li
              key={item.id}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {item.criterion_label} · {item.skill}
                  </p>
                  <p className="mt-1 text-base font-bold text-[#0d1b35]">
                    {meta.icon} {item.task_title}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {item.task_description}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    ~{item.estimated_minutes} min · expect ~{item.estimated_sessions_to_resolve}{" "}
                    scored session{item.estimated_sessions_to_resolve === 1 ? "" : "s"} to resolve
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold text-[#0d9488]">
                    +{item.estimated_band_impact.toFixed(1)} estimated
                  </p>
                  <span
                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                </div>
              </div>

              {item.status === "resolved" && item.resolved_at ? (
                <p className="mt-3 text-sm font-medium text-emerald-700">
                  You&apos;ve resolved this pattern — confirmed on a later scored session. Nice work.
                </p>
              ) : null}

              {item.status !== "resolved" ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={href}
                    className="rounded-lg bg-[#0d9488] px-3 py-2 text-sm font-bold text-white hover:opacity-95"
                  >
                    Start practice →
                  </Link>
                  {item.status === "pending" || item.status === "still_present" ? (
                    <button
                      type="button"
                      onClick={() => void markComplete(item.id)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#0d1b35] hover:bg-slate-50"
                    >
                      Mark practice done
                    </button>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-slate-500">
        <Link href={`${progressBase}?tab=growth`} className="font-semibold text-[#0d9488] hover:underline">
          View full roadmap
        </Link>{" "}
        · Estimated impacts are potential gains if the pattern is resolved — not automatic score changes.
      </p>
    </div>
  );
}
