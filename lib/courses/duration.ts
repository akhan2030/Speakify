export type DurationBucket = "all" | "short" | "standard" | "long" | "flexible";

/** Normalize any catalog duration string to a consistent “N weeks” (or Self-paced) label. */
export function formatDurationLabel(duration?: string | null): string {
  const raw = String(duration ?? "").trim();
  if (!raw) return "";
  if (/self[- ]?paced|ongoing|flexible/i.test(raw)) return "Self-paced";
  if (/per level/i.test(raw)) {
    const m = raw.match(/(\d+)\s*weeks?/i);
    return m ? `${m[1]} weeks per level` : "4 weeks per level";
  }
  const m = raw.match(/(\d+)\s*weeks?/i);
  if (m) return `${m[1]} weeks`;
  return raw;
}

/** Extract week count for filters; null = flexible / unknown. */
export function durationWeeks(duration?: string | null): number | null {
  const raw = String(duration ?? "").trim();
  if (!raw || /self[- ]?paced|ongoing|flexible|per level/i.test(raw)) {
    return null;
  }
  const m = raw.match(/(\d+)\s*weeks?/i);
  return m ? Number(m[1]) : null;
}

export function matchesDurationBucket(
  duration: string | undefined,
  bucket: DurationBucket
): boolean {
  if (bucket === "all") return true;
  const weeks = durationWeeks(duration);
  if (bucket === "flexible") return weeks == null;
  if (weeks == null) return false;
  if (bucket === "short") return weeks <= 4;
  if (bucket === "standard") return weeks >= 5 && weeks <= 8;
  if (bucket === "long") return weeks >= 9;
  return true;
}

export const DURATION_FILTER_OPTIONS: { id: DurationBucket; label: string }[] = [
  { id: "all", label: "Any duration" },
  { id: "short", label: "≤ 4 weeks" },
  { id: "standard", label: "5–8 weeks" },
  { id: "long", label: "9+ weeks" },
  { id: "flexible", label: "Self-paced" },
];
