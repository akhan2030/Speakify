"use client";

import AudioPlayer, { type AudioPlayerProps } from "@/components/AudioPlayer";

/**
 * Single entry point for all IELTS Listening audio playback.
 * Do not use `AudioPlayer` directly on listening pages — this enforces one UI everywhere.
 */
export type ListeningAudioPlayerProps = Omit<
  AudioPlayerProps,
  "compact" | "topBar" | "presentation"
>;

export default function ListeningAudioPlayer(props: ListeningAudioPlayerProps) {
  return (
    <AudioPlayer
      {...props}
      presentation="exam"
      compact={false}
      topBar={false}
    />
  );
}
