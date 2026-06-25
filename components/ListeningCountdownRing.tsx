"use client";

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ListeningCountdownRing({
  secondsLeft,
  totalSeconds,
  size = "lg",
}: {
  secondsLeft: number;
  totalSeconds: number;
  size?: "lg" | "md";
}) {
  const pct =
    totalSeconds > 0
      ? Math.max(0, Math.min(100, (secondsLeft / totalSeconds) * 100))
      : 0;
  const dim = size === "lg" ? "h-32 w-32" : "h-24 w-24";
  const textSize = size === "lg" ? "text-3xl" : "text-2xl";
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className={`relative ${dim}`}>
      <svg className={`${dim} -rotate-90`} viewBox="0 0 120 120" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="8"
        />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke="#c9972c"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center font-mono font-bold text-[#c9972c] ${textSize}`}
      >
        {formatCountdown(secondsLeft)}
      </span>
    </div>
  );
}
