"use client";

import { useEffect, useState } from "react";

type BandData = {
  current: number | null;
  target: number;
  gap: number | null;
  onTarget: boolean;
};

const SKILL_KEYS: Record<string, string> = {
  writing: "writing",
  speaking: "speaking",
  reading: "reading",
  listening: "listening",
};

export default function SkillBandHeader({
  skill,
  title,
  subtitle,
}: {
  skill: keyof typeof SKILL_KEYS;
  title: string;
  subtitle?: string;
}) {
  const [band, setBand] = useState<BandData | null>(null);

  useEffect(() => {
    fetch("/api/student/ielts-dashboard")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) return;
        const row = json.bands?.skills?.find(
          (s: { key: string }) => s.key === skill
        );
        if (row) {
          setBand({
            current: row.band,
            target: row.target,
            gap: row.gap,
            onTarget: row.onTarget,
          });
        } else if (json.bands) {
          setBand({
            current: json.bands.current,
            target: json.bands.target,
            gap: json.bands.gap,
            onTarget: false,
          });
        }
      })
      .catch(() => {});
  }, [skill]);

  const current = band?.current;
  const target = band?.target ?? 6.5;
  const gap = band?.gap;
  const pct = current != null ? Math.round((current / 9) * 100) : 0;
  const targetPct = Math.round((target / 9) * 100);

  return (
    <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h1 className="text-2xl font-bold text-[#0d1b35]">{title}</h1>
      {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}

      <div className="mt-4 flex flex-wrap items-end gap-6">
        <div>
          <p className="text-xs text-slate-500">Current estimate</p>
          <p className="text-3xl font-bold text-[#c9972c]">
            {current?.toFixed(1) ?? "—"}
          </p>
        </div>
        <div className="text-2xl text-slate-300">→</div>
        <div>
          <p className="text-xs text-slate-500">Target</p>
          <p className="text-3xl font-bold text-[#0d1b35]">{target.toFixed(1)}</p>
        </div>
        {gap != null && gap > 0 ? (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            ↑ needs +{gap.toFixed(1)}
          </span>
        ) : current != null ? (
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            ✅ On target
          </span>
        ) : (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            Not attempted — start below
          </span>
        )}
      </div>

      <div className="relative mt-4 h-2 w-full rounded-full bg-slate-100">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-[#c9972c]"
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-[#0d1b35]"
          style={{ left: `${targetPct}%` }}
        />
      </div>
    </header>
  );
}
