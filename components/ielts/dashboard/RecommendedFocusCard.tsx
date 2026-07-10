"use client";

import Link from "next/link";

type RecItem = {
  title: string;
  minutes: number;
  href: string;
  estimatedBandGain: number;
  subtitle: string;
};

export default function RecommendedFocusCard({
  items,
  totalMinutes,
  roadmapHref = "/dashboard/ielts/student/progress?tab=growth",
}: {
  items: RecItem[];
  totalMinutes: number;
  roadmapHref?: string;
}) {
  return (
    <div className="rounded-xl border border-[#0d9488]/30 border-l-4 border-l-[#0d9488] bg-white p-5 shadow-sm">
      <h3 className="font-bold text-[#0d1b35]">Speakify recommends</h3>
      <p className="mt-1 text-xs text-slate-500">Ordered by impact on your weakest skills</p>

      <ul className="mt-4 divide-y divide-slate-100">
        {items.map((item) => (
          <li key={item.title} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0 flex-1">
              <Link href={item.href} className="text-sm font-medium text-[#0d1b35] hover:text-[#0d9488]">
                {item.title}
              </Link>
              <p className="mt-0.5 text-xs text-slate-500">
                {item.minutes} minutes · {item.subtitle}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs font-semibold text-[#0d9488]">
                +{item.estimatedBandGain.toFixed(1)} band
              </p>
              <p className="text-[10px] text-slate-400">estimated gain</p>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-xs text-slate-500">Total: {totalMinutes} minutes</p>
      <Link
        href={roadmapHref}
        className="mt-4 inline-block rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-bold text-white hover:opacity-95"
      >
        My Growth Roadmap →
      </Link>
    </div>
  );
}
