"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { GENERAL_STUDENT_BASE } from "@/lib/ielts-general/paths";

const STATUS_COLORS = {
  red: { ring: "stroke-red-400", text: "text-red-600", bg: "bg-red-50" },
  amber: { ring: "stroke-amber-400", text: "text-amber-600", bg: "bg-amber-50" },
  gold: { ring: "stroke-[#c9972c]", text: "text-[#c9972c]", bg: "bg-[#c9972c]/10" },
  teal: { ring: "stroke-[#0d9488]", text: "text-[#0d9488]", bg: "bg-[#0d9488]/10" },
};

type GtReadinessData = {
  readinessPercent: number;
  statusLabel: string;
  statusColor: keyof typeof STATUS_COLORS;
  currentBand: number | null;
  targetBand: number | null;
  bandGap: number;
  nextAction: string;
  skillBands: {
    writing: number | null;
    essay: number | null;
    speaking: number | null;
    listening: number | null;
    reading: number | null;
  };
  readingSections: {
    A: { band: number | null; accuracy: number | null };
    B: { band: number | null; accuracy: number | null };
    C: { band: number | null; accuracy: number | null };
  };
  letterTypeAccuracy: {
    formal: number | null;
    semiFormal: number | null;
    informal: number | null;
  };
  focusLinks: Array<{ label: string; href: string; skill: string }>;
};

function ReadinessRing({ percent, colorClass }: { percent: number; colorClass: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          className={colorClass}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-[#0d1b35]">{percent}%</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Ready
        </span>
      </div>
    </div>
  );
}

function formatPct(v: number | null) {
  if (v == null || !Number.isFinite(v)) return "—";
  return `${Math.round(v)}%`;
}

function formatBand(v: number | null) {
  if (v == null || !Number.isFinite(v)) return "—";
  return v.toFixed(1);
}

export default function GeneralIeltsReadinessMeter() {
  const [data, setData] = useState<GtReadinessData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ielts-general/readiness", { cache: "no-store" });
        const json = await res.json();
        if (!cancelled && !json.error) setData(json);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-32 animate-pulse rounded-xl bg-slate-100" />
      </section>
    );
  }

  if (!data) return null;

  const colors = STATUS_COLORS[data.statusColor] ?? STATUS_COLORS.amber;

  return (
    <section className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-[#0d9488]/30 bg-gradient-to-br from-white to-[#0d9488]/5 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          <ReadinessRing percent={data.readinessPercent} colorClass={colors.ring} />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#0d9488]">
              IELTS General Training — Readiness
            </p>
            <h2 className={`mt-1 text-xl font-bold ${colors.text}`}>{data.statusLabel}</h2>
            <p className="mt-2 text-sm text-slate-600">{data.nextAction}</p>
            {data.currentBand != null && data.targetBand != null ? (
              <p className="mt-1 text-xs text-slate-500">
                Band {data.currentBand.toFixed(1)} → {data.targetBand.toFixed(1)}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-[#0d1b35]">Writing</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Letter (Task 1)</dt>
              <dd className="font-semibold">Band {formatBand(data.skillBands.writing)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Essay (Task 2)</dt>
              <dd className="font-semibold">Band {formatBand(data.skillBands.essay)}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs font-semibold uppercase text-slate-500">Letter accuracy</p>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-lg bg-slate-50 p-2">
              <div className="font-bold">{formatPct(data.letterTypeAccuracy.formal)}</div>
              <div className="text-slate-500">Formal</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <div className="font-bold">{formatPct(data.letterTypeAccuracy.semiFormal)}</div>
              <div className="text-slate-500">Semi-formal</div>
            </div>
            <div className="rounded-lg bg-slate-50 p-2">
              <div className="font-bold">{formatPct(data.letterTypeAccuracy.informal)}</div>
              <div className="text-slate-500">Informal</div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-[#0d1b35]">Listening & Speaking</h3>
          <p className="mt-1 text-xs text-slate-500">Same test format as Academic IELTS</p>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Listening</dt>
              <dd className="font-semibold">Band {formatBand(data.skillBands.listening)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">Speaking</dt>
              <dd className="font-semibold">Band {formatBand(data.skillBands.speaking)}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-bold text-[#0d1b35]">GT Reading — by section</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {(["A", "B", "C"] as const).map((sec) => {
            const row = data.readingSections[sec];
            return (
              <div key={sec} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Section {sec}</p>
                <p className="mt-1 text-lg font-bold text-[#0d1b35]">Band {formatBand(row.band)}</p>
                <p className="text-xs text-slate-500">{formatPct(row.accuracy)} accuracy</p>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Overall reading: Band {formatBand(data.skillBands.reading)}
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-bold text-[#0d1b35]">Recommended focus</h3>
        <ul className="mt-3 space-y-2">
          {data.focusLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-sm font-semibold text-[#0d9488] hover:underline">
                {link.label} →
              </Link>
            </li>
          ))}
        </ul>
        <Link
          href={`${GENERAL_STUDENT_BASE}/mock-exam`}
          className="mt-4 inline-block text-sm font-bold text-[#c9972c] hover:underline"
        >
          Take a full GT mock exam →
        </Link>
      </div>
    </section>
  );
}
