export function roundBand(value: number) {
  return Math.round(value * 10) / 10;
}

export function estimateWeeklyBandGain(studyDaysPerWeek: number, streak: number, recentTasks: number) {
  let gain = 0.12;
  if (studyDaysPerWeek >= 5) gain += 0.06;
  else if (studyDaysPerWeek >= 3) gain += 0.03;
  else gain -= 0.03;
  if (streak >= 7) gain += 0.04;
  else if (streak >= 3) gain += 0.02;
  if (recentTasks >= 20) gain += 0.03;
  return Math.max(0.05, Math.min(0.35, roundBand(gain)));
}

export function projectBandAtExamDate(
  currentBand: number | null,
  targetBand: number,
  daysToExam: number | null,
  studyDaysPerWeek: number,
  streak: number,
  recentTasks: number
) {
  if (currentBand == null) {
    return {
      projectedBand: null,
      weeklyBandGain: estimateWeeklyBandGain(studyDaysPerWeek, streak, recentTasks),
      onTrack: false,
      message: "Complete a mock or skill practice to get your first band estimate.",
    };
  }

  const weeklyBandGain = estimateWeeklyBandGain(studyDaysPerWeek, streak, recentTasks);

  if (daysToExam == null || daysToExam <= 0) {
    const weeks = Math.ceil(Math.max(0, targetBand - currentBand) / weeklyBandGain) || 1;
    return {
      projectedBand: roundBand(Math.min(9, currentBand + weeklyBandGain * weeks)),
      weeklyBandGain,
      onTrack: weeklyBandGain >= 0.1 && studyDaysPerWeek >= 4,
      message: `At your current rate (~${weeklyBandGain.toFixed(2)} band/week), set an exam date to see your projection.`,
    };
  }

  const weeks = daysToExam / 7;
  const projectedBand = roundBand(Math.min(9, currentBand + weeklyBandGain * weeks));
  const onTrack = projectedBand >= targetBand - 0.25;
  const examLabel =
    daysToExam === 1 ? "exam day" : `exam day (${daysToExam} days)`;

  let message = `At your current rate you will reach Band ${projectedBand.toFixed(1)} by ${examLabel}.`;
  if (onTrack) {
    message += ` On track for Band ${targetBand.toFixed(1)} ✅`;
  } else {
    message += ` Increase to 5+ study days/week to reach Band ${targetBand.toFixed(1)}.`;
  }

  return { projectedBand, weeklyBandGain, onTrack, message };
}

export type BandTrendPoint = {
  date: string;
  label: string;
  band: number;
};

export function buildBandTrendFromHistory(
  rows: Array<{ band_score: number; recorded_at: string; skill: string }>,
  currentBand: number | null
): BandTrendPoint[] {
  const overallRows = rows.filter((r) => r.skill === "overall");
  const source = overallRows.length ? overallRows : rows;

  const byDate = new Map<string, number>();
  for (const row of source) {
    const date = String(row.recorded_at).slice(0, 10);
    if (!byDate.has(date)) {
      byDate.set(date, Number(row.band_score));
    }
  }

  let points: BandTrendPoint[] = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([date, band]) => ({
      date,
      band: roundBand(band),
      label: new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
    }));

  if (!points.length && currentBand != null) {
    const today = new Date().toISOString().slice(0, 10);
    points = [
      {
        date: today,
        band: currentBand,
        label: "Now",
      },
    ];
  }

  return points;
}
