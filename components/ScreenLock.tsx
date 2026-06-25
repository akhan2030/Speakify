"use client";

import { useEffect } from "react";

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

export type ScreenLockProps = {
  isVisible: boolean;
  score?: number | null;
  total?: number | null;
  onViewResults: () => void;
};

export default function ScreenLock({
  isVisible,
  score = null,
  total = null,
  onViewResults,
}: ScreenLockProps) {
  useEffect(() => {
    if (!isVisible) return;

    const previousOverflow = document.body.style.overflow;
    const previousPointerEvents = document.body.style.pointerEvents;

    document.body.style.overflow = "hidden";
    document.body.style.pointerEvents = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.pointerEvents = previousPointerEvents;
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const hasScore =
    score !== null &&
    score !== undefined &&
    total !== null &&
    total !== undefined &&
    total > 0;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(13, 27, 53, 0.97)", pointerEvents: "auto" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="screen-lock-title"
    >
      <div className="max-w-lg text-center">
        <ClockIcon className="mx-auto h-16 w-16 text-[#c9972c]" />

        <h2
          id="screen-lock-title"
          className="mt-6 text-5xl font-bold text-white"
        >
          Time&apos;s Up!
        </h2>

        <p className="mt-4 text-lg text-slate-400">
          Your answers have been saved automatically.
        </p>

        {hasScore ? (
          <p className="mt-8 text-3xl font-bold text-[#c9972c]">
            You scored {score} / {total}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onViewResults}
          className="mt-10 inline-flex w-full items-center justify-center rounded-xl bg-[#c9972c] px-8 py-3.5 text-sm font-bold text-[#0d1b35] transition-colors hover:bg-[#b8862b] sm:w-auto"
        >
          View My Results →
        </button>

        <p className="mt-6 text-sm text-slate-500">
          Your session has been recorded and saved.
        </p>
      </div>
    </div>
  );
}
