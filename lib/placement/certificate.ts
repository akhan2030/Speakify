import { bandToCefr } from "./scoring";
import { parseTargetBandNumeric } from "./onboarding";
import type { PlacementOnboarding } from "./onboarding";
import type { PlacementResult } from "./types";

export const CERT_SKILL_ORDER: { key: string; label: string }[] = [
  { key: "vocabulary", label: "Vocabulary" },
  { key: "grammar", label: "Grammar" },
  { key: "reading", label: "Reading" },
  { key: "writing_prompt", label: "Writing" },
  { key: "listening", label: "Listening" },
  { key: "speaking", label: "Speaking" },
];

export function formatBand(band: number) {
  return band.toFixed(1);
}

export function generateCertificateId(completedAt: string, studentName: string) {
  const year = new Date(completedAt).getFullYear();
  let hash = 0;
  const seed = `${completedAt}|${studentName}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return `SPK-${year}-${String(Math.abs(hash % 100000)).padStart(5, "0")}`;
}

export function resolveTargetBand(
  onboarding: PlacementOnboarding | null | undefined
): number | null {
  const parsed = parseTargetBandNumeric(onboarding?.targetBandScore ?? "");
  if (parsed == null || parsed < 4 || parsed > 9) return null;
  return parsed;
}

export function getRecommendedProgram(currentBand: number): string {
  if (currentBand < 5.5) return "Speakify Foundation Track — 6 weeks";
  if (currentBand < 7.0) return "Speakify Plus Track — 6 weeks";
  return "Speakify Elite Track — 4 weeks";
}

export function getEstimatedTimeline(gap: number): string {
  if (gap <= 0) {
    return "Maintain your level with 2–4 weeks of focused practice";
  }
  if (gap <= 0.5) return "4 weeks with full commitment";
  if (gap <= 1.0) return "8 weeks with full commitment";
  return "12–16 weeks with full commitment";
}

export function getPathwayProgramLabel(currentBand: number): string {
  if (currentBand < 5.5) return "Foundation Track (6 weeks)";
  if (currentBand < 7.0) return "Plus Track (6 weeks)";
  return "Elite Track (4 weeks)";
}

export type RoadmapWeek = {
  week: number;
  phase: string;
  focus: string;
};

export function buildRoadmapWeeks(weakAreas: string[]): RoadmapWeek[] {
  const weakest = weakAreas[0] ?? "your weakest skill";
  const second = weakAreas[1] ?? "reading comprehension";
  return [
    {
      week: 1,
      phase: "Foundation",
      focus: `${weakest} — core skills and confidence building`,
    },
    {
      week: 2,
      phase: "Development",
      focus: `${second} + vocabulary expansion`,
    },
    {
      week: 3,
      phase: "Integration",
      focus: "Mock tests + timed writing practice",
    },
    {
      week: 4,
      phase: "Final Preparation",
      focus: "Full mock exam + speaking confidence drills",
    },
  ];
}

export function formatWhatsAppDisplay(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("966") && digits.length >= 11) {
    const local = digits.slice(3);
    if (local.length === 9) {
      return `+966 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
    }
  }
  return raw.trim().startsWith("+") ? raw.trim() : `+${digits}`;
}

export function buildSkillRows(
  skillBands: Record<string, number>,
  overallBand: number
) {
  return CERT_SKILL_ORDER.map(({ key, label }) => {
    const band = skillBands[key] ?? overallBand;
    const { cefr } = bandToCefr(band);
    return { label, band, cefr };
  });
}

export type PlacementCertificateData = ReturnType<typeof buildCertificateData>;

export function buildCertificateData(
  result: PlacementResult,
  completedAt: string,
  onboarding: PlacementOnboarding | null | undefined,
  sessionName?: string | null
) {
  const studentName =
    onboarding?.fullName?.trim() ||
    sessionName?.trim() ||
    "Achievement Candidate";

  const currentBand = result.overallBand;
  const resolvedTarget = resolveTargetBand(onboarding);
  const effectiveTarget =
    resolvedTarget ?? Math.min(9, Math.round((currentBand + 1) * 2) / 2);
  const bandGap = Math.max(
    0,
    Math.round((effectiveTarget - currentBand) * 10) / 10
  );

  const scaleMin = 4;
  const scaleMax = 9;
  const currentPct =
    ((Math.min(scaleMax, Math.max(scaleMin, currentBand)) - scaleMin) /
      (scaleMax - scaleMin)) *
    100;

  const cefrInfo = bandToCefr(currentBand);

  return {
    studentName,
    issuedDate: new Date(completedAt).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    certificateId: generateCertificateId(completedAt, studentName),
    skillRows: buildSkillRows(result.skillBands, currentBand),
    currentBand,
    targetBand: effectiveTarget,
    bandGap,
    currentPct,
    targetPct:
      ((Math.min(scaleMax, Math.max(scaleMin, effectiveTarget)) - scaleMin) /
        (scaleMax - scaleMin)) *
      100,
    cefrInfo,
    recommendedProgram: getRecommendedProgram(currentBand),
    estimatedTimeline: getEstimatedTimeline(bandGap),
    purpose: onboarding?.ieltsPurpose?.trim() || null,
    showPathwayOption: bandGap > 1.5,
    pathwayProgram: getPathwayProgramLabel(currentBand),
    roadmapWeeks: buildRoadmapWeeks(result.weakAreas),
  };
}
