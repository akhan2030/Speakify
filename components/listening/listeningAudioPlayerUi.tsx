"use client";

import type { ReactNode } from "react";

/** Platform-standard IELTS listening player colors (screenshot reference). */
export const LISTENING_PLAYER_NAVY = "#05122b";
export const LISTENING_PLAYER_GOLD = "#c5a059";

export function ExamPlayerShell({ children }: { children: ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-2xl shadow-lg"
      style={{ backgroundColor: LISTENING_PLAYER_NAVY }}
      role="region"
      aria-label="Listening section audio"
    >
      <div className="px-6 py-10 text-center">{children}</div>
    </div>
  );
}

export function ExamWaveformBars({ animated = true }: { animated?: boolean }) {
  const heights = ["45%", "70%", "55%", "85%", "60%"];
  return (
    <div className="flex h-14 items-end justify-center gap-1.5" aria-hidden>
      {heights.map((height, i) => (
        <span
          key={i}
          className={`w-1.5 rounded-full ${animated ? "animate-pulse" : ""}`}
          style={{
            backgroundColor: LISTENING_PLAYER_GOLD,
            height,
            ...(animated
              ? {
                  animationDelay: `${i * 0.12}s`,
                  animationDuration: "0.85s",
                }
              : { opacity: 0.65 }),
          }}
        />
      ))}
    </div>
  );
}

export function ExamProgressBar({ progress }: { progress: number }) {
  const clamped = Math.min(100, Math.max(0, progress));
  return (
    <div
      className="relative mx-auto mt-6 h-1 w-[85%] max-w-md"
      aria-hidden
    >
      <div className="absolute inset-0 rounded-full bg-white/10" />
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-[width] duration-300"
        style={{
          width: `${clamped}%`,
          backgroundColor: LISTENING_PLAYER_GOLD,
        }}
      />
      <div
        className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full shadow-sm"
        style={{
          left: `calc(${clamped}% - 6px)`,
          backgroundColor: LISTENING_PLAYER_GOLD,
        }}
      />
    </div>
  );
}
