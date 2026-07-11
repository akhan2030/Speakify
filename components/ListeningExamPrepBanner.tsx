"use client";

import { useState } from "react";

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Slim top bar for IELTS listening prep (preview / Q6–10 break).
 * Questions remain visible and scrollable below.
 */
export default function ListeningExamPrepBanner({
  message,
  secondsLeft,
  className = "",
  secondsOnly = false,
}: {
  message: string;
  secondsLeft: number;
  className?: string;
  /** IELTS-style prep countdown: 30, 29, 28… instead of 0:30 */
  secondsOnly?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const isLong = message.length > 72;

  return (
    <div
      className={`flex min-h-[52px] items-start gap-3 border-b-2 border-[#c9972c] bg-[#0d1b35] px-4 py-2 shadow-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="mt-0.5 shrink-0 text-base leading-none" aria-hidden>
        🔊
      </span>
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm font-medium leading-snug text-white ${
            expanded ? "whitespace-pre-wrap" : "line-clamp-2"
          }`}
        >
          {message}
        </p>
        {isLong ? (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-1 text-xs font-semibold text-[#c9972c] hover:underline"
          >
            {expanded ? "Show less" : "Show full instructions"}
          </button>
        ) : null}
      </div>
      <span
        className={`shrink-0 font-mono font-bold tabular-nums text-[#c9972c] ${
          secondsOnly ? "min-w-[2.5rem] text-2xl" : "text-lg"
        }`}
        aria-label={`${Math.max(0, secondsLeft)} seconds remaining`}
      >
        {secondsOnly
          ? Math.max(0, secondsLeft)
          : formatCountdown(secondsLeft)}
      </span>
    </div>
  );
}
