export type GeneralReadingSectionId = "a" | "b" | "c";

export type GeneralReadingQuestionDrill = {
  slug: string;
  label: string;
  minutes: number;
};

export type GeneralReadingSection = {
  id: GeneralReadingSectionId;
  label: string;
  title: string;
  description: string;
  textTypes: string[];
  color: string;
  questionTypes: GeneralReadingQuestionDrill[];
};

export const GENERAL_READING_SECTIONS: GeneralReadingSection[] = [
  {
    id: "a",
    label: "Section A",
    title: "Social & everyday survival",
    description:
      "Short texts — notices, advertisements, timetables, and community information. You match headings, complete sentences, or answer short questions.",
    textTypes: ["Notices", "Ads", "Timetables", "Community boards"],
    color: "#c9972c",
    questionTypes: [
      { slug: "matching-headings", label: "Matching headings", minutes: 12 },
      { slug: "sentence-completion", label: "Sentence completion", minutes: 10 },
      { slug: "short-answer", label: "Short answer", minutes: 10 },
    ],
  },
  {
    id: "b",
    label: "Section B",
    title: "Workplace & training",
    description:
      "Medium-length workplace texts — job descriptions, staff manuals, training guides, and workplace policies.",
    textTypes: ["Job ads", "Manuals", "Policies", "Training guides"],
    color: "#0d9488",
    questionTypes: [
      { slug: "true-false-not-given", label: "True / False / Not Given", minutes: 12 },
      { slug: "sentence-completion", label: "Sentence completion", minutes: 12 },
      { slug: "matching-headings", label: "Matching information", minutes: 15 },
    ],
  },
  {
    id: "c",
    label: "Section C",
    title: "Extended general passage",
    description:
      "One longer passage on a topic of general interest — similar to a magazine or newspaper article. Timed practice builds exam stamina.",
    textTypes: ["Magazine articles", "General interest", "Opinion pieces"],
    color: "#7c3aed",
    questionTypes: [
      { slug: "multiple-choice", label: "Multiple choice", minutes: 15 },
      { slug: "summary-completion", label: "Summary completion", minutes: 15 },
      { slug: "true-false-not-given", label: "True / False / Not Given", minutes: 12 },
    ],
  },
];

export const GENERAL_READING_STRATEGIES = [
  {
    title: "Section A — scan for keywords",
    text: "Read the questions first, then scan short texts for names, dates, and numbers. GT Section A rewards speed.",
  },
  {
    title: "Section B — follow the layout",
    text: "Workplace texts use headings and bullet points. Match question order to text structure where possible.",
  },
  {
    title: "Section C — manage your time",
    text: "Allow ~20 minutes for the long passage. Skim first, then locate answers — don't read every word.",
  },
  {
    title: "Spelling counts",
    text: "Copy words exactly from the passage for gap-fill answers. Wrong spelling = wrong answer.",
  },
];
