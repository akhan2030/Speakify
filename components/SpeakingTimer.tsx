"use client";

/** 60-second preparation timer — placeholder */
export default function SpeakingTimer({
  secondsRemaining = 60,
}: {
  secondsRemaining?: number;
}) {
  return (
    <div className="rounded-lg bg-[#0d1b35] px-4 py-2 text-center text-lg font-bold text-[#c9972c]">
      {secondsRemaining}s
    </div>
  );
}
