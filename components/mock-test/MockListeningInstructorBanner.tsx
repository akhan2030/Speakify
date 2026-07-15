"use client";

import { useEffect, useRef } from "react";
import { playListeningBrowserFallback, requestListeningTtsBlob } from "@/lib/listeningTtsClient";
import ListeningExamPrepBanner from "@/components/ListeningExamPrepBanner";
import { syncPrepMessageSeconds } from "@/lib/mock-test/prepMessageSync";

export { syncPrepMessageSeconds };

/**
 * IELTS-style instructor voice (alloy) for prep / break / check announcements.
 * Shows the dark instruction bar while the examiner speaks — distinct from section audio.
 */
export default function MockListeningInstructorBanner({
  message,
  secondsLeft,
  onAnnouncementComplete,
}: {
  message: string;
  secondsLeft: number;
  /** Fired once when the examiner announcement finishes (or fails). */
  onAnnouncementComplete?: () => void;
}) {
  const playedKeyRef = useRef<string | null>(null);
  const completedRef = useRef(false);

  const displayMessage = syncPrepMessageSeconds(message, secondsLeft);

  useEffect(() => {
    // Announce the original message once (with its stated seconds), not every tick.
    const key = message.trim();
    if (!key || playedKeyRef.current === key) return;
    playedKeyRef.current = key;
    completedRef.current = false;

    let cancelled = false;
    let blobUrl: string | null = null;
    let audio: HTMLAudioElement | null = null;

    const finish = () => {
      if (cancelled || completedRef.current) return;
      completedRef.current = true;
      onAnnouncementComplete?.();
    };

    async function play() {
      try {
        const apiResult = await requestListeningTtsBlob({
          transcript: key,
          voice: "alloy",
          speed: 0.95,
          announcement: true,
        });

        if (cancelled) return;

        if (apiResult) {
          blobUrl = URL.createObjectURL(apiResult.blob);
          audio = new Audio(blobUrl);
          audio.onended = finish;
          audio.onerror = finish;
          await audio.play();
          return;
        }

        await playListeningBrowserFallback(key, { announcement: true });
        finish();
      } catch {
        finish();
      }
    }

    void play();

    // Safety: if TTS hangs, still release the look-time countdown.
    const safety = window.setTimeout(finish, 12000);

    return () => {
      cancelled = true;
      window.clearTimeout(safety);
      if (audio) {
        audio.pause();
        audio.src = "";
      }
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [message, onAnnouncementComplete]);

  return (
    <ListeningExamPrepBanner
      message={displayMessage}
      secondsLeft={secondsLeft}
      secondsOnly
      className="shrink-0"
    />
  );
}
