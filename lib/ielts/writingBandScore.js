/**
 * IELTS Academic Writing band parsing and overall score calculation.
 * Task 1 first criterion: TA (Task Achievement). Task 2: TR (Task Response).
 */

const CRITERION_KEYS = ["ta", "cc", "lr", "gra"];

function firstCriterionLabel(taskType = "task2") {
  return taskType === "task1" ? "TA" : "TR";
}

export function clampWritingBand(n) {
  if (n == null || !Number.isFinite(n)) return null;
  return Math.max(0, Math.min(9, n));
}

/**
 * Normalize AI-parsed scores to IELTS 0–9 half-band scale.
 * Handles mistaken 0–1 fractions (0.8 → 8) and percent-style values (80 → 8).
 */
export function normalizeCriterionScore(raw) {
  if (raw == null || !Number.isFinite(Number(raw))) return null;
  let val = Number(raw);

  if (val > 9 && val <= 100) {
    val = val / 10;
  }

  if (val > 0 && val <= 1) {
    const scaledTen = val * 10;
    const scaledNine = val * 9;
    if (scaledTen >= 4 && scaledTen <= 9) {
      val = scaledTen;
    } else if (scaledNine >= 4 && scaledNine <= 9) {
      val = scaledNine;
    } else {
      val = scaledTen;
    }
  }

  val = Math.round(val * 2) / 2;
  return clampWritingBand(val);
}

/**
 * Official IELTS Writing rounding to nearest 0.5:
 * - .25 or below → round down to whole (6.25 → 6.0)
 * - above .25 and below .75 → .5 (6.4 → 6.5)
 * - .75 or above → round up to whole (6.75 → 7.0)
 */
export function roundIeltsWritingBand(average) {
  if (!Number.isFinite(average)) return null;
  const clamped = Math.max(0, Math.min(9, average));
  const whole = Math.floor(clamped);
  const decimal = clamped - whole;

  if (decimal <= 0.25 + Number.EPSILON) return whole;
  if (decimal < 0.75 - Number.EPSILON) return whole + 0.5;
  return Math.min(9, whole + 1);
}

export function calculateWritingOverallBand(ta, cc, lr, gra) {
  if ([ta, cc, lr, gra].some((v) => v == null || !Number.isFinite(v))) {
    return null;
  }
  const avg = (ta + cc + lr + gra) / 4;
  return roundIeltsWritingBand(avg);
}

function parseCriterionFromText(text, label) {
  const re = new RegExp(
    `(?:^|\\n)${label}\\s*:\\s*([0-9]+(?:\\.[0-9])?)\\s*(?:\\/\\s*9)?`,
    "i"
  );
  const header = text.slice(0, 600);
  const match = header.match(re);
  if (!match) return null;
  return normalizeCriterionScore(Number(match[1]));
}

export function parseWritingCriterionScores(text, taskType = "task2") {
  const firstLabel = firstCriterionLabel(taskType);
  const firstScore =
    parseCriterionFromText(text, firstLabel) ??
    parseCriterionFromText(text, "TA");
  return {
    ta: firstScore,
    cc: parseCriterionFromText(text, "CC"),
    lr: parseCriterionFromText(text, "LR"),
    gra: parseCriterionFromText(text, "GRA"),
  };
}

export function finalizeWritingBands(evaluationText, taskType = "task2") {
  const parsed = parseWritingCriterionScores(evaluationText, taskType);
  const overall = calculateWritingOverallBand(
    parsed.ta,
    parsed.cc,
    parsed.lr,
    parsed.gra
  );
  return { ...parsed, overall };
}

export function formatBandForDisplay(score) {
  if (score == null || !Number.isFinite(score)) return "—";
  return Number.isInteger(score) ? String(score) : score.toFixed(1);
}

/** Replace score header lines so clients always see consistent X/9 values. */
export function rewriteEvaluationScores(evaluation, bands, taskType = "task2") {
  const { ta, cc, lr, gra, overall } = bands;
  if (
    ta == null ||
    cc == null ||
    lr == null ||
    gra == null ||
    overall == null
  ) {
    return evaluation;
  }

  const firstLabel = firstCriterionLabel(taskType);
  const header = [
    `${firstLabel}: ${formatBandForDisplay(ta)}/9`,
    `CC: ${formatBandForDisplay(cc)}/9`,
    `LR: ${formatBandForDisplay(lr)}/9`,
    `GRA: ${formatBandForDisplay(gra)}/9`,
    `Overall Band: ${formatBandForDisplay(overall)}`,
  ].join("\n");

  const body = evaluation
    .split("\n")
    .filter((line) => !/^(TA|TR|CC|LR|GRA)\s*:/i.test(line.trim()))
    .filter((line) => !/^Overall Band\s*:/i.test(line.trim()))
    .join("\n")
    .trim();

  return body ? `${header}\n\n${body}` : header;
}

export { CRITERION_KEYS, firstCriterionLabel };
