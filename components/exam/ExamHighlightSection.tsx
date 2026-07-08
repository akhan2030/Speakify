"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  buildHighlightSegments,
  processHighlightInteraction,
  removeHighlight,
  type ExamHighlightMode,
  type TextHighlight,
} from "@/lib/examHighlight";

type ExamHighlightContextValue = {
  mode: ExamHighlightMode;
  setMode: (mode: ExamHighlightMode) => void;
  highlights: TextHighlight[];
  onHighlightsChange: (next: TextHighlight[]) => void;
  handleMarkPointerDown: (e: React.PointerEvent, highlightId: string) => void;
};

const ExamHighlightContext = createContext<ExamHighlightContextValue | null>(null);

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

export function ExamHighlightToolbar({ className = "" }: { className?: string }) {
  const ctx = useContext(ExamHighlightContext);
  if (!ctx) return null;

  const { mode, setMode } = ctx;

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 ${className}`}
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
  );
}

type SectionProps = {
  sectionId: string;
  highlights: TextHighlight[];
  onHighlightsChange: (next: TextHighlight[]) => void;
  showToolbar?: boolean;
  className?: string;
  toolbarClassName?: string;
  children: ReactNode;
};

export function ExamHighlightSection({
  sectionId,
  highlights,
  onHighlightsChange,
  showToolbar = true,
  className = "",
  toolbarClassName = "",
  children,
}: SectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<ExamHighlightMode>("highlight");
  const highlightsRef = useRef(highlights);
  const [mode, setMode] = useState<ExamHighlightMode>("highlight");

  highlightsRef.current = highlights;
  modeRef.current = mode;

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

  const value = useMemo(
    () => ({
      mode,
      setMode,
      highlights,
      onHighlightsChange,
      handleMarkPointerDown,
    }),
    [mode, highlights, onHighlightsChange, handleMarkPointerDown]
  );

  return (
    <ExamHighlightContext.Provider value={value}>
      {showToolbar ? <ExamHighlightToolbar className={toolbarClassName} /> : null}
      <div
        ref={containerRef}
        data-highlight-section={sectionId}
        onPointerUp={handlePointerUp}
        className={`select-text ${mode === "erase" ? "cursor-cell" : ""} ${className}`}
      >
        {children}
      </div>
    </ExamHighlightContext.Provider>
  );
}

export function HighlightableInlineText({
  blockId,
  text,
  className = "",
}: {
  blockId: string;
  text: string;
  className?: string;
}) {
  const ctx = useContext(ExamHighlightContext);

  if (!ctx || !text) {
    return <span className={className}>{text}</span>;
  }

  const blockHighlights = ctx.highlights.filter((h) => h.blockId === blockId);
  const segments = buildHighlightSegments(text, blockHighlights);

  return (
    <span className={`select-text ${className}`} data-highlight-block={blockId}>
      {segments.map((segment, idx) =>
        segment.highlighted ? (
          <mark
            key={`${blockId}-${idx}`}
            data-highlight-id={segment.highlightId}
            onPointerDown={(e) =>
              segment.highlightId
                ? ctx.handleMarkPointerDown(e, segment.highlightId)
                : undefined
            }
            className="cursor-pointer rounded-sm bg-[#ffff00] px-0.5 text-inherit"
            style={{ color: "inherit" }}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={`${blockId}-${idx}`}>{segment.text}</span>
        )
      )}
    </span>
  );
}

export function useExamHighlightContext() {
  return useContext(ExamHighlightContext);
}
