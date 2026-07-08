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

export function getSelectionRangesInContainer(
  container: HTMLElement,
  blocks: HighlightBlock[]
): Omit<TextHighlight, "id">[] {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return [];
  }

  const range = selection.getRangeAt(0);
  const results: Omit<TextHighlight, "id">[] = [];

  for (const block of blocks) {
    const blockEl = container.querySelector<HTMLElement>(
      `[data-highlight-block="${block.id}"]`
    );
    if (!blockEl) continue;

    const blockRange = document.createRange();
    blockRange.selectNodeContents(blockEl);

    if (range.compareBoundaryPoints(Range.END_TO_START, blockRange) <= 0) continue;
    if (range.compareBoundaryPoints(Range.START_TO_END, blockRange) >= 0) continue;

    const startRange = document.createRange();
    startRange.selectNodeContents(blockEl);
    if (range.compareBoundaryPoints(Range.START_TO_START, blockRange) < 0) {
      startRange.setStart(blockEl, 0);
    } else {
      startRange.setStart(range.startContainer, range.startOffset);
    }

    const endRange = document.createRange();
    endRange.selectNodeContents(blockEl);
    if (range.compareBoundaryPoints(Range.END_TO_END, blockRange) > 0) {
      endRange.setEnd(blockEl, blockEl.childNodes.length);
    } else {
      endRange.setEnd(range.endContainer, range.endOffset);
    }

    const prefix = document.createRange();
    prefix.selectNodeContents(blockEl);
    prefix.setEnd(startRange.startContainer, startRange.startOffset);
    const startOffset = prefix.toString().length;

    prefix.setEnd(endRange.endContainer, endRange.endOffset);
    const endOffset = prefix.toString().length;

    if (endOffset > startOffset) {
      results.push({ blockId: block.id, startOffset, endOffset });
    }
  }

  return results;
}
