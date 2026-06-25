"use client";

import { formatCountdown } from "@/lib/mock-test/utils";

type Props = {
  completedSection: string;
  nextSection: string;
  secondsLeft: number;
  customMessage?: string;
};

export default function SectionTransition({
  completedSection,
  nextSection,
  secondsLeft,
  customMessage,
}: Props) {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#0d1b35] px-6 text-center text-white">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#c9972c]">
        Section complete
      </p>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">
        {customMessage ?? `${completedSection} finished`}
      </h1>
      <p className="mt-4 max-w-md text-slate-300">
        {nextSection} begins in{" "}
        <span className="font-mono text-xl font-bold text-[#c9972c]">
          {formatCountdown(secondsLeft)}
        </span>
      </p>
      <p className="mt-6 text-xs text-slate-500">
        You cannot return to previous sections once the next section begins.
      </p>
    </div>
  );
}

export function ExamCompleteScreen() {
  return (
    <div className="flex h-screen flex-col items-center justify-center bg-[#0d1b35] px-6 text-center text-white">
      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#c9972c]">
        Mock test submitted
      </p>
      <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Exam complete</h1>
      <p className="mt-4 max-w-lg text-slate-300">
        Your results are being prepared. Human examiner review: within 24 hours.
      </p>
      <span className="mt-8 h-10 w-10 animate-spin rounded-full border-4 border-[#c9972c]/30 border-t-[#c9972c]" />
    </div>
  );
}
