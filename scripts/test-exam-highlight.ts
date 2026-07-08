/**
 * Validates exam highlight selection logic in a DOM environment.
 * Run: node --experimental-strip-types scripts/test-exam-highlight.ts
 */

import { JSDOM } from "jsdom";
import {
  addHighlights,
  buildHighlightSegments,
  getSelectionRangesFromRange,
  processHighlightInteraction,
  removeHighlight,
} from "../lib/examHighlight.ts";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`✗ ${message}`);
    process.exit(1);
  }
  console.log(`✓ ${message}`);
}

const dom = new JSDOM(`
  <div id="container">
    <span data-highlight-block="p1">The quick brown fox jumps over the lazy dog.</span>
  </div>
`);

const { window } = dom;
const document = window.document;
(globalThis as typeof globalThis & { window: Window; document: Document }).window =
  window as unknown as Window & typeof globalThis.window;
(globalThis as typeof globalThis & { document: Document }).document = document;
(globalThis as typeof globalThis & { Range: typeof Range }).Range = window.Range;
(globalThis as typeof globalThis & { NodeFilter: typeof NodeFilter }).NodeFilter =
  window.NodeFilter;
const container = document.getElementById("container") as HTMLElement;
const block = container.querySelector("[data-highlight-block]") as HTMLElement;
const textNode = block.firstChild as Text;

function selectText(start: number, end: number) {
  const range = document.createRange();
  range.setStart(textNode, start);
  range.setEnd(textNode, end);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
}

// Highlight a phrase
selectText(4, 15);
const range = window.getSelection()!.getRangeAt(0);
const ranges = getSelectionRangesFromRange(container, range);
assert(ranges.length === 1, "detects one selection range");
assert(ranges[0].blockId === "p1", "block id matches");
assert(ranges[0].startOffset === 4, "start offset correct");
assert(ranges[0].endOffset === 15, "end offset correct");

let highlights = addHighlights([], ranges);
assert(highlights.length === 1, "adds one highlight");

const segments = buildHighlightSegments(block.textContent ?? "", highlights);
assert(
  segments.some((s) => s.highlighted && s.text === "quick brown"),
  "renders highlighted segment"
);

// Erase by clicking mark
const mark = document.createElement("mark");
mark.dataset.highlightId = highlights[0].id;
mark.textContent = "quick brown";
block.replaceChildren(
  document.createTextNode("The "),
  mark,
  document.createTextNode(" fox jumps over the lazy dog.")
);

const next = processHighlightInteraction({
  container,
  highlights,
  mode: "highlight",
  target: mark,
});
assert(next !== null && next.length === 0, "clicking mark removes highlight");

// Erase by dragging over highlight in erase mode
block.textContent = "The quick brown fox jumps over the lazy dog.";
const freshTextNode = block.firstChild as Text;
const eraseRange = document.createRange();
eraseRange.setStart(freshTextNode, 4);
eraseRange.setEnd(freshTextNode, 15);
highlights = addHighlights([], [{ blockId: "p1", startOffset: 4, endOffset: 15 }]);
const erased = processHighlightInteraction({
  container,
  highlights,
  mode: "erase",
  target: freshTextNode,
  range: eraseRange,
});
assert(erased !== null && erased.length === 0, "erase mode removes dragged range");

// Partial erase keeps remainder
block.textContent = "The quick brown fox jumps over the lazy dog.";
const partialTextNode = block.firstChild as Text;
const partialRange = document.createRange();
partialRange.setStart(partialTextNode, 4);
partialRange.setEnd(partialTextNode, 10);
highlights = addHighlights([], [{ blockId: "p1", startOffset: 4, endOffset: 19 }]);
const partial = processHighlightInteraction({
  container,
  highlights,
  mode: "erase",
  target: partialTextNode,
  range: partialRange,
});
assert(partial !== null && partial.length === 1, "partial erase keeps a highlight");
assert(partial![0].startOffset === 10, "partial erase trims start");

console.log("\nAll exam highlight interaction tests passed.");
