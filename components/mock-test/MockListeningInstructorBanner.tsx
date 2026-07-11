"use client";

import { useEffect, useRef } from "react";
import ListeningExamPrepBanner from "@/components/ListeningExamPrepBanner";

/**
 * IELTS-style instructor voice (alloy) for prep / break / check announcements.
 * Shows the dark instruction bar while the examiner speaks — distinct from section audio.
 */
export default function MockListeningInstructorBanner({
  message,
  secondsLeft,
}: {
  message: string;
  secondsLeft: number;
}) {
  const playedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const key = message.trim();
    if (!key || playedKeyRef.current === key) return;
    playedKeyRef.current = key;

    let cancelled = false;
    let blobUrl: string | null = null;
    let audio: HTMLAudioElement | null = null;

    async function play() {
      try {
        const res = await fetch("/api/listening/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: key,
            voice: "alloy",
            speed: 0.95,
            announcement: true,
          }),
        });

        if (!res.ok || cancelled) return;

        const blob = await res.blob();
        if (cancelled) return;

        blobUrl = URL.createObjectURL(blob);
        audio = new Audio(blobUrl);
        await audio.play();
      } catch {
        // Banner text remains visible if TTS fails.
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
  }, [message]);

  return (
    <ListeningExamPrepBanner
      message={message}
      secondsLeft={secondsLeft}
      secondsOnly
      className="shrink-0"
    />
  );
}
