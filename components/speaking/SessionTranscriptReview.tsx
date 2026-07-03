"use client";

import { useMemo } from "react";
import {
  buildHighlightedSegments,
  buildTranscriptReview,
  FLAG_COLORS,
  type TranscriptEntry,
  type TranscriptFlag,
  type TranscriptReview,
} from "@/lib/speaking/transcriptReview";

function flagTooltip(flag: TranscriptFlag) {
  const parts = [flag.issue];
  if (flag.correction) {
    parts.push(`Try: ${flag.correction}`);
  }
  return parts.join(" — ");
}

function HighlightedAnswer({ text, flags }: { text: string; flags: TranscriptFlag[] }) {
  const segments = useMemo(
    () => buildHighlightedSegments(text, flags),
    [text, flags]
  );

  return (
    <p style={{ fontSize: "14px", color: "#0d1b35", margin: 0, lineHeight: 1.65 }}>
      {segments.map((segment, index) => {
        if (!segment.flag) {
          return <span key={index}>{segment.text}</span>;
        }
        const colors = FLAG_COLORS[segment.flag.category] ?? FLAG_COLORS.general;
        return (
          <mark
            key={index}
            title={flagTooltip(segment.flag)}
            style={{
              background: colors.bg,
              borderBottom: `2px solid ${colors.border}`,
              padding: "0 2px",
              borderRadius: "3px",
              cursor: "help",
            }}
          >
            {segment.text}
          </mark>
        );
      })}
    </p>
  );
}

function partLabel(part: number) {
  return `Part ${part}`;
}

export default function SessionTranscriptReview({
  transcript = [],
  feedback,
  transcriptReview,
  embedded = false,
}: {
  transcript?: TranscriptEntry[];
  feedback?: Record<string, unknown>;
  transcriptReview?: TranscriptReview | null;
  embedded?: boolean;
}) {
  const review = useMemo(() => {
    if (transcriptReview?.pairs?.length) return transcriptReview;
    if (!transcript.length || !feedback) return null;
    return buildTranscriptReview(transcript, feedback);
  }, [transcript, feedback, transcriptReview]);

  if (!review?.pairs?.length) {
    const empty = (
      <>
        <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#0d1b35", margin: "0 0 8px" }}>
          Session Transcript
        </h2>
        <p style={{ fontSize: "13px", color: "#94a3b8", margin: 0 }}>
          No transcript was saved for this session.
        </p>
      </>
    );
    return embedded ? (
      <div>{empty}</div>
    ) : (
      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: "16px",
          padding: "1.5rem",
          marginBottom: "1.5rem",
        }}
      >
        {empty}
      </div>
    );
  }

  const flaggedTurns = review.pairs.filter((pair) => pair.flags.length > 0).length;

  const body = (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h2 style={{ fontSize: "15px", fontWeight: 600, color: "#0d1b35", margin: "0 0 4px" }}>
            Session Transcript
          </h2>
          <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>
            Review what Sarah asked and what you said. Hover highlighted phrases for coaching tips.
          </p>
        </div>
        {flaggedTurns > 0 ? (
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#92400e",
              background: "#fffbeb",
              border: "1px solid #fde68a",
              borderRadius: "999px",
              padding: "4px 10px",
            }}
          >
            {flaggedTurns} turn{flaggedTurns === 1 ? "" : "s"} with flagged issues
          </span>
        ) : null}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {review.pairs.map((pair, index) => (
          <div
            key={`${pair.part}-${index}`}
            style={{
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "8px",
                padding: "8px 12px",
                background: "#f8fafc",
                borderBottom: "1px solid #e5e7eb",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#64748b" }}>
                Turn {index + 1}
              </span>
              <span style={{ fontSize: "11px", fontWeight: 700, color: "#0d9488" }}>
                {partLabel(pair.part)}
              </span>
            </div>

            <div style={{ padding: "12px" }}>
              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  margin: "0 0 4px",
                }}
              >
                Sarah asked
              </p>
              <p style={{ fontSize: "13px", color: "#475569", margin: "0 0 12px", lineHeight: 1.55 }}>
                {pair.question}
              </p>

              <p
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  margin: "0 0 4px",
                }}
              >
                You said
              </p>
              <HighlightedAnswer text={pair.answer} flags={pair.flags} />

              {pair.flags.length > 0 ? (
                <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {pair.flags.slice(0, 3).map((flag, flagIndex) => (
                    <p
                      key={flagIndex}
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        margin: 0,
                        lineHeight: 1.45,
                        background: "#f8fafc",
                        borderRadius: "8px",
                        padding: "6px 8px",
                      }}
                    >
                      <span style={{ fontWeight: 700, color: FLAG_COLORS[flag.category].border }}>
                        {flag.category === "saudi" ? "Saudi-specific" : flag.category}
                        :{" "}
                      </span>
                      {flag.issue}
                      {flag.correction ? (
                        <span style={{ color: "#0d9488" }}> → {flag.correction}</span>
                      ) : null}
                    </p>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <p style={{ fontSize: "11px", color: "#94a3b8", margin: "12px 0 0", lineHeight: 1.5 }}>
        Audio replay is not available yet — recordings are transcribed live and not stored after the
        session.
      </p>
    </>
  );

  if (embedded) {
    return <div>{body}</div>;
  }

  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "16px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
      }}
    >
      {body}
    </div>
  );
}
