/**
 * Speakify brand tokens — single source for marketing hub + LMS.
 * Values extracted from the live /courses hub computed stylesheet
 * (navy header, gold CTA, Fraunces headlines, Inter body).
 */
export const SPEAKIFY_COLOR = {
  navy900: "#0b1b33",
  navy700: "#16294a",
  gold: "#c99a3d",
  goldDeep: "#a97f2e",
  paper: "#f7f5f0",
  card: "#ffffff",
  ink: "#1b2430",
  inkSoft: "#5b6472",
  line: "#e3dfd4",
  lineDark: "#2a3b5c",
  teal: "#0f6e62",
} as const;

export const SPEAKIFY_FONT = {
  headline: "Fraunces",
  body: "Inter",
} as const;

export const SPEAKIFY_RADIUS = {
  button: "6px",
  card: "10px",
  panel: "20px",
} as const;

export const SPEAKIFY_SHADOW = {
  button: "none",
} as const;
