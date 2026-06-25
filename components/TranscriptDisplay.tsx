"use client";

/** Show speech-to-text transcript — placeholder */
export default function TranscriptDisplay({
  transcript = "",
}: {
  transcript?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
      {transcript || "Transcript will appear here."}
    </div>
  );
}
