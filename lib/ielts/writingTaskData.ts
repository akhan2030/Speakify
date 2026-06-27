export type Task1VisualType = "bar" | "line" | "pie" | "table" | "map" | "process";

export type Task2EssayType =
  | "Opinion"
  | "Discussion"
  | "Agree / Disagree"
  | "Cause & Effect"
  | "Problem & Solution"
  | "Advantages & Disadvantages";

export type BarChartData = {
  categories: string[];
  series: { name: string; color: string; values: number[] }[];
  yAxisLabel?: string;
};

export type LineChartData = {
  years: string[];
  series: { name: string; color: string; values: number[] }[];
  yAxisLabel?: string;
};

export type PieChartData = {
  segments: { name: string; value: number; color: string }[];
};

export type TableData = {
  headers: string[];
  rows: string[][];
};

export type MapData = {
  beforeLabel: string;
  afterLabel: string;
  beforeYear: string;
  afterYear: string;
};

export type ProcessData = {
  steps: { label: string; detail?: string }[];
};

export type Task1Question = {
  id: string;
  visualType: Task1VisualType;
  prompt: string;
  chartTitle: string;
  bar?: BarChartData;
  line?: LineChartData;
  pie?: PieChartData;
  table?: TableData;
  map?: MapData;
  process?: ProcessData;
};

export type Task2Question = {
  id: string;
  label: string;
  essayType: Task2EssayType;
  prompt: string;
};

export const TASK1_QUESTIONS: Task1Question[] = [
  {
    id: "housing-england-wales",
    visualType: "bar",
    chartTitle: "Household accommodation in England and Wales (1918–2011)",
    prompt:
      "The chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    bar: {
      categories: ["1918", "1951", "1961", "1971", "1981", "1991", "2001", "2011"],
      yAxisLabel: "Percentage of households",
      series: [
        { name: "Owned", color: "#0d9488", values: [23, 32, 38, 49, 58, 63, 69, 64] },
        { name: "Rented", color: "#c9972c", values: [77, 68, 62, 51, 42, 37, 31, 36] },
      ],
    },
  },
  {
    id: "renewable-energy",
    visualType: "line",
    chartTitle: "Renewable energy consumption (% of total energy use)",
    prompt:
      "The line graph below shows the percentage of energy consumed from renewable sources in three countries between 2000 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    line: {
      years: ["2000", "2005", "2010", "2015", "2020"],
      yAxisLabel: "Percentage (%)",
      series: [
        { name: "Germany", color: "#0d9488", values: [6, 9, 17, 30, 46] },
        { name: "United Kingdom", color: "#c9972c", values: [3, 4, 7, 15, 42] },
        { name: "United States", color: "#0d1b35", values: [6, 6, 8, 10, 12] },
      ],
    },
  },
  {
    id: "government-budget",
    visualType: "pie",
    chartTitle: "National government expenditure by sector (2022)",
    prompt:
      "The pie charts below show the distribution of a government's annual budget across five sectors in 2010 and 2022.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    pie: {
      segments: [
        { name: "Education", value: 24, color: "#0d9488" },
        { name: "Healthcare", value: 28, color: "#c9972c" },
        { name: "Defence", value: 12, color: "#0d1b35" },
        { name: "Infrastructure", value: 18, color: "#7c3aed" },
        { name: "Other", value: 18, color: "#94a3b8" },
      ],
    },
  },
  {
    id: "international-students",
    visualType: "table",
    chartTitle: "International university applicants by country of origin (2018 vs 2023)",
    prompt:
      "The table below gives information about the number of international students applying to universities in Australia, Canada and the UK in 2018 and 2023.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    table: {
      headers: ["Country of origin", "Australia 2018", "Australia 2023", "Canada 2018", "Canada 2023", "UK 2018", "UK 2023"],
      rows: [
        ["China", "42,500", "58,200", "28,400", "39,100", "106,500", "114,800"],
        ["India", "68,300", "95,600", "52,100", "80,400", "19,800", "42,300"],
        ["Nigeria", "8,200", "14,500", "6,800", "11,200", "12,400", "18,900"],
        ["Brazil", "5,600", "7,900", "4,200", "5,800", "3,100", "4,600"],
        ["Total", "124,600", "176,200", "91,500", "136,500", "141,800", "180,600"],
      ],
    },
  },
  {
    id: "town-development",
    visualType: "map",
    chartTitle: "Development of the town of Garlsdon (1995 vs present)",
    prompt:
      "The maps below show the centre of a small town called Garlsdon in 1995 and the present day.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    map: {
      beforeLabel: "1995",
      afterLabel: "Present day",
      beforeYear: "1995",
      afterYear: "Present",
    },
  },
  {
    id: "water-treatment",
    visualType: "process",
    chartTitle: "How town water is purified for domestic use",
    prompt:
      "The diagram below shows how water is treated and delivered to homes in a typical town.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    process: {
      steps: [
        { label: "Reservoir", detail: "Raw water collected from a natural source" },
        { label: "Screening", detail: "Large debris removed" },
        { label: "Coagulation", detail: "Chemicals added to bind small particles" },
        { label: "Sedimentation", detail: "Particles settle to the bottom" },
        { label: "Filtration", detail: "Water passed through sand and gravel" },
        { label: "Chlorination", detail: "Disinfectant added" },
        { label: "Storage tank", detail: "Treated water held before distribution" },
        { label: "Homes", detail: "Delivered through underground pipes" },
      ],
    },
  },
];

