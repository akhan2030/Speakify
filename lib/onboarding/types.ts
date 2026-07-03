export type GatewayProgramme = "ielts" | "pathway" | "step" | "business_english";

export type IeltsGatewayRecommendation = {
  kind: "ielts";
  track: "foundation" | "plus" | "elite";
  trackLabel: string;
  target: string;
  weeks: number;
};

export type StepGatewayRecommendation = {
  kind: "step";
  phase: number;
  score: string;
};

export type PathwayGatewayRecommendation = {
  kind: "pathway";
  level: string;
  levelLabel: string;
};

export type BusinessGatewayRecommendation = {
  kind: "business_english";
  level: string;
  levelLabel: string;
};

export type GatewayRecommendation =
  | IeltsGatewayRecommendation
  | StepGatewayRecommendation
  | PathwayGatewayRecommendation
  | BusinessGatewayRecommendation;
