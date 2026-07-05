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

function ieltsTrackRecommendation(estimatedBand: number, prefix: string) {
  const track =
    estimatedBand >= 7.0 ? "elite" : estimatedBand >= 5.5 ? "plus" : "foundation";
  const meta = ACCELERATOR_TRACKS[track];
  return { track, trackLabel: `${prefix} ${meta.name}`, target: meta.target, weeks: meta.weekCount };
}

export function recommendGatewayTrack(
  programme: GatewayProgramme,
  estimatedBand: number
): GatewayRecommendation {
  if (programme === "ielts") {
    const rec = ieltsTrackRecommendation(estimatedBand, "IELTS Accelerator");
    return { kind: "ielts", ...rec };
  }

  if (programme === "ielts_general") {
    const rec = ieltsTrackRecommendation(estimatedBand, "IELTS General");
    return { kind: "ielts_general", ...rec };
  }

  if (programme === "toefl") {
    if (estimatedBand >= 6.5) {
      return { kind: "toefl", targetScore: "100+", levelLabel: "Advanced readiness" };
    }
    if (estimatedBand >= 5.5) {
      return { kind: "toefl", targetScore: "80–99", levelLabel: "University-ready track" };
    }
    return { kind: "toefl", targetScore: "60–79", levelLabel: "Foundation TOEFL prep" };
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

  if (programme === "business_english") {
    const level = bandToPathwaySubLevel(estimatedBand);
    return {
      kind: "business_english",
      level,
      levelLabel: PATHWAY_LABELS[level] ?? "Professional",
    };
  }

  if (programme === "legal_english") {
    const level = bandToPathwaySubLevel(estimatedBand);
    const label =
      estimatedBand >= 6.5
        ? "Legal professional (B2+)"
        : estimatedBand >= 5.5
          ? "Legal workplace (B1+)"
          : "Legal foundations";
    return {
      kind: "legal_english",
      level,
      levelLabel: label,
    };
  }

  const level = bandToPathwaySubLevel(estimatedBand);
  const kidsLevel =
    estimatedBand >= 5.5 ? "Champion" : estimatedBand >= 4.5 ? "Explorer" : "Starter";
  const ageBand = estimatedBand >= 5.5 ? "Ages 10–12" : "Ages 6–9";
  return {
    kind: "kids_english",
    level: kidsLevel,
    levelLabel: PATHWAY_LABELS[level] ?? "Young learner",
    ageBand,
  };
}

export function targetBandFromRecommendation(
  _programme: GatewayProgramme,
  estimatedBand: number,
  recommendation: GatewayRecommendation
): string {
  if (recommendation.kind === "ielts" || recommendation.kind === "ielts_general") {
    if (recommendation.track === "elite") return "7.0+";
    if (recommendation.track === "plus") return "6.5";
    return "5.5";
  }
  if (recommendation.kind === "toefl") return recommendation.targetScore;
  if (recommendation.kind === "step") return recommendation.score;
  if (recommendation.kind === "kids_english") return recommendation.ageBand;
  if (recommendation.kind === "pathway") return recommendation.level;
  return estimatedBand >= 5.5 ? "6.0" : "5.0";
}

export function recommendationProgrammeLabel(recommendation: GatewayRecommendation): string {
  switch (recommendation.kind) {
    case "ielts":
    case "ielts_general":
      return recommendation.trackLabel;
    case "toefl":
      return `TOEFL Preparation (${recommendation.levelLabel})`;
    case "step":
      return `STEP Phase ${recommendation.phase}`;
    case "pathway":
      return `English Pathway ${recommendation.level}`;
    case "business_english":
      return `Business English ${recommendation.level}`;
    case "legal_english":
      return `Legal English ${recommendation.level}`;
    case "kids_english":
      return `Kids English — ${recommendation.level}`;
    default:
      return "Speakify";
  }
}

export function dashboardPathForProgramme(programme: GatewayProgramme): string {
  switch (programme) {
    case "ielts":
      return "/dashboard/ielts/student";
    case "ielts_general":
      return "/dashboard/ielts-general/student";
    case "toefl":
      return "/dashboard/ielts/student";
    case "step":
      return "/dashboard/step/student";
    case "pathway":
      return "/dashboard/pathway/student";
    case "business_english":
      return "/dashboard/business-english/student";
    case "legal_english":
      return "/dashboard/legal-english/student";
    case "kids_english":
      return "/dashboard/kids-english/student";
    default:
      return "/dashboard/ielts/student";
  }
}

export function programmeGoalLabel(programme: GatewayProgramme): string {
  switch (programme) {
    case "ielts":
      return "IELTS Academic";
    case "ielts_general":
      return "IELTS General";
    case "toefl":
      return "TOEFL";
    case "step":
      return "STEP";
    case "pathway":
      return "English Pathway";
    case "business_english":
      return "Business English";
    case "legal_english":
      return "Legal English";
    case "kids_english":
      return "Kids English";
    default:
      return "Speakify";
  }
}
