export type CriteriaHistoryPoint = {
  sessionNumber: number;
  band: number;
  date?: string;
  criteria?: {
    fluencyCoherence?: number;
    lexicalResource?: number;
    grammaticalRange?: number;
    pronunciation?: number;
  };
};

export const CRITERION_CHART_LINES = [
  { key: "fluencyCoherence" as const, label: "Fluency", color: "#0d9488" },
  { key: "lexicalResource" as const, label: "Lexical", color: "#c9972c" },
  { key: "grammaticalRange" as const, label: "Grammar", color: "#6366f1" },
  { key: "pronunciation" as const, label: "Pronunciation", color: "#ec4899" },
];

function num(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeCriteriaHistory(
  history: CriteriaHistoryPoint[],
  sessionRows: {
    session_number: number;
    overall_band?: number | null;
    fluency_band?: number | null;
    lexical_band?: number | null;
    grammar_band?: number | null;
    pronunciation_band?: number | null;
    completed_at?: string | null;
  }[] = []
): CriteriaHistoryPoint[] {
  const bySession = new Map<number, CriteriaHistoryPoint>();

  for (const row of history) {
    if (!row?.sessionNumber) continue;
    bySession.set(row.sessionNumber, {
      sessionNumber: row.sessionNumber,
      band: num(row.band) ?? 0,
      date: row.date,
      criteria: row.criteria,
    });
  }

  for (const row of sessionRows) {
    const sessionNumber = Number(row.session_number);
    if (!sessionNumber) continue;

    const existing = bySession.get(sessionNumber);
    const mergedCriteria = {
      fluencyCoherence:
        existing?.criteria?.fluencyCoherence ?? num(row.fluency_band) ?? undefined,
      lexicalResource:
        existing?.criteria?.lexicalResource ?? num(row.lexical_band) ?? undefined,
      grammaticalRange:
        existing?.criteria?.grammaticalRange ?? num(row.grammar_band) ?? undefined,
      pronunciation:
        existing?.criteria?.pronunciation ?? num(row.pronunciation_band) ?? undefined,
    };

    bySession.set(sessionNumber, {
      sessionNumber,
      band: num(row.overall_band) ?? existing?.band ?? 0,
      date: row.completed_at ?? existing?.date,
      criteria: mergedCriteria,
    });
  }

  return [...bySession.values()].sort((a, b) => a.sessionNumber - b.sessionNumber);
}

export function buildCriteriaChartData(history: CriteriaHistoryPoint[]) {
  return history.slice(-5).map((point, index) => {
    const sessionNo = Number(point.sessionNumber);
    return {
      name:
        Number.isFinite(sessionNo) && sessionNo > 0 && sessionNo < 10000
          ? `S${sessionNo}`
          : `S${index + 1}`,
      overall: point.band,
      fluencyCoherence: point.criteria?.fluencyCoherence ?? null,
      lexicalResource: point.criteria?.lexicalResource ?? null,
      grammaticalRange: point.criteria?.grammaticalRange ?? null,
      pronunciation: point.criteria?.pronunciation ?? null,
    };
  });
}

export function generateProgressChartInsight(history: CriteriaHistoryPoint[]): string | null {
  const withCriteria = history.filter((point) =>
    CRITERION_CHART_LINES.some((line) => num(point.criteria?.[line.key]) != null)
  );

  if (withCriteria.length < 2) {
    return "Complete at least 2 sessions to see which criterion is helping or holding your band back.";
  }

  const previous = withCriteria[withCriteria.length - 2];
  const latest = withCriteria[withCriteria.length - 1];

  const deltas = CRITERION_CHART_LINES.map((line) => {
    const prevScore = num(previous.criteria?.[line.key]);
    const latestScore = num(latest.criteria?.[line.key]);
    if (prevScore == null || latestScore == null) return null;
    return {
      ...line,
      prevScore,
      latestScore,
      delta: latestScore - prevScore,
    };
  }).filter(Boolean) as Array<{
    key: (typeof CRITERION_CHART_LINES)[number]["key"];
    label: string;
    color: string;
    prevScore: number;
    latestScore: number;
    delta: number;
  }>;

  if (deltas.length === 0) {
    return null;
  }

  const improved = [...deltas].sort((a, b) => b.delta - a.delta)[0];
  const bottleneck = [...deltas].sort((a, b) => a.latestScore - b.latestScore)[0];

  if (improved.delta > 0.05 && bottleneck.latestScore < improved.latestScore - 0.2) {
    return `Your ${improved.label.toLowerCase()} has improved, but ${bottleneck.label.toLowerCase()} is holding your band back.`;
  }

  if (improved.delta > 0.05) {
    return `Your ${improved.label.toLowerCase()} moved up most between your last two sessions — keep building on that momentum.`;
  }

  if (improved.delta < -0.05) {
    return `Your ${improved.label.toLowerCase()} dipped slightly last session. Focus there in your next practice.`;
  }

  return `Your scores are steady overall. ${bottleneck.label} is currently your weakest criterion — target that next.`;
}
