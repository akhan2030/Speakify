import { calculateListeningBand } from "./listeningGenerator.js";

/**
 * @param {{ results: Array<{ correct: boolean }> }} scored
 * @param {number[]} questionNumbers — global Q1–40, same order as scored.results
 */
export function computeSectionScores(scored, questionNumbers) {
  /** @type {Record<string, { score: number; total: number; band: number }>} */
  const sections = {
    "1": { score: 0, total: 10, band: 3.5 },
    "2": { score: 0, total: 10, band: 3.5 },
    "3": { score: 0, total: 10, band: 3.5 },
    "4": { score: 0, total: 10, band: 3.5 },
  };

  const results = scored.results ?? [];

  results.forEach((row, index) => {
    const qNum = Number(questionNumbers[index] ?? index + 1);
    const section = Math.min(4, Math.max(1, Math.floor((qNum - 1) / 10) + 1));
    const key = String(section);
    if (row.correct) {
      sections[key].score += 1;
    }
  });

  for (const key of Object.keys(sections)) {
    sections[key].band = calculateListeningBand(sections[key].score, 10);
  }

  return sections;
}
