"use client";

import Link from "next/link";

type SkillRow = {
  key: string;
  label: string;
  href: string;
  band: number | null;
  target: number;
  gap: number | null;
  onTarget: boolean;
  attempted: boolean;
};

type BandsData = {
  current: number | null;
  target: number;
  targetLabel?: string;
  gap: number | null;
  skills: SkillRow[];
};

function skillGapColor(gap: number | null, onTarget: boolean) {
  if (onTarget || gap === 0) return "text-green-600";
  if (gap != null && gap > 0.5) return "text-red-600";
  if (gap != null && gap > 0) return "text-amber-600";
  return "text-slate-500";
}

export default function NorthStarCard({ bands }: { bands: BandsData }) {
  const current = bands.current;
  const target = bands.target;
  const targetDisplay = bands.targetLabel ?? target.toFixed(1);
  const gap = bands.gap;
  const currentPct = current != null ? (current / 9) * 100 : 0;
  const targetPct = (target / 9) * 100;

  return (
    <div className="rounded-xl border-2 border-[#C8923E] bg-white p-5 md:p-6">
      <p className="mb-4 text-xs tracking-[0.2em] text-slate-500">YOUR NORTH STAR</p>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-[11px] text-slate-500">Current estimate</p>
          <p className="mt-1 text-4xl font-medium text-[#0B3D75]">
            {current?.toFixed(1) ?? "—"}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">band score</p>
        </div>
        <div className="flex items-center justify-center">
          <div>
            <p className="text-[11px] text-slate-500">Gap remaining</p>
            <p className="mt-1 text-3xl font-medium text-[#C8923E]">
              {gap != null && gap > 0 ? `+${gap.toFixed(1)}` : gap === 0 ? "0" : "—"}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">to reach target</p>
          </div>
        </div>
        <div>
          <p className="text-[11px] text-slate-500">Target band</p>
          <p className="mt-1 text-4xl font-medium text-[#0d9488]">{targetDisplay}</p>
          <p className="mt-1 text-[11px] text-slate-500">your goal</p>
        </div>
      </div>

      <div className="relative mt-4">
        <div className="h-2 rounded-full bg-slate-100">
          <div
            className="h-2 rounded-full bg-[#C8923E]"
            style={{ width: `${Math.min(100, currentPct)}%` }}
          />
        </div>
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#0d9488] shadow"
          style={{ left: `${targetPct}%` }}
          title={`Target: ${target}`}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {bands.skills.map((skill) => (
          <Link
            key={skill.key}
            href={skill.href}
            className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-center hover:border-[#C8923E]/40"
          >
            <p className="text-xs font-semibold text-[#0d1b35]">{skill.label}</p>
            <p className="text-lg font-bold text-[#0B3D75]">
              {skill.band?.toFixed(1) ?? "—"}
            </p>
            <p className={`text-[11px] font-medium ${skillGapColor(skill.gap, skill.onTarget)}`}>
              {!skill.attempted
                ? "Not attempted"
                : skill.onTarget
                  ? "On target"
                  : `gap +${skill.gap?.toFixed(1)}`}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
