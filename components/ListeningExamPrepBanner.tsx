"use client";

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
}: {
  message: string;
  secondsLeft: number;
  className?: string;
}) {
  return (
    <div
      className={`flex max-h-[70px] min-h-[52px] items-center gap-3 border-b-2 border-[#c9972c] bg-[#0d1b35] px-4 py-2 shadow-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      <span className="shrink-0 text-base leading-none" aria-hidden>
        🔊
      </span>
      <p className="min-w-0 flex-1 truncate text-sm font-medium leading-snug text-white">
        {message}
      </p>
      <span className="shrink-0 font-mono text-lg font-bold tabular-nums text-[#c9972c]">
        {formatCountdown(secondsLeft)}
      </span>
    </div>
  );
}
