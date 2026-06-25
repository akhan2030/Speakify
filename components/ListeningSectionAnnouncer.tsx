"use client";

import { useEffect, useRef } from "react";

/**
 * Plays the official IELTS section announcement (alloy voice) once, then calls onComplete.
 */
export default function ListeningSectionAnnouncer({
  text,
  onComplete,
}: {
  text: string;
  onComplete: () => void;
}) {
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    let cancelled = false;
    let blobUrl: string | null = null;
    let audio: HTMLAudioElement | null = null;

    async function play() {
      try {
        const res = await fetch("/api/listening/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text,
            voice: "alloy",
            speed: 0.95,
            announcement: true,
          }),
        });

        if (!res.ok || cancelled) {
          if (!cancelled) onCompleteRef.current();
          return;
        }

        const blob = await res.blob();
        if (cancelled) return;

        blobUrl = URL.createObjectURL(blob);
        audio = new Audio(blobUrl);

        audio.onended = () => {
          if (!cancelled) onCompleteRef.current();
        };
        audio.onerror = () => {
          if (!cancelled) onCompleteRef.current();
        };

        await audio.play();
      } catch {
        if (!cancelled) onCompleteRef.current();
      }
    }

    void play();

    return () => {
      cancelled = true;
      if (audio) {
        audio.pause();
        audio.src = "";
      }
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [text]);

  return (
    <div
      className="rounded-xl border border-[#0d1b35]/20 bg-[#0d1b35] px-4 py-3 text-sm text-white"
      role="status"
      aria-live="polite"
    >
      <p className="font-medium">Official instructions</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-300">{text}</p>
    </div>
  );
}
