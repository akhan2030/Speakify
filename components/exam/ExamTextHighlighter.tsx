"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  buildHighlightSegments,
  processHighlightInteraction,
  removeHighlight,
  type ExamHighlightMode,
  type HighlightBlock,
  type TextHighlight,
} from "@/lib/examHighlight";

function HighlighterIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="m9 11-6 6v3h3l6-6" />
      <path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
    </svg>
  );
}

function EraserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
      aria-hidden
    >
      <path d="m7 21 13-13" />
      <path d="M3 21h4l10.5-10.5a2.1 2.1 0 0 0 0-3L14 3" />
    </svg>
  );
}

type Props = {
  sectionId: string;
  blocks: HighlightBlock[];
  highlights: TextHighlight[];
  onHighlightsChange: (next: TextHighlight[]) => void;
  showToolbar?: boolean;
  className?: string;
  blockClassName?: string;
  textClassName?: string;
  renderBlockLabel?: (block: HighlightBlock) => React.ReactNode;
};

export default function ExamTextHighlighter({
  sectionId,
  blocks,
  highlights,
  onHighlightsChange,
  showToolbar = true,
  className = "",
  blockClassName = "",
  textClassName = "text-base leading-relaxed text-slate-700",
  renderBlockLabel,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<ExamHighlightMode>("highlight");
  const highlightsRef = useRef(highlights);
  const [mode, setMode] = useState<ExamHighlightMode>("highlight");

  highlightsRef.current = highlights;
  modeRef.current = mode;

  const highlightsByBlock = useMemo(() => {
    const map = new Map<string, TextHighlight[]>();
    for (const h of highlights) {
      const list = map.get(h.blockId) ?? [];
      list.push(h);
      map.set(h.blockId, list);
    }
    return map;
  }, [highlights]);

  const applyInteraction = useCallback(
    (target?: EventTarget | null, capturedRange?: Range | null) => {
      const container = containerRef.current;
      if (!container) return;

      const next = processHighlightInteraction({
        container,
        highlights: highlightsRef.current,
        mode: modeRef.current,
        target,
        range: capturedRange,
      });

      if (next) {
        onHighlightsChange(next);
      }
      window.getSelection()?.removeAllRanges();
    },
    [onHighlightsChange]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('[role="toolbar"]')) return;

      const selection = window.getSelection();
      const capturedRange =
        selection && !selection.isCollapsed && selection.rangeCount > 0
          ? selection.getRangeAt(0).cloneRange()
          : null;

      applyInteraction(e.target, capturedRange);
    },
    [applyInteraction]
  );

  const handleMarkPointerDown = useCallback(
    (e: React.PointerEvent, highlightId: string) => {
      e.preventDefault();
      e.stopPropagation();
      onHighlightsChange(removeHighlight(highlightsRef.current, highlightId));
      window.getSelection()?.removeAllRanges();
    },
    [onHighlightsChange]
  );

  return (
    <div className={className}>
      {showToolbar ? (
        <div
          className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
          role="toolbar"
          aria-label="Exam text tools"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Tools
          </span>
          <button
            type="button"
            onClick={() => setMode("highlight")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              mode === "highlight"
                ? "bg-[#ffff00] text-[#0d1b35] shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
            aria-pressed={mode === "highlight"}
            title="Highlighter — drag over text to highlight"
          >
            <HighlighterIcon />
            Highlight
          </button>
          <button
            type="button"
            onClick={() => setMode("erase")}
            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold transition-colors ${
              mode === "erase"
                ? "bg-slate-800 text-white shadow-sm"
                : "bg-white text-slate-600 hover:bg-slate-100"
            }`}
            aria-pressed={mode === "erase"}
            title="Eraser — click a highlight or drag over text to remove"
          >
            <EraserIcon />
            Eraser
          </button>
          <span className="text-[11px] text-slate-400">
            {mode === "highlight"
              ? "Drag over text to highlight · click a highlight to remove"
              : "Click or drag over highlights to erase"}
          </span>
        </div>
      ) : null}

      <div
        ref={containerRef}
        data-highlight-section={sectionId}
        onPointerUp={handlePointerUp}
        className={`select-text space-y-5 ${mode === "erase" ? "cursor-cell" : "cursor-text"}`}
      >
        {blocks.map((block) => {
          const blockHighlights = highlightsByBlock.get(block.id) ?? [];
          const segments = buildHighlightSegments(block.text, blockHighlights);

          return (
            <div key={block.id} className={`scroll-mt-4 ${blockClassName}`}>
              {renderBlockLabel ? (
                renderBlockLabel(block)
              ) : block.label ? (
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#0d1b35] text-xs font-bold text-white">
                  {block.label}
                </span>
              ) : null}
              <p className={`mt-2 select-text ${textClassName}`}>
                <span data-highlight-block={block.id}>
                  {segments.map((segment, idx) =>
                    segment.highlighted ? (
                      <mark
                        key={`${block.id}-${idx}`}
                        data-highlight-id={segment.highlightId}
                        onPointerDown={(e) =>
                          segment.highlightId
                            ? handleMarkPointerDown(e, segment.highlightId)
                            : undefined
                        }
                        className="cursor-pointer rounded-sm bg-[#ffff00] px-0.5 text-inherit"
                        style={{ color: "inherit" }}
                      >
                        {segment.text}
                      </mark>
                    ) : (
                      <span key={`${block.id}-${idx}`}>{segment.text}</span>
                    )
                  )}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
