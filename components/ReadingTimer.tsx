"use client";

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6v6l4 2" />
    </svg>
  );
}

const CARD_COLOR_CLASSES = {
  green: {
    text: "text-green-600",
    bar: "bg-green-500",
    border: "border-green-200",
    bg: "bg-white",
  },
  amber: {
    text: "text-amber-600",
    bar: "bg-amber-500",
    border: "border-amber-200",
    bg: "bg-white",
  },
  red: {
    text: "text-red-600 animate-pulse",
    bar: "bg-red-500 animate-pulse",
    border: "border-red-200",
    bg: "bg-white",
  },
};

const EMBEDDED_TIME_COLORS: Record<
  "green" | "amber" | "red",
  { text: string; pulse?: boolean }
> = {
  green: { text: "#4ade80" },
  amber: { text: "#fbbf24" },
  red: { text: "#f87171", pulse: true },
};

export type ReadingTimerProps = {
  timeRemaining: number;
  formattedTime: string;
  timerColor: "green" | "amber" | "red";
  totalSeconds: number;
  className?: string;
  embedded?: boolean;
};

export default function ReadingTimer({
  timeRemaining,
  formattedTime,
  timerColor,
  totalSeconds,
  className = "",
  embedded = false,
}: ReadingTimerProps) {
  const progress =
    totalSeconds > 0
      ? Math.max(0, Math.min(100, (timeRemaining / totalSeconds) * 100))
      : 0;

  if (embedded) {
    const embeddedColors = EMBEDDED_TIME_COLORS[timerColor];
    const displayTime = formattedTime || "00:00";

    return (
      <div
        className={`flex flex-col items-center bg-transparent ${className}`}
        role="timer"
        aria-live="polite"
        aria-label={`Time remaining: ${displayTime}`}
      >
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ClockIcon className="h-4 w-4 text-[#c9972c] sm:h-5 sm:w-5" />
          <span
            className={`text-lg font-bold tabular-nums sm:text-2xl ${
              embeddedColors.pulse ? "animate-pulse" : ""
            }`}
            style={{ color: embeddedColors.text }}
          >
            {displayTime}
          </span>
        </div>

        <span className="mt-0.5 hidden text-[11px] text-slate-400 sm:inline">
          Time Remaining
        </span>

        <div className="mt-1 hidden h-1 w-[140px] overflow-hidden rounded-full bg-white/10 sm:mt-1.5 sm:block sm:w-[200px]">
          <div
            className="h-full rounded-full bg-[#c9972c] transition-all duration-1000 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  const colors = CARD_COLOR_CLASSES[timerColor];
  const displayTime = formattedTime || "00:00";

  return (
    <div
      className={`fixed right-6 top-6 z-40 w-[160px] rounded-xl border p-3 shadow-md ${colors.border} ${colors.bg} ${className}`}
      role="timer"
      aria-live="polite"
      aria-label={`Time remaining: ${displayTime}`}
    >
      <div className="flex items-center justify-center gap-1.5">
        <ClockIcon className={`h-4 w-4 ${colors.text}`} />
        <span className="text-[10px] text-slate-500">Time Remaining</span>
      </div>

      <p
        className={`mt-2 text-center text-2xl font-bold tabular-nums ${colors.text}`}
      >
        {displayTime}
      </p>

      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-linear ${colors.bar}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
