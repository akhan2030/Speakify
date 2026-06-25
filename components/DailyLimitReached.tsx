"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  formatMidnightCountdown,
  getSecondsUntilMidnight,
  MAX_DAILY_MOCK_TESTS,
  MAX_DAILY_PASSAGE_TESTS,
  MAX_DAILY_PRACTICE_TESTS,
} from "@/lib/readingDailyLimit";
import { MAX_DAILY_PART_SESSIONS } from "@/lib/speakingDailyLimit";
import { MAX_DAILY_SECTION_TESTS } from "@/lib/listeningDailyLimit";

export type DailyLimitVariant =
  | "mock"
  | "passage"
  | "practice"
  | "part1"
  | "part2"
  | "part3"
  | "speaking-mock"
  | "listening-section"
  | "listening-mock"
  | "listening-practice";

const VARIANT_CONFIG: Record<
  DailyLimitVariant,
  {
    max: number;
    title: string;
    message: string;
    motivational: string;
  }
> = {
  mock: {
    max: MAX_DAILY_MOCK_TESTS,
    title: "Daily Limit Reached",
    message:
      "You have completed all 10 mock tests for today. Consistent daily practice is the key to band 7+.",
    motivational: "Consistent daily practice is the key to band 7+.",
  },
  passage: {
    max: MAX_DAILY_PASSAGE_TESTS,
    title: "Daily Limit Reached",
    message:
      "You have completed 15 passage tests today. Your brain needs rest to consolidate what you learned.",
    motivational:
      "Your brain needs rest to consolidate what you learned.",
  },
  practice: {
    max: MAX_DAILY_PRACTICE_TESTS,
    title: "Daily Limit Reached",
    message:
      "Excellent work — 15 practice sessions today! Review your results and strategies before tomorrow.",
    motivational:
      "Review your results and strategies before tomorrow.",
  },
  part1: {
    max: MAX_DAILY_PART_SESSIONS,
    title: "Daily Limit Reached",
    message:
      "You have completed all 10 Part 1 practice sessions for today. Rest your voice and review your feedback before tomorrow.",
    motivational: "Consistent daily practice builds fluency over time.",
  },
  part2: {
    max: MAX_DAILY_PART_SESSIONS,
    title: "Daily Limit Reached",
    message:
      "You have completed all 10 Part 2 practice sessions for today. Review your cue card feedback and try again tomorrow.",
    motivational: "Use your prep time wisely on the next session.",
  },
  part3: {
    max: MAX_DAILY_PART_SESSIONS,
    title: "Daily Limit Reached",
    message:
      "You have completed all 10 Part 3 practice sessions for today. Reflect on today's discussion topics before tomorrow.",
    motivational: "Abstract discussion skills improve with rest and review.",
  },
  "speaking-mock": {
    max: 5,
    title: "Daily Limit Reached",
    message:
      "You have completed all 5 speaking mock tests for today. Full mock practice is demanding — return tomorrow refreshed.",
    motivational: "Quality practice beats quantity every time.",
  },
  "listening-section": {
    max: MAX_DAILY_SECTION_TESTS,
    title: "Daily Limit Reached",
    message:
      "You have completed all 10 section practices for today. Review your answers and come back tomorrow for fresh audio.",
    motivational: "Rest helps your listening skills consolidate.",
  },
  "listening-mock": {
    max: 10,
    title: "Daily Limit Reached",
    message:
      "You have completed all 10 listening mock tests for today. Full mocks are demanding — return tomorrow refreshed.",
    motivational: "Quality practice beats quantity every time.",
  },
  "listening-practice": {
    max: 15,
    title: "Daily Limit Reached",
    message:
      "You have completed 15 listening practice sessions today. Review your weak question types before tomorrow.",
    motivational: "Targeted practice on weak types builds band score fastest.",
  },
};

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function DailyLimitReached({
  variant = "mock",
}: {
  variant?: DailyLimitVariant;
}) {
  const config = VARIANT_CONFIG[variant];
  const isListening = variant.startsWith("listening");
  const homeHref = isListening
    ? "/dashboard/student/listening"
    : "/dashboard/student/speaking";
  const trackerHref = isListening
    ? "/dashboard/student/listening/tracker"
    : "/dashboard/student/speaking/tracker";
  const homeLabel = isListening ? "Back to Listening" : "Back to Speaking";
  const trackerLabel = isListening ? "Check My Progress" : "Check My Progress";
  const [countdown, setCountdown] = useState(getSecondsUntilMidnight());

  useEffect(() => {
    setCountdown(getSecondsUntilMidnight());
    const id = window.setInterval(() => {
      setCountdown(getSecondsUntilMidnight());
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-8">
      <div className="max-w-md text-center">
        <LockIcon className="mx-auto h-20 w-20 text-[#c9972c]" />
        <h1 className="mt-6 text-[28px] font-bold text-[#0d1b35]">
          {config.title}
        </h1>
        <p className="mt-3 text-lg text-slate-500">{config.message}</p>

        <div className="mt-8">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Daily limit</span>
            <span className="font-bold text-red-600">
              {config.max}/{config.max}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full w-full rounded-full bg-red-500" />
          </div>
        </div>

        <p className="mt-8 text-sm text-slate-500">
          Resets in:{" "}
          <span className="font-mono text-base font-bold text-[#0d1b35]">
            {formatMidnightCountdown(countdown)}
          </span>
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href={homeHref}
            className="inline-flex items-center justify-center rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-bold text-[#0d1b35] hover:bg-[#b8862b]"
          >
            {homeLabel}
          </Link>
          <Link
            href={trackerHref}
            className="inline-flex items-center justify-center rounded-xl border border-[#0d1b35] px-6 py-3 text-sm font-bold text-[#0d1b35] hover:bg-[#0d1b35] hover:text-white"
          >
            {trackerLabel}
          </Link>
        </div>

        <p className="mt-8 text-sm italic text-[#c9972c]">
          Rest is part of the process.
          <br />
          Come back tomorrow stronger.
        </p>
      </div>
    </div>
  );
}
