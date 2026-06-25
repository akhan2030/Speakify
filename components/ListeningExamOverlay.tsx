"use client";

import ListeningCountdownRing from "@/components/ListeningCountdownRing";

function SpeakerPhoneIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
      aria-hidden
    >
      <path d="M11 5 6 9H3v6h3l5 4V5Z" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

/** Full-screen overlay for section transition and check-answer time only. */
export default function ListeningExamOverlay({
  sectionNumber,
  sectionName,
  lead,
  detail,
  secondsLeft,
  totalSeconds,
}: {
  sectionNumber: number;
  sectionName: string;
  lead: string;
  detail?: string;
  secondsLeft: number;
  totalSeconds: number;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(13, 27, 53, 0.95)" }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-2xl">
        <p className="text-center text-xs font-bold uppercase tracking-widest text-[#c9972c]">
          IELTS Academic Listening
        </p>
        <h2 className="mt-2 text-center text-2xl font-bold text-[#0d1b35]">
          Section {sectionNumber} — {sectionName}
        </h2>

        <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-6 text-center">
          <SpeakerPhoneIcon className="mx-auto h-10 w-10 text-[#c9972c]" />
          <p className="mt-4 text-sm leading-relaxed text-[#0d1b35]">{lead}</p>
          {detail ? (
            <p className="mt-3 text-sm font-semibold text-[#0d1b35]">{detail}</p>
          ) : null}

          <div className="mt-6 flex justify-center">
            <ListeningCountdownRing
              secondsLeft={secondsLeft}
              totalSeconds={totalSeconds}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
