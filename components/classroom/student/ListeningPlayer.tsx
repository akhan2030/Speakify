"use client";

import { useState } from "react";

export type ListeningPlayerProps = {
  src?: string | null;
  transcript: string;
  title?: string;
  audioNote?: string;
  initiallyShowTranscript?: boolean;
};

export default function ListeningPlayer({
  src,
  transcript,
  title = "Listening",
  audioNote,
  initiallyShowTranscript = false,
}: ListeningPlayerProps) {
  const [showTranscript, setShowTranscript] = useState(initiallyShowTranscript);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8a6a1f]">
        Listening
      </p>
      <h3 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
        {title}
      </h3>
      {audioNote ? (
        <p className="mt-2 text-sm text-slate-600">{audioNote}</p>
      ) : null}

      <div className="mt-4">
        {src ? (
          <audio controls className="w-full" src={src} preload="metadata">
            Your browser does not support audio playback.
          </audio>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-300 bg-[#f7f4ef] px-4 py-6 text-center text-sm text-slate-600">
            Audio will play when your teacher shares the recording. Follow along
            in class.
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setShowTranscript((v) => !v)}
          className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          {showTranscript ? "Hide transcript" : "Show transcript"}
        </button>
        <span className="text-xs text-slate-500">
          Use only after the first listen, unless your teacher says otherwise.
        </span>
      </div>

      {showTranscript ? (
        <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-slate-100 bg-[#fcfbf8] p-4 text-sm leading-7 text-slate-800">
          {transcript}
        </pre>
      ) : null}
    </section>
  );
}