export const TASK2_QUESTIONS: Task2Question[] = [
  {
    id: "free-university",
    label: "Opinion Essay",
    essayType: "Opinion",
    prompt:
      "Some people believe that university education should be free for all students. To what extent do you agree or disagree? Give your own opinion and support it with examples.",
  },
  {
    id: "public-transport-roads",
    label: "Discussion Essay",
    essayType: "Discussion",
    prompt:
      "Some people think that governments should spend money on public transport to reduce traffic, while others believe that building more roads is the better solution. Discuss both views and give your own opinion.",
  },
  {
    id: "international-travel",
    label: "Agree / Disagree",
    essayType: "Agree / Disagree",
    prompt:
      "International travel has become much cheaper and more accessible in recent years. This has been largely beneficial to both individuals and society. To what extent do you agree or disagree?",
  },
  {
    id: "childhood-obesity",
    label: "Cause & Effect",
    essayType: "Cause & Effect",
    prompt:
      "In many countries, the number of children who are overweight or obese is increasing. What are the causes of this problem? What effects does it have on children and society?",
  },
  {
    id: "air-pollution-traffic",
    label: "Problem & Solution",
    essayType: "Problem & Solution",
    prompt:
      "Many cities around the world are facing serious problems with air pollution caused by traffic. What are the main problems caused by air pollution and what measures can governments and individuals take to address them?",
  },
  {
    id: "work-from-home",
    label: "Advantages & Disadvantages",
    essayType: "Advantages & Disadvantages",
    prompt:
      "Some companies now offer their employees the option to work from home permanently. Do the advantages of this outweigh the disadvantages?",
  },
];

const TASK1_SESSION_KEY = "ielts-writing-task1-question";
const TASK2_SESSION_KEY = "ielts-writing-task2-question";

function pickSessionIndex(poolLength: number, storageKey: string): number {
  if (typeof window === "undefined" || poolLength === 0) return 0;

  const stored = sessionStorage.getItem(storageKey);
  if (stored !== null) {
    const parsed = Number(stored);
    if (Number.isFinite(parsed)) return parsed % poolLength;
  }

  const index = Math.floor(Math.random() * poolLength);
  sessionStorage.setItem(storageKey, String(index));
  return index;
}

export function getSessionTask1Question(): Task1Question {
  return TASK1_QUESTIONS[pickSessionIndex(TASK1_QUESTIONS.length, TASK1_SESSION_KEY)];
}

export function getSessionTask2Question(): Task2Question {
  return TASK2_QUESTIONS[pickSessionIndex(TASK2_QUESTIONS.length, TASK2_SESSION_KEY)];
}

export function setTask1QuestionIndex(index: number): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(TASK1_SESSION_KEY, String(index % TASK1_QUESTIONS.length));
  }
}

export function setTask2QuestionIndex(index: number): void {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(TASK2_SESSION_KEY, String(index % TASK2_QUESTIONS.length));
  }
}
