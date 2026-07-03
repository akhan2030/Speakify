import { ACCELERATOR_TRACKS } from "@/lib/accelerator/tracks";
import { bandToCefr } from "@/lib/placement/scoring";
import type {
  GatewayProgramme,
  GatewayRecommendation,
} from "@/lib/onboarding/types";

export function bandToPathwaySubLevel(band: number): string {
  if (band >= 6.5) return "B2.1";
  if (band >= 5.5) return "B1.2";
  if (band >= 4.5) return "B1.1";
  if (band >= 3.5) return "A2.2";
  return "A1.1";
}

const PATHWAY_LABELS: Record<string, string> = {
  "B2.1": "Upper Intermediate",
  "B1.2": "Intermediate",
  "B1.1": "Pre-Intermediate",
  "A2.2": "Elementary",
  "A1.1": "Beginner",
};

export function recommendGatewayTrack(
  programme: GatewayProgramme,
  estimatedBand: number
): GatewayRecommendation {
  if (programme === "ielts") {
    const track =
      estimatedBand >= 7.0 ? "elite" : estimatedBand >= 5.5 ? "plus" : "foundation";
    const meta = ACCELERATOR_TRACKS[track];
    return {
      kind: "ielts",
      track,
      trackLabel: `IELTS Accelerator ${meta.name}`,
      target: meta.target,
      weeks: meta.weekCount,
    };
  }

  if (programme === "step") {
    if (estimatedBand >= 6.5) {
      return { kind: "step", phase: 3, score: "65–80" };
    }
    if (estimatedBand >= 5.0) {
      return { kind: "step", phase: 2, score: "50–65" };
    }
    return { kind: "step", phase: 1, score: "0–50" };
  }

  if (programme === "pathway") {
    const level = bandToPathwaySubLevel(estimatedBand);
    return {
      kind: "pathway",
      level,
      levelLabel: PATHWAY_LABELS[level] ?? bandToCefr(estimatedBand).label,
    };
  }

  const level = bandToPathwaySubLevel(estimatedBand);
  return {
    kind: "business_english",
    level,
    levelLabel: PATHWAY_LABELS[level] ?? "Professional",
  };
}

export function targetBandFromRecommendation(
  programme: GatewayProgramme,
  estimatedBand: number,
  recommendation: GatewayRecommendation
): string {
  if (recommendation.kind === "ielts") {
    if (recommendation.track === "elite") return "7.0+";
    if (recommendation.track === "plus") return "6.5";
    return "5.5";
  }
  if (recommendation.kind === "step") return recommendation.score;
  return estimatedBand >= 5.5 ? "6.0" : "5.0";
}

export function dashboardPathForProgramme(programme: GatewayProgramme): string {
  switch (programme) {
    case "ielts":
      return "/dashboard/ielts/student";
    case "step":
      return "/dashboard/step/student";
    case "pathway":
      return "/dashboard/pathway/student";
    case "business_english":
      return "/dashboard/business-english/student";
    default:
      return "/dashboard/ielts/student";
  }
}

export function programmeGoalLabel(programme: GatewayProgramme): string {
  switch (programme) {
    case "ielts":
      return "IELTS";
    case "step":
      return "STEP";
    case "pathway":
      return "English Pathway";
    case "business_english":
      return "Business English";
    default:
      return "Speakify";
  }
}
