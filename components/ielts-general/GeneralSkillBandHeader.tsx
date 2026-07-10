"use client";

import { useEffect, useState } from "react";

type BandData = {
  current: number | null;
  target: number;
  gap: number | null;
  onTarget: boolean;
};

export default function GeneralSkillBandHeader({
  skill,
  title,
  subtitle,
  refreshKey = 0,
  latestBand = null,
}: {
  skill: "writing" | "speaking" | "reading" | "listening";
  title: string;
  subtitle?: React.ReactNode;
  refreshKey?: number;
  latestBand?: number | null;
}) {
  const [band, setBand] = useState<BandData | null>(null);

  useEffect(() => {
    fetch("/api/ielts-general/dashboard")
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
        }
      })
      .catch(() => {});
  }, [skill, refreshKey]);

  const displayBand =
    latestBand != null && Number.isFinite(latestBand)
      ? latestBand
      : band?.current ?? null;

  return (
    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#c9972c]">
            IELTS General Training
          </p>
          <h1 className="text-xl font-bold text-[#0d1b35] md:text-2xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
        </div>
        {band ? (
          <div className="text-right">
            <p className="text-xs text-slate-500">Your band estimate</p>
            <p className="text-2xl font-bold text-[#c9972c]">
              {displayBand?.toFixed(1) ?? "—"}
            </p>
            <p className="text-xs text-slate-500">
              Target {band.target.toFixed(1)}
              {band.onTarget ? " · on target" : band.gap != null ? ` · gap +${band.gap.toFixed(1)}` : ""}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
