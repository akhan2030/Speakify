"use client";

import type { NavigatorItem } from "@/lib/mock-test/types";
import { EXAM_BG } from "@/lib/mock-test/constants";
import { formatCountdown } from "@/lib/mock-test/utils";

type Props = {
  sectionName: string;
  timeRemaining: number;
  navigator: NavigatorItem[];
  activeIndex: number;
  overallProgress: number;
  onNavigate: (index: number) => void;
  onFlag: () => void;
  isFlagged: boolean;
  banner?: React.ReactNode;
  children?: React.ReactNode;
};

function SpeakifyLogo() {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#c9972c] text-[10px] font-black text-[#0d1b35]">
        S
      </span>
      <span className="hidden text-[11px] font-bold tracking-wide text-white sm:inline">
        Speakify
      </span>
    </div>
  );
}

export default function ExamChrome({
  sectionName,
  timeRemaining,
  navigator,
  activeIndex,
  overallProgress,
  onNavigate,
  onFlag,
  isFlagged,
  banner,
  children,
}: Props) {
  const urgent = timeRemaining <= 300;
  const progress = Math.min(100, Math.max(0, overallProgress));

  return (
    <div className="flex h-screen flex-col" style={{ backgroundColor: EXAM_BG }}>
      <header className="fixed left-0 right-0 top-0 z-50 bg-[#0d1b35] text-white shadow-md">
        <div className="flex h-12 items-center px-3 sm:px-4">
          <div className="w-24 shrink-0">
            <SpeakifyLogo />
          </div>
          <div className="flex flex-1 justify-center">
            <p className="truncate text-sm font-bold">{sectionName}</p>
          </div>
          <div className="w-24 shrink-0 text-right">
            <span
              className={`inline-block rounded-md px-2.5 py-1 font-mono text-sm font-bold tabular-nums ${
                urgent ? "bg-red-600 text-white" : "text-[#c9972c]"
              }`}
              aria-live="polite"
            >
              {formatCountdown(timeRemaining)}
            </span>
          </div>
        </div>

        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-[#c9972c] transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto border-t border-white/10 px-3 py-2">
          <div className="flex flex-1 flex-wrap gap-1">
            {navigator.map((item, index) => {
              let cls =
                "min-w-[1.75rem] rounded-full px-1.5 py-0.5 text-[10px] font-bold transition ";
              if (item.flagged) cls += "bg-orange-500 text-white ";
              else if (item.answered) cls += "bg-[#c9972c] text-[#0d1b35] ";
              else cls += "bg-slate-500 text-white ";
              if (index === activeIndex) cls += "ring-2 ring-white scale-105 ";
              return (
                <button
                  key={item.id}
                  type="button"
                  title={item.label}
                  onClick={() => onNavigate(index)}
                  className={cls}
                  aria-current={index === activeIndex ? "true" : undefined}
                >
                  {item.label.replace(/^Q/, "")}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={onFlag}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${
              isFlagged
                ? "bg-orange-500 text-white"
                : "bg-white/10 text-slate-200 hover:bg-white/20"
            }`}
          >
            {isFlagged ? "Flagged" : "Flag"}
          </button>
        </div>
      </header>

      <div className="h-[6.75rem] shrink-0" aria-hidden />

      {banner}

      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
    </div>
  );
}

export function PrepBanner({
  message,
  secondsLeft,
}: {
  message: string;
  secondsLeft: number;
}) {
  return (
    <div className="shrink-0 border-b border-[#c9972c]/30 bg-[#c9972c]/15 px-4 py-2 text-center text-sm text-[#0d1b35]">
      <span className="font-semibold">{message}</span>
      <span className="ml-2 font-mono font-bold text-[#c9972c]">{secondsLeft}s</span>
    </div>
  );
}
