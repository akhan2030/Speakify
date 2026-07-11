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

function isFormInteractionTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return Boolean(
    target.closest(
      'input, textarea, select, button, label, [role="radio"], [role="checkbox"], [data-exam-input]'
    )
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
        onClick={() => setMode(mode === "highlight" ? "idle" : "highlight")}
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
        onClick={() => setMode(mode === "erase" ? "idle" : "erase")}
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
          ? "Drag over passage or questions to highlight · click a highlight to remove"
          : mode === "erase"
            ? "Click or drag over highlights to erase"
            : "Select Highlight or Eraser to annotate · type answers in the fields below"}
      </span>
    </div>
  );
}

type SectionProps = {
  sectionId: string;
  highlights: TextHighlight[];
  onHighlightsChange: (next: TextHighlight[]) => void;
  showToolbar?: boolean;
  defaultMode?: ExamHighlightMode;
  className?: string;
  toolbarClassName?: string;
  children: ReactNode;
};

export function ExamHighlightSection({
  sectionId,
  highlights,
  onHighlightsChange,
  showToolbar = true,
  defaultMode = "idle",
  className = "",
  toolbarClassName = "",
  children,
}: SectionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<ExamHighlightMode>(defaultMode);
  const highlightsRef = useRef(highlights);
  const [mode, setMode] = useState<ExamHighlightMode>(defaultMode);

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
        window.getSelection()?.removeAllRanges();
      }
    },
    [onHighlightsChange]
  );

  const interactionGuardRef = useRef(0);

  // Native capture-phase listener — more reliable inside scroll panes / near form controls.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onPointerUp = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const target = e.target;
      if (!(target instanceof Node) || !container.contains(target)) return;
      if (
        target instanceof HTMLElement &&
        target.closest('[role="toolbar"]')
      ) {
        return;
      }
      if (isFormInteractionTarget(target)) return;
      if (modeRef.current === "idle") return;

      const now = Date.now();
      if (now - interactionGuardRef.current < 40) return;
      interactionGuardRef.current = now;

      const selection = window.getSelection();
      const capturedRange =
        selection && !selection.isCollapsed && selection.rangeCount > 0
          ? selection.getRangeAt(0).cloneRange()
          : null;

      applyInteraction(target, capturedRange);
    };

    container.addEventListener("pointerup", onPointerUp, true);
    return () => container.removeEventListener("pointerup", onPointerUp, true);
  }, [applyInteraction]);

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
      {showToolbar ? (
        <ExamHighlightToolbar
          className={`sticky top-0 z-20 bg-slate-50/95 backdrop-blur-sm ${toolbarClassName}`}
        />
      ) : null}
      <div
        ref={containerRef}
        data-highlight-section={sectionId}
        className={`select-text ${
          mode === "erase"
            ? "cursor-cell"
            : mode === "highlight"
              ? "cursor-text"
              : ""
        } ${className}`}
      >
        {children}
      </div>
    </ExamHighlightContext.Provider>
  );
}

/** Question number + prompt in one highlight block (CD-IELTS style). */
export function ExamHighlightQuestionText({
  blockId,
  number,
  text,
  className = "",
}: {
  blockId: string;
  number?: number | string;
  text: string;
  className?: string;
}) {
  const fullText =
    number !== undefined && String(number).trim() !== ""
      ? `${number}. ${text}`
      : text;
  return (
    <HighlightableInlineText blockId={blockId} text={fullText} className={className} />
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

/** Single radio/checkbox row with highlightable label text. */
export function HighlightableRadioOption({
  blockId,
  name,
  label,
  checked,
  disabled = false,
  onSelect,
  showInput = true,
  inputType = "radio",
  className = "",
}: {
  blockId: string;
  name: string;
  label: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  showInput?: boolean;
  inputType?: "radio" | "checkbox";
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700 ${
        disabled ? "pointer-events-none opacity-60" : ""
      } ${checked ? "border-[#c9972c] bg-[#c9972c]/10" : ""} ${className}`}
    >
      {showInput ? (
        <input
          type={inputType}
          name={inputType === "radio" ? name : undefined}
          checked={checked}
          disabled={disabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            if (!disabled) onSelect();
          }}
          className="mt-0.5 shrink-0 accent-[#c9972c] text-[#0d1b35]"
        />
      ) : null}
      <div className="min-w-0 flex-1 select-text leading-relaxed">
        <HighlightableInlineText blockId={blockId} text={label} />
      </div>
    </div>
  );
}

export function HighlightableTfngOptions({
  blockIdPrefix,
  name,
  options,
  value,
  onChange,
  disabled = false,
  className = "",
}: {
  blockIdPrefix: string;
  name: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={`mt-2 flex flex-wrap gap-2 ${className}`}>
      {options.map((opt) => (
        <HighlightableRadioOption
          key={opt}
          blockId={`${blockIdPrefix}-${opt.replace(/\s+/g, "-")}`}
          name={name}
          label={opt}
          checked={value === opt}
          disabled={disabled}
          onSelect={() => onChange(opt)}
        />
      ))}
    </div>
  );
}

/** MCQ row: radio/checkbox separate from highlightable text so drag-select works. */
export function HighlightableMcqOption({
  blockId,
  letter,
  text,
  name,
  checked,
  disabled = false,
  onSelect,
  multiSelect = false,
  className = "",
}: {
  blockId: string;
  letter: string;
  text: string;
  name: string;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
  multiSelect?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border border-slate-100 px-3 py-2 text-sm text-slate-700 ${
        disabled ? "pointer-events-none opacity-60" : ""
      } ${className}`}
    >
      <input
        type={multiSelect ? "checkbox" : "radio"}
        name={multiSelect ? undefined : name}
        checked={checked}
        disabled={disabled}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          if (!disabled) onSelect();
        }}
        className="mt-0.5 shrink-0 accent-[#c9972c] text-[#0d1b35]"
      />
      <div className="min-w-0 flex-1 select-text leading-relaxed">
        <strong className="text-[#0d1b35]">{letter}.</strong>{" "}
        <HighlightableInlineText blockId={blockId} text={text} />
      </div>
    </div>
  );
}
