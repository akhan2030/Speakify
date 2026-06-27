export type GuidedStepId =
  | "introduction"
  | "overview"
  | "body1"
  | "body2"
  | "conclusion";

export type GuidedStep = {
  id: GuidedStepId;
  label: string;
  shortLabel: string;
  description: string;
  wordTargetMin: number;
  wordTargetMax: number;
  /** IELTS criteria to score for this paragraph */
  focusCriteria: ("TA" | "CC" | "LR" | "GRA")[];
  placeholder: string;
};

export const TASK1_GUIDED_STEPS: GuidedStep[] = [
  {
    id: "introduction",
    label: "Introduction",
    shortLabel: "Intro",
    description:
      "Paraphrase the task statement. Say what the visual shows — do not include data or an overview yet.",
    wordTargetMin: 20,
    wordTargetMax: 45,
    focusCriteria: ["TA", "CC"],
    placeholder:
      "The chart illustrates… / The graph compares… (paraphrase the question without copying it)",
  },
  {
    id: "overview",
    label: "Overview",
    shortLabel: "Overview",
    description:
      "Write 1–2 sentences summarising the main trends or most noticeable features. No specific figures yet.",
    wordTargetMin: 25,
    wordTargetMax: 50,
    focusCriteria: ["TA", "CC"],
    placeholder:
      "Overall, … / In general, … (main trends, highest/lowest, overall patterns)",
  },
  {
    id: "body1",
    label: "Body 1",
    shortLabel: "Body 1",
    description:
      "Describe the first group of key data with comparisons. Use accurate figures and linking words.",
    wordTargetMin: 45,
    wordTargetMax: 80,
    focusCriteria: ["TA", "LR", "GRA"],
    placeholder:
      "Start with the largest category / first time period… Include specific data and comparisons.",
  },
  {
    id: "body2",
    label: "Body 2",
    shortLabel: "Body 2",
    description:
      "Cover the remaining important data or a second trend. Avoid repeating Body 1 — add new detail.",
    wordTargetMin: 45,
    wordTargetMax: 80,
    focusCriteria: ["TA", "LR", "GRA"],
    placeholder:
      "Turning to… / Similarly / By contrast… (remaining key figures and comparisons)",
  },
];

export const TASK2_GUIDED_STEPS: GuidedStep[] = [
  {
    id: "introduction",
    label: "Introduction",
    shortLabel: "Intro",
    description:
      "Paraphrase the question and state your clear position or thesis in the final sentence.",
    wordTargetMin: 35,
    wordTargetMax: 60,
    focusCriteria: ["TA", "CC"],
    placeholder:
      "It is often argued that… / In recent years… + clear thesis: I believe… / This essay agrees that…",
  },
  {
    id: "body1",
    label: "Body 1",
    shortLabel: "Body 1",
    description:
      "First main idea with a topic sentence, explanation, and example. Stay focused on one reason.",
    wordTargetMin: 70,
    wordTargetMax: 110,
    focusCriteria: ["TA", "CC", "LR", "GRA"],
    placeholder:
      "One reason for this is… / Firstly… (topic sentence → explain → example)",
  },
  {
    id: "body2",
    label: "Body 2",
    shortLabel: "Body 2",
    description:
      "Second main idea with the same structure. Use cohesive links back to your thesis.",
    wordTargetMin: 70,
    wordTargetMax: 110,
    focusCriteria: ["TA", "CC", "LR", "GRA"],
    placeholder:
      "Furthermore… / Another key factor… (second main point with support)",
  },
  {
    id: "conclusion",
    label: "Conclusion",
    shortLabel: "Conclusion",
    description:
      "Summarise your main points and restate your position. Do not introduce new ideas.",
    wordTargetMin: 25,
    wordTargetMax: 50,
    focusCriteria: ["TA", "CC"],
    placeholder:
      "In conclusion… / To sum up… (restate thesis + brief summary of body points)",
  },
];

export function getGuidedSteps(taskType: "task1" | "task2"): GuidedStep[] {
  return taskType === "task1" ? TASK1_GUIDED_STEPS : TASK2_GUIDED_STEPS;
}
