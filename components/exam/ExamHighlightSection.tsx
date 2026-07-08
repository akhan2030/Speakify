"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  addHighlights,
  buildHighlightSegments,
  getSelectionRangesInContainer,
  removeHighlight,
  removeHighlightsInRange,
  type ExamHighlightMode,
  type HighlightBlock,
  type TextHighlight,
} from "@/lib/examHighlight";

type ExamHighlightContextValue = {
  mode: ExamHighlightMode;
  setMode: (mode: ExamHighlightMode) => void;
  highlights: TextHighlight[];
  onHighlightsChange: (next: TextHighlight[]) => void;
  registerBlock: (block: HighlightBlock) => void;
  unregisterBlock: (blockId: string) => void;
  handleContainerMouseUp: () => void;
  handleMarkClick: (e: React.MouseEvent, highlightId: string) => void;
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
  const [mode, setMode] = useState<ExamHighlightMode>("highlight");
  const [blocks, setBlocks] = useState<HighlightBlock[]>([]);

  const registerBlock = useCallback((block: HighlightBlock) => {
    setBlocks((prev) => {
      if (prev.some((b) => b.id === block.id)) {
        return prev.map((b) => (b.id === block.id ? block : b));
      }
      return [...prev, block];
    });
  }, []);

  const unregisterBlock = useCallback((blockId: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== blockId));
  }, []);

  const handleContainerMouseUp = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const selection = window.getSelection();
    const clickedMark = (selection?.anchorNode?.parentElement as HTMLElement | null)?.closest(
      "[data-highlight-id]"
    ) as HTMLElement | null;

    if (selection?.isCollapsed && clickedMark) {
      const id = clickedMark.dataset.highlightId;
      if (id) onHighlightsChange(removeHighlight(highlights, id));
      return;
    }

    const ranges = getSelectionRangesInContainer(container, blocks);
    if (ranges.length === 0) return;

    if (mode === "erase") {
      let next = highlights;
      for (const range of ranges) {
        next = removeHighlightsInRange(
          next,
          range.blockId,
          range.startOffset,
          range.endOffset
        );
      }
      onHighlightsChange(next);
    } else {
      onHighlightsChange(addHighlights(highlights, ranges));
    }

    selection?.removeAllRanges();
  }, [blocks, highlights, mode, onHighlightsChange]);

  const handleMarkClick = useCallback(
    (e: React.MouseEvent, highlightId: string) => {
      e.preventDefault();
      e.stopPropagation();
      onHighlightsChange(removeHighlight(highlights, highlightId));
      window.getSelection()?.removeAllRanges();
    },
    [highlights, onHighlightsChange]
  );

  const value = useMemo(
    () => ({
      mode,
      setMode,
      highlights,
      onHighlightsChange,
      registerBlock,
      unregisterBlock,
      handleContainerMouseUp,
      handleMarkClick,
    }),
    [
      mode,
      highlights,
      onHighlightsChange,
      registerBlock,
      unregisterBlock,
      handleContainerMouseUp,
      handleMarkClick,
    ]
  );

  return (
    <ExamHighlightContext.Provider value={value}>
      {showToolbar ? <ExamHighlightToolbar className={toolbarClassName} /> : null}
      <div
        ref={containerRef}
        data-highlight-section={sectionId}
        onMouseUp={handleContainerMouseUp}
        className={`${mode === "erase" ? "cursor-cell" : ""} ${className}`}
      >
        {children}
      </div>
    </ExamHighlightContext.Provider>
  );
}

function useHighlightBlock(blockId: string, text: string) {
  const ctx = useContext(ExamHighlightContext);

  useEffect(() => {
    if (!ctx || !text) return;
    ctx.registerBlock({ id: blockId, text });
    return () => ctx.unregisterBlock(blockId);
  }, [ctx, blockId, text]);
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
  useHighlightBlock(blockId, text);

  if (!ctx || !text) {
    return <span className={className}>{text}</span>;
  }

  const blockHighlights = ctx.highlights.filter((h) => h.blockId === blockId);
  const segments = buildHighlightSegments(text, blockHighlights);

  return (
    <span className={className} data-highlight-block={blockId}>
      {segments.map((segment, idx) =>
        segment.highlighted ? (
          <mark
            key={`${blockId}-${idx}`}
            data-highlight-id={segment.highlightId}
            onClick={(e) =>
              segment.highlightId ? ctx.handleMarkClick(e, segment.highlightId) : undefined
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
