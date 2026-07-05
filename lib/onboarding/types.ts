export type GatewayProgramme =
  | "ielts"
  | "ielts_general"
  | "toefl"
  | "step"
  | "pathway"
  | "business_english"
  | "legal_english"
  | "kids_english";

export type IeltsGatewayRecommendation = {
  kind: "ielts";
  track: "foundation" | "plus" | "elite";
  trackLabel: string;
  target: string;
  weeks: number;
};

export type IeltsGeneralGatewayRecommendation = {
  kind: "ielts_general";
  track: "foundation" | "plus" | "elite";
  trackLabel: string;
  target: string;
  weeks: number;
};

export type ToeflGatewayRecommendation = {
  kind: "toefl";
  targetScore: string;
  levelLabel: string;
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

export type LegalGatewayRecommendation = {
  kind: "legal_english";
  level: string;
  levelLabel: string;
};

export type KidsGatewayRecommendation = {
  kind: "kids_english";
  level: string;
  levelLabel: string;
  ageBand: string;
};

export type GatewayRecommendation =
  | IeltsGatewayRecommendation
  | IeltsGeneralGatewayRecommendation
  | ToeflGatewayRecommendation
  | StepGatewayRecommendation
  | PathwayGatewayRecommendation
  | BusinessGatewayRecommendation
  | LegalGatewayRecommendation
  | KidsGatewayRecommendation;
