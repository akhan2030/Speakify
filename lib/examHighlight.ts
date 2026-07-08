export type TextHighlight = {
  id: string;
  blockId: string;
  startOffset: number;
  endOffset: number;
};

export type HighlightBlock = {
  id: string;
  label?: string;
  text: string;
};

export type ExamHighlightMode = "highlight" | "erase";

export function createHighlightId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `hl-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Split plain passage text into highlight blocks (for GT / plain-text mode). */
export function plainTextToBlocks(text: string, prefix = "p"): HighlightBlock[] {
  const parts = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return [{ id: `${prefix}-0`, text }];
  if (parts.length === 1) return [{ id: `${prefix}-0`, text: parts[0] }];
  return parts.map((part, i) => ({ id: `${prefix}-${i}`, text: part }));
}

function mergeBlockRanges(ranges: TextHighlight[]): TextHighlight[] {
  if (ranges.length === 0) return [];
  const sorted = [...ranges].sort((a, b) => a.startOffset - b.startOffset);
  const merged: TextHighlight[] = [{ ...sorted[0] }];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];
    if (current.startOffset <= last.endOffset) {
      last.endOffset = Math.max(last.endOffset, current.endOffset);
    } else {
      merged.push({ ...current });
    }
  }

  return merged;
}

export function addHighlights(
  highlights: TextHighlight[],
  additions: Omit<TextHighlight, "id">[]
): TextHighlight[] {
  const valid = additions.filter((a) => a.endOffset > a.startOffset);
  if (valid.length === 0) return highlights;

  const byBlock = new Map<string, TextHighlight[]>();
  for (const h of highlights) {
    const list = byBlock.get(h.blockId) ?? [];
    list.push(h);
    byBlock.set(h.blockId, list);
  }

  for (const addition of valid) {
    const list = byBlock.get(addition.blockId) ?? [];
    list.push({ ...addition, id: createHighlightId() });
    byBlock.set(addition.blockId, mergeBlockRanges(list));
  }

  return Array.from(byBlock.values()).flat();
}

export function removeHighlight(highlights: TextHighlight[], id: string): TextHighlight[] {
  return highlights.filter((h) => h.id !== id);
}

export function removeHighlightsInRange(
  highlights: TextHighlight[],
  blockId: string,
  startOffset: number,
  endOffset: number
): TextHighlight[] {
  const kept: TextHighlight[] = [];
  const affected = highlights.filter((h) => h.blockId === blockId);

  for (const h of affected) {
    if (h.endOffset <= startOffset || h.startOffset >= endOffset) {
      kept.push(h);
      continue;
    }

    if (h.startOffset < startOffset) {
      kept.push({
        ...h,
        id: createHighlightId(),
        endOffset: startOffset,
      });
    }
    if (h.endOffset > endOffset) {
      kept.push({
        ...h,
        id: createHighlightId(),
        startOffset: endOffset,
      });
    }
  }

  return [...highlights.filter((h) => h.blockId !== blockId), ...kept];
}

export type HighlightSegment = {
  text: string;
  highlighted: boolean;
  highlightId?: string;
};

export function buildHighlightSegments(
  text: string,
  blockHighlights: TextHighlight[]
): HighlightSegment[] {
  if (blockHighlights.length === 0) {
    return [{ text, highlighted: false }];
  }

  const sorted = [...blockHighlights].sort((a, b) => a.startOffset - b.startOffset);
  const segments: HighlightSegment[] = [];
  let cursor = 0;

  for (const hl of sorted) {
    const start = Math.max(0, Math.min(hl.startOffset, text.length));
    const end = Math.max(start, Math.min(hl.endOffset, text.length));
    if (end <= start) continue;

    if (start > cursor) {
      segments.push({ text: text.slice(cursor, start), highlighted: false });
    }
    segments.push({
      text: text.slice(start, end),
      highlighted: true,
      highlightId: hl.id,
    });
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), highlighted: false });
  }

  return segments.length > 0 ? segments : [{ text, highlighted: false }];
}

/** Character offset of a DOM point within a highlight block. */
export function getOffsetWithinBlock(
  blockEl: HTMLElement,
  container: Node,
  offset: number
): number | null {
  if (container === blockEl) {
    return Math.max(0, Math.min(offset, blockEl.textContent?.length ?? 0));
  }

  if (!blockEl.contains(container)) return null;

  const doc = blockEl.ownerDocument;
  const walker = doc.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT);
  let total = 0;
  let node = walker.nextNode() as Text | null;

  while (node) {
    if (node === container) {
      return total + offset;
    }
    total += node.length;
    node = walker.nextNode() as Text | null;
  }

  return null;
}

export function getSelectionIntersectionInBlock(
  blockEl: HTMLElement,
  range: Range
): { startOffset: number; endOffset: number } | null {
  const textLength = blockEl.textContent?.length ?? 0;
  if (textLength === 0) return null;

  const startInBlock = getOffsetWithinBlock(
    blockEl,
    range.startContainer,
    range.startOffset
  );
  const endInBlock = getOffsetWithinBlock(blockEl, range.endContainer, range.endOffset);

  // Common case: entire selection sits inside one block.
  if (startInBlock !== null && endInBlock !== null) {
    const startOffset = Math.min(startInBlock, endInBlock);
    const endOffset = Math.max(startInBlock, endInBlock);
    if (endOffset > startOffset) {
      return { startOffset, endOffset };
    }
    return null;
  }

  // Partial overlap when the drag starts/ends outside this block.
  const blockRange = blockEl.ownerDocument.createRange();
  blockRange.selectNodeContents(blockEl);

  const intersects =
    range.compareBoundaryPoints(Range.END_TO_START, blockRange) > 0 &&
    range.compareBoundaryPoints(Range.START_TO_END, blockRange) < 0;

  if (!intersects) return null;

  let startOffset = 0;
  let endOffset = textLength;

  if (startInBlock !== null) {
    startOffset = Math.max(0, Math.min(startInBlock, textLength));
  }
  if (endInBlock !== null) {
    endOffset = Math.max(startOffset, Math.min(endInBlock, textLength));
  }

  if (endOffset > startOffset) {
    return { startOffset, endOffset };
  }

  return null;
}

/**
 * Read a text range as highlight ranges.
 * Discovers blocks from [data-highlight-block] elements in the container.
 */
export function getSelectionRangesFromRange(
  container: HTMLElement,
  range: Range
): Omit<TextHighlight, "id">[] {
  if (!container.contains(range.commonAncestorContainer)) {
    return [];
  }

  const results: Omit<TextHighlight, "id">[] = [];
  const blockEls = container.querySelectorAll<HTMLElement>("[data-highlight-block]");

  for (const blockEl of blockEls) {
    const blockId = blockEl.getAttribute("data-highlight-block");
    if (!blockId) continue;

    const intersection = getSelectionIntersectionInBlock(blockEl, range);
    if (intersection) {
      results.push({
        blockId,
        startOffset: intersection.startOffset,
        endOffset: intersection.endOffset,
      });
    }
  }

  return results;
}

/**
 * Read the current text selection as highlight ranges.
 * Discovers blocks from [data-highlight-block] elements in the container.
 */
export function getSelectionRangesInContainer(
  container: HTMLElement
): Omit<TextHighlight, "id">[] {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return [];
  }

  return getSelectionRangesFromRange(container, selection.getRangeAt(0));
}

export function findHighlightMarkFromEventTarget(
  target: EventTarget | null
): HTMLElement | null {
  if (!target || typeof (target as HTMLElement).closest !== "function") {
    return null;
  }
  return (target as HTMLElement).closest("[data-highlight-id]");
}

export function processHighlightInteraction({
  container,
  highlights,
  mode,
  target,
  range,
}: {
  container: HTMLElement;
  highlights: TextHighlight[];
  mode: ExamHighlightMode;
  target?: EventTarget | null;
  range?: Range | null;
}): TextHighlight[] | null {
  const selection = window.getSelection();
  const clickedMark = findHighlightMarkFromEventTarget(target ?? null);

  if ((!range || range.collapsed) && selection?.isCollapsed && clickedMark) {
    const id = clickedMark.dataset.highlightId;
    if (id) return removeHighlight(highlights, id);
    return null;
  }

  const activeRange =
    range && !range.collapsed
      ? range
      : selection && !selection.isCollapsed && selection.rangeCount > 0
        ? selection.getRangeAt(0)
        : null;

  if (!activeRange) return null;

  const ranges = getSelectionRangesFromRange(container, activeRange);
  if (ranges.length === 0) return null;

  if (mode === "erase") {
    let next = highlights;
    for (const item of ranges) {
      next = removeHighlightsInRange(
        next,
        item.blockId,
        item.startOffset,
        item.endOffset
      );
    }
    return next;
  }

  return addHighlights(highlights, ranges);
}
