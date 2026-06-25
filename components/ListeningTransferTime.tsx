"use client";

import { useEffect, useState } from "react";
import ListeningCountdownRing from "@/components/ListeningCountdownRing";

const TRANSFER_SECONDS = 600;

/**
 * Full mock test only — 10-minute answer transfer time after all sections.
 */
export default function ListeningTransferTime({
  onComplete,
  onSubmit,
}: {
  onComplete: () => void;
  onSubmit: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(TRANSFER_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      onComplete();
      return;
    }
    const id = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft, onComplete]);

  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const label = `${m}:${s.toString().padStart(2, "0")}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "rgba(13, 27, 53, 0.95)" }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-8 text-center shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-widest text-[#c9972c]">
          IELTS Academic Listening
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#0d1b35]">
          Answer Transfer Time — {label}
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          You have 10 minutes to transfer your answers. Review all sections and
          submit when you are ready.
        </p>
        <div className="mt-8 flex justify-center">
          <ListeningCountdownRing
            secondsLeft={secondsLeft}
            totalSeconds={TRANSFER_SECONDS}
          />
        </div>
        <button
          type="button"
          onClick={onSubmit}
          className="mt-8 w-full rounded-xl bg-[#c9972c] py-3.5 text-sm font-bold text-[#0d1b35] hover:bg-[#b8862b]"
        >
          Submit test
        </button>
      </div>
    </div>
  );
}
