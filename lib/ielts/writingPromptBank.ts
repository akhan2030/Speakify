/**
 * Pre-validated Academic Writing prompt bank.
 * Expand incrementally — always spot-check before adding new entries.
 */

import type {
  BarChartData,
  LineChartData,
  MapData,
  PieChartData,
  ProcessData,
  TableData,
  Task1Question,
  Task1VisualType,
  Task2EssayType,
  Task2Question,
} from "./writingTaskData";

export type Task1Category = {
  id: Task1VisualType;
  label: string;
  description: string;
};

export type Task2Category = {
  id: Task2EssayType;
  label: string;
  description: string;
};

export const TASK1_CATEGORIES: Task1Category[] = [
  { id: "line", label: "Line Graph", description: "Trends over time" },
  { id: "bar", label: "Bar Chart", description: "Comparisons across categories" },
  { id: "pie", label: "Pie Chart", description: "Proportions of a whole" },
  { id: "table", label: "Table", description: "Multiple data sets side by side" },
  { id: "process", label: "Process Diagram", description: "Stages in a sequence" },
  { id: "map", label: "Map", description: "Changes to a place over time" },
];

export const TASK2_CATEGORIES: Task2Category[] = [
  { id: "Opinion", label: "Opinion Essay", description: "Agree / disagree with a statement" },
  { id: "Discussion", label: "Discussion", description: "Both views + your opinion" },
  { id: "Problem & Solution", label: "Problem-Solution", description: "Problems and how to fix them" },
  {
    id: "Advantages & Disadvantages",
    label: "Advantages / Disadvantages",
    description: "Weigh up pros and cons",
  },
  { id: "Two-Part Question", label: "Two-Part Question", description: "Two related questions to answer" },
];

export const TASK1_PROMPT_BANK: Task1Question[] = [
  // ── Bar Chart (5) ──────────────────────────────────────────────────────────
  {
    id: "housing-england-wales",
    visualType: "bar",
    title: "Household accommodation",
    summary: "Owned vs rented homes in England and Wales (1918–2011)",
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
    id: "saudi-internet-age",
    visualType: "bar",
    title: "Internet usage by age",
    summary: "Daily internet use among Saudi residents by age group (2020 vs 2024)",
    chartTitle: "Daily internet usage by age group in Saudi Arabia (%)",
    prompt:
      "The bar chart below shows the percentage of people in different age groups in Saudi Arabia who used the internet daily in 2020 and 2024.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    bar: {
      categories: ["16–24", "25–34", "35–44", "45–54", "55–64", "65+"],
      yAxisLabel: "Percentage (%)",
      series: [
        { name: "2020", color: "#0d9488", values: [96, 94, 88, 76, 58, 32] },
        { name: "2024", color: "#c9972c", values: [99, 97, 93, 84, 68, 45] },
      ],
    },
  },
  {
    id: "global-coffee-consumption",
    visualType: "bar",
    title: "Coffee consumption",
    summary: "Kilograms of coffee consumed per person in five countries (2023)",
    chartTitle: "Annual coffee consumption per capita (kg) — 2023",
    prompt:
      "The bar chart below shows the amount of coffee consumed per person in five countries in 2023.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    bar: {
      categories: ["Finland", "Norway", "Iceland", "Denmark", "Netherlands"],
      yAxisLabel: "Kilograms per person",
      series: [{ name: "Consumption", color: "#0d9488", values: [12.0, 9.9, 9.0, 8.7, 8.4] }],
    },
  },
  {
    id: "leisure-time-gender",
    visualType: "bar",
    title: "Leisure time by gender",
    summary: "Average weekly leisure hours for men and women (1990 vs 2020)",
    chartTitle: "Average hours per week spent on leisure activities",
    prompt:
      "The bar chart below shows the average number of hours per week that men and women spent on leisure activities in 1990 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    bar: {
      categories: ["Sport", "Reading", "TV & film", "Socialising", "Other"],
      yAxisLabel: "Hours per week",
      series: [
        { name: "Men 1990", color: "#0d9488", values: [4.2, 2.1, 12.5, 6.8, 3.4] },
        { name: "Women 1990", color: "#c9972c", values: [2.8, 3.6, 11.2, 7.5, 4.1] },
        { name: "Men 2020", color: "#0d1b35", values: [5.1, 1.8, 14.2, 5.9, 4.0] },
        { name: "Women 2020", color: "#7c3aed", values: [3.5, 2.9, 13.8, 6.2, 4.5] },
      ],
    },
  },
  {
    id: "electricity-sources",
    visualType: "bar",
    title: "Electricity generation",
    summary: "How electricity was produced in a country (2000 vs 2020)",
    chartTitle: "Sources of electricity generation (%) — 2000 and 2020",
    prompt:
      "The bar chart below shows the percentage of electricity generated from different sources in a country in 2000 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    bar: {
      categories: ["Coal", "Natural gas", "Nuclear", "Hydro", "Wind & solar"],
      yAxisLabel: "Percentage (%)",
      series: [
        { name: "2000", color: "#0d9488", values: [38, 28, 18, 10, 6] },
        { name: "2020", color: "#c9972c", values: [12, 32, 16, 8, 32] },
      ],
    },
  },

  // ── Line Graph (5) ─────────────────────────────────────────────────────────
  {
    id: "renewable-energy",
    visualType: "line",
    title: "Renewable energy",
    summary: "Renewable energy share in Germany, UK and USA (2000–2020)",
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
    id: "urban-population-growth",
    visualType: "line",
    title: "Urban population",
    summary: "Population growth in Dubai, Singapore and Toronto (1990–2030 projected)",
    chartTitle: "Urban population (millions) — 1990 to 2030",
    prompt:
      "The line graph below shows the population of three cities between 1990 and 2030 (figures after 2024 are projected).\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    line: {
      years: ["1990", "2000", "2010", "2020", "2030"],
      yAxisLabel: "Population (millions)",
      series: [
        { name: "Dubai", color: "#0d9488", values: [0.6, 1.1, 1.9, 3.4, 4.2] },
        { name: "Singapore", color: "#c9972c", values: [3.0, 4.0, 5.1, 5.7, 6.0] },
        { name: "Toronto", color: "#0d1b35", values: [2.1, 2.5, 2.8, 3.0, 3.3] },
      ],
    },
  },
  {
    id: "teen-screen-time",
    visualType: "line",
    title: "Teen screen time",
    summary: "Average daily screen time for 13–17 year-olds (2015–2024)",
    chartTitle: "Average daily screen time among teenagers (hours per day)",
    prompt:
      "The line graph below shows the average number of hours per day that teenagers aged 13–17 spent on screens in three countries between 2015 and 2024.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    line: {
      years: ["2015", "2017", "2019", "2021", "2024"],
      yAxisLabel: "Hours per day",
      series: [
        { name: "USA", color: "#0d9488", values: [4.5, 5.2, 6.1, 7.8, 7.2] },
        { name: "UK", color: "#c9972c", values: [4.0, 4.6, 5.4, 6.9, 6.5] },
        { name: "South Korea", color: "#0d1b35", values: [5.8, 6.2, 6.8, 7.5, 7.0] },
      ],
    },
  },
  {
    id: "life-expectancy",
    visualType: "line",
    title: "Life expectancy",
    summary: "Average life expectancy in Japan, Brazil and Egypt (1970–2020)",
    chartTitle: "Average life expectancy at birth (years)",
    prompt:
      "The line graph below shows the average life expectancy at birth in three countries between 1970 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    line: {
      years: ["1970", "1980", "1990", "2000", "2010", "2020"],
      yAxisLabel: "Years",
      series: [
        { name: "Japan", color: "#0d9488", values: [72, 76, 79, 81, 83, 85] },
        { name: "Brazil", color: "#c9972c", values: [59, 63, 67, 71, 74, 76] },
        { name: "Egypt", color: "#0d1b35", values: [52, 56, 60, 68, 71, 73] },
      ],
    },
  },
  {
    id: "food-waste-trend",
    visualType: "line",
    title: "Food waste",
    summary: "Household food waste per person in the UK (2005–2022)",
    chartTitle: "Household food waste (kg per person per year)",
    prompt:
      "The line graph below shows the amount of household food waste generated per person in the United Kingdom between 2005 and 2022.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    line: {
      years: ["2005", "2008", "2011", "2014", "2017", "2020", "2022"],
      yAxisLabel: "Kilograms per person",
      series: [
        { name: "Total waste", color: "#0d9488", values: [98, 102, 105, 100, 92, 76, 68] },
        { name: "Avoidable waste", color: "#c9972c", values: [72, 76, 78, 74, 66, 52, 45] },
      ],
    },
  },

  // ── Pie Chart (5) ──────────────────────────────────────────────────────────
  {
    id: "government-budget",
    visualType: "pie",
    title: "Government budget",
    summary: "National expenditure by sector in 2022",
    chartTitle: "National government expenditure by sector (2022)",
    prompt:
      "The pie chart below shows the distribution of a government's annual budget across five sectors in 2022.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
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
    id: "household-energy-sources",
    visualType: "pie",
    title: "Household energy",
    summary: "Sources of home energy in a European country (2023)",
    chartTitle: "Household energy sources (%) — 2023",
    prompt:
      "The pie chart below shows the main sources of energy used in households in a European country in 2023.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    pie: {
      segments: [
        { name: "Natural gas", value: 38, color: "#0d9488" },
        { name: "Electricity (grid)", value: 28, color: "#c9972c" },
        { name: "Renewables (solar/wind)", value: 22, color: "#0d1b35" },
        { name: "Oil", value: 8, color: "#7c3aed" },
        { name: "Other", value: 4, color: "#94a3b8" },
      ],
    },
  },
  {
    id: "university-degree-fields",
    visualType: "pie",
    title: "University graduates",
    summary: "Undergraduate degrees awarded by field of study (2023)",
    chartTitle: "University degrees awarded by subject area (%)",
    prompt:
      "The pie chart below shows the percentage of undergraduate degrees awarded in different subject areas at a national university system in 2023.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    pie: {
      segments: [
        { name: "Business & economics", value: 22, color: "#0d9488" },
        { name: "Engineering & technology", value: 20, color: "#c9972c" },
        { name: "Health sciences", value: 16, color: "#0d1b35" },
        { name: "Arts & humanities", value: 14, color: "#7c3aed" },
        { name: "Sciences", value: 18, color: "#64748b" },
        { name: "Other", value: 10, color: "#94a3b8" },
      ],
    },
  },
  {
    id: "household-expenditure",
    visualType: "pie",
    title: "Household spending",
    summary: "How an average family spent its income in 2023",
    chartTitle: "Average household expenditure by category (%)",
    prompt:
      "The pie chart below shows how an average household in a developed country spent its income across different categories in 2023.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    pie: {
      segments: [
        { name: "Housing", value: 32, color: "#0d9488" },
        { name: "Food & groceries", value: 18, color: "#c9972c" },
        { name: "Transport", value: 14, color: "#0d1b35" },
        { name: "Utilities", value: 10, color: "#7c3aed" },
        { name: "Leisure", value: 12, color: "#64748b" },
        { name: "Savings", value: 8, color: "#22c55e" },
        { name: "Other", value: 6, color: "#94a3b8" },
      ],
    },
  },
  {
    id: "employment-by-sector",
    visualType: "pie",
    title: "Employment sectors",
    summary: "Jobs by industry in a national economy (2022)",
    chartTitle: "Employment by economic sector (%)",
    prompt:
      "The pie chart below shows the percentage of workers employed in different sectors of the economy in a country in 2022.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    pie: {
      segments: [
        { name: "Services", value: 45, color: "#0d9488" },
        { name: "Manufacturing", value: 18, color: "#c9972c" },
        { name: "Retail & hospitality", value: 16, color: "#0d1b35" },
        { name: "Construction", value: 9, color: "#7c3aed" },
        { name: "Agriculture", value: 6, color: "#64748b" },
        { name: "Other", value: 6, color: "#94a3b8" },
      ],
    },
  },

  // ── Table (5) ──────────────────────────────────────────────────────────────
  {
    id: "international-students",
    visualType: "table",
    title: "International students",
    summary: "University applicants by country of origin (2018 vs 2023)",
    chartTitle: "International university applicants by country of origin (2018 vs 2023)",
    prompt:
      "The table below gives information about the number of international students applying to universities in Australia, Canada and the UK in 2018 and 2023.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    table: {
      headers: [
        "Country of origin",
        "Australia 2018",
        "Australia 2023",
        "Canada 2018",
        "Canada 2023",
        "UK 2018",
        "UK 2023",
      ],
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
    id: "museum-visitors",
    visualType: "table",
    title: "Museum visitors",
    summary: "Annual visitors to four national museums (2019–2023)",
    chartTitle: "Annual museum visitors (thousands)",
    prompt:
      "The table below shows the number of visitors (in thousands) to four national museums between 2019 and 2023.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    table: {
      headers: ["Museum", "2019", "2020", "2021", "2022", "2023"],
      rows: [
        ["National History Museum", "6,200", "1,400", "2,800", "5,100", "6,800"],
        ["Science & Industry Museum", "3,400", "620", "1,200", "2,900", "3,600"],
        ["Art Gallery", "2,100", "380", "890", "1,700", "2,300"],
        ["War Memorial", "1,800", "290", "640", "1,400", "1,950"],
      ],
    },
  },
  {
    id: "public-transport-commute",
    visualType: "table",
    title: "Commuting methods",
    summary: "How workers travelled to work in a city (2005, 2015, 2023)",
    chartTitle: "Modes of transport used for commuting (%)",
    prompt:
      "The table below shows the percentage of workers in a city who used different modes of transport to commute in 2005, 2015 and 2023.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    table: {
      headers: ["Transport mode", "2005", "2015", "2023"],
      rows: [
        ["Private car", "62", "58", "43"],
        ["Bus", "18", "16", "14"],
        ["Metro / underground", "12", "15", "22"],
        ["Bicycle", "4", "6", "11"],
        ["Walking", "3", "4", "5"],
        ["Working from home", "1", "1", "5"],
      ],
    },
  },
  {
    id: "airport-passengers",
    visualType: "table",
    title: "Airport passengers",
    summary: "Passenger numbers at three international airports (2018–2023)",
    chartTitle: "Annual passenger numbers (millions)",
    prompt:
      "The table below shows the number of passengers using three international airports between 2018 and 2023.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    table: {
      headers: ["Airport", "2018", "2019", "2020", "2021", "2022", "2023"],
      rows: [
        ["Heathrow (London)", "80.1", "80.9", "22.1", "19.4", "61.6", "79.2"],
        ["Dubai International", "89.1", "86.4", "25.9", "29.1", "66.1", "86.9"],
        ["Changi (Singapore)", "65.6", "68.3", "11.8", "3.1", "32.2", "58.9"],
      ],
    },
  },
  {
    id: "library-membership",
    visualType: "table",
    title: "Library membership",
    summary: "Public library members by age group in a city (2010 vs 2022)",
    chartTitle: "Public library membership by age group",
    prompt:
      "The table below shows the number of people in different age groups who were members of public libraries in a city in 2010 and 2022.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    table: {
      headers: ["Age group", "2010", "2015", "2022"],
      rows: [
        ["Under 15", "12,400", "10,800", "9,200"],
        ["15–24", "18,600", "16,200", "14,500"],
        ["25–44", "22,100", "20,400", "19,800"],
        ["45–64", "15,300", "14,600", "15,100"],
        ["65 and over", "8,900", "10,200", "12,600"],
        ["Total", "77,300", "72,200", "71,200"],
      ],
    },
  },

  // ── Process Diagram (5) ────────────────────────────────────────────────────
  {
    id: "water-treatment",
    visualType: "process",
    title: "Water purification",
    summary: "How town water is treated and delivered to homes",
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
  {
    id: "plastic-recycling",
    visualType: "process",
    title: "Plastic recycling",
    summary: "Stages in recycling plastic bottles into new products",
    chartTitle: "The plastic bottle recycling process",
    prompt:
      "The diagram below shows the process of recycling plastic bottles.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    process: {
      steps: [
        { label: "Collection", detail: "Bottles gathered from homes and recycling bins" },
        { label: "Sorting", detail: "Separated by plastic type and colour" },
        { label: "Cleaning", detail: "Labels removed and bottles washed" },
        { label: "Shredding", detail: "Bottles cut into small flakes" },
        { label: "Melting", detail: "Flakes heated and formed into pellets" },
        { label: "Manufacturing", detail: "Pellets used to make new plastic products" },
      ],
    },
  },
  {
    id: "olive-oil-production",
    visualType: "process",
    title: "Olive oil production",
    summary: "From harvested olives to bottled olive oil",
    chartTitle: "How olive oil is produced",
    prompt:
      "The diagram below shows how olive oil is produced from olives.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    process: {
      steps: [
        { label: "Harvesting", detail: "Olives picked from trees" },
        { label: "Washing", detail: "Olives cleaned to remove dirt and leaves" },
        { label: "Crushing", detail: "Olives ground into a paste" },
        { label: "Pressing", detail: "Oil extracted from the paste" },
        { label: "Separation", detail: "Oil separated from water and solids" },
        { label: "Filtering", detail: "Impurities removed" },
        { label: "Bottling", detail: "Oil packaged for sale" },
      ],
    },
  },
  {
    id: "cement-production",
    visualType: "process",
    title: "Cement production",
    summary: "How cement is manufactured from raw materials",
    chartTitle: "The cement manufacturing process",
    prompt:
      "The diagram below shows how cement is produced.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    process: {
      steps: [
        { label: "Limestone & clay", detail: "Raw materials extracted from quarry" },
        { label: "Crusher", detail: "Materials ground into powder" },
        { label: "Mixer", detail: "Powders combined in correct proportions" },
        { label: "Rotating kiln", detail: "Heated to 1,450°C to form clinker" },
        { label: "Cooler", detail: "Clinker cooled rapidly" },
        { label: "Grinder", detail: "Clinker ground with gypsum into cement" },
        { label: "Packaging", detail: "Cement bagged for distribution" },
      ],
    },
  },
  {
    id: "salmon-life-cycle",
    visualType: "process",
    title: "Salmon life cycle",
    summary: "Stages in the life cycle of the Atlantic salmon",
    chartTitle: "The life cycle of the Atlantic salmon",
    prompt:
      "The diagram below shows the life cycle of the Atlantic salmon.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    process: {
      steps: [
        { label: "Eggs", detail: "Laid in freshwater river beds" },
        { label: "Alevin", detail: "Hatch and remain in gravel" },
        { label: "Fry", detail: "Young fish emerge and feed in river" },
        { label: "Smolt", detail: "Adapt to salt water and migrate downstream" },
        { label: "Adult ocean phase", detail: "Live and grow in the sea for 1–3 years" },
        { label: "Spawning migration", detail: "Return upstream to birthplace" },
        { label: "Spawning", detail: "Adults reproduce and cycle restarts" },
      ],
    },
  },

  // ── Map (5) ────────────────────────────────────────────────────────────────
  {
    id: "town-development",
    visualType: "map",
    title: "Town centre development",
    summary: "Changes to Garlsdon town centre (1995 vs present)",
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
    id: "island-resort-development",
    visualType: "map",
    title: "Island resort",
    summary: "Coastal resort development on an island (before vs after)",
    chartTitle: "Development of a coastal resort island",
    prompt:
      "The maps below show an island before and after the development of a coastal resort.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    map: {
      beforeLabel: "Before development",
      afterLabel: "After development",
      beforeYear: "Before",
      afterYear: "After",
    },
  },
  {
    id: "university-campus-expansion",
    visualType: "map",
    title: "Campus expansion",
    summary: "University campus layout in 2000 vs 2024",
    chartTitle: "University campus development (2000 vs 2024)",
    prompt:
      "The maps below show a university campus in 2000 and 2024.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    map: {
      beforeLabel: "2000",
      afterLabel: "2024",
      beforeYear: "2000",
      afterYear: "2024",
    },
  },
  {
    id: "hospital-zone-development",
    visualType: "map",
    title: "Hospital area",
    summary: "Changes around a city hospital (2005 vs 2020)",
    chartTitle: "Development of the area around City Hospital",
    prompt:
      "The maps below show the area around a city hospital in 2005 and 2020.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    map: {
      beforeLabel: "2005",
      afterLabel: "2020",
      beforeYear: "2005",
      afterYear: "2020",
    },
  },
  {
    id: "waterfront-redevelopment",
    visualType: "map",
    title: "Waterfront redevelopment",
    summary: "Industrial waterfront transformed into mixed-use area",
    chartTitle: "Redevelopment of the riverside industrial zone",
    prompt:
      "The maps below show an industrial area beside a river before and after redevelopment.\n\nSummarise the information by selecting and reporting the main features, and make comparisons where relevant.",
    map: {
      beforeLabel: "Before redevelopment",
      afterLabel: "After redevelopment",
      beforeYear: "Before",
      afterYear: "After",
    },
  },
];

export const TASK2_PROMPT_BANK: Task2Question[] = [
  // ── Opinion (5) ────────────────────────────────────────────────────────────
  {
    id: "free-university",
    label: "Opinion Essay",
    essayType: "Opinion",
    title: "Free university education",
    summary: "Should university be free for all students?",
    prompt:
      "Some people believe that university education should be free for all students. To what extent do you agree or disagree? Give your own opinion and support it with examples.",
  },
  {
    id: "international-travel",
    label: "Opinion Essay",
    essayType: "Opinion",
    title: "International travel",
    summary: "Has cheap travel been beneficial to society?",
    prompt:
      "International travel has become much cheaper and more accessible in recent years. This has been largely beneficial to both individuals and society. To what extent do you agree or disagree?",
  },
  {
    id: "government-arts-funding",
    label: "Opinion Essay",
    essayType: "Opinion",
    title: "Arts funding",
    summary: "Should governments fund the arts?",
    prompt:
      "Some people think that governments should spend money on the arts (music, theatre, museums). Others believe this money should be spent on more important services such as healthcare and education. To what extent do you agree or disagree?",
  },
  {
    id: "retirement-age",
    label: "Opinion Essay",
    essayType: "Opinion",
    title: "Retirement age",
    summary: "Should the state pension age be raised?",
    prompt:
      "As people live longer, some governments are raising the age at which citizens can receive a state pension. To what extent do you agree or disagree that the retirement age should be increased?",
  },
  {
    id: "ban-zoos",
    label: "Opinion Essay",
    essayType: "Opinion",
    title: "Zoos",
    summary: "Should zoos be closed?",
    prompt:
      "Some people believe that zoos are cruel and should be closed. Others argue that zoos play an important role in education and conservation. To what extent do you agree or disagree that zoos should be banned?",
  },

  // ── Discussion (5) ─────────────────────────────────────────────────────────
  {
    id: "public-transport-roads",
    label: "Discussion Essay",
    essayType: "Discussion",
    title: "Transport vs roads",
    summary: "Public transport spending vs building more roads",
    prompt:
      "Some people think that governments should spend money on public transport to reduce traffic, while others believe that building more roads is the better solution. Discuss both views and give your own opinion.",
  },
  {
    id: "technology-in-education",
    label: "Discussion Essay",
    essayType: "Discussion",
    title: "Technology in schools",
    summary: "Tablets and laptops vs traditional textbooks",
    prompt:
      "Some people believe that schools should replace textbooks with tablets and laptops. Others argue that traditional books are more effective for learning. Discuss both views and give your own opinion.",
  },
  {
    id: "urban-vs-rural",
    label: "Discussion Essay",
    essayType: "Discussion",
    title: "Urban vs rural life",
    summary: "Is city life better than living in the countryside?",
    prompt:
      "Some people prefer to live in cities, while others would rather live in rural areas. Discuss both views and give your own opinion.",
  },
  {
    id: "nuclear-vs-renewable",
    label: "Discussion Essay",
    essayType: "Discussion",
    title: "Nuclear vs renewable",
    summary: "Nuclear power vs solar and wind energy",
    prompt:
      "Some people believe that nuclear power is the best way to meet growing energy demand. Others think governments should invest only in renewable energy such as solar and wind. Discuss both views and give your own opinion.",
  },
  {
    id: "competitive-sports-school",
    label: "Discussion Essay",
    essayType: "Discussion",
    title: "Competitive sport",
    summary: "Should competitive sports be compulsory at school?",
    prompt:
      "Some people think that competitive sports should be a compulsory part of the school curriculum. Others believe that sport should be optional and that academic subjects are more important. Discuss both views and give your own opinion.",
  },

  // ── Problem & Solution (5) ─────────────────────────────────────────────────
  {
    id: "air-pollution-traffic",
    label: "Problem & Solution",
    essayType: "Problem & Solution",
    title: "Air pollution",
    summary: "Traffic-related air pollution in cities",
    prompt:
      "Many cities around the world are facing serious problems with air pollution caused by traffic. What are the main problems caused by air pollution and what measures can governments and individuals take to address them?",
  },
  {
    id: "youth-unemployment",
    label: "Problem & Solution",
    essayType: "Problem & Solution",
    title: "Youth unemployment",
    summary: "Young people struggling to find work",
    prompt:
      "In many countries, young people are finding it increasingly difficult to get their first job after leaving education. What problems does this cause for young people and society? What measures could be taken to help them find employment?",
  },
  {
    id: "plastic-ocean-waste",
    label: "Problem & Solution",
    essayType: "Problem & Solution",
    title: "Ocean plastic",
    summary: "Plastic waste polluting the world's oceans",
    prompt:
      "Plastic waste in the oceans is a growing environmental problem. What are the causes of this problem? What solutions can individuals, businesses and governments implement to reduce ocean plastic pollution?",
  },
  {
    id: "water-shortage-cities",
    label: "Problem & Solution",
    essayType: "Problem & Solution",
    title: "Water shortages",
    summary: "Cities running out of fresh water",
    prompt:
      "Many cities around the world are experiencing serious water shortages. What are the causes of this problem? What measures can governments and individuals take to address it?",
  },
  {
    id: "antisocial-behaviour",
    label: "Problem & Solution",
    essayType: "Problem & Solution",
    title: "Antisocial behaviour",
    summary: "Rising antisocial behaviour in communities",
    prompt:
      "In some areas, antisocial behaviour such as vandalism and noise disturbance is increasing. What problems does this cause for local communities? What solutions can help reduce antisocial behaviour?",
  },

  // ── Advantages & Disadvantages (5) ─────────────────────────────────────────
  {
    id: "work-from-home",
    label: "Advantages & Disadvantages",
    essayType: "Advantages & Disadvantages",
    title: "Working from home",
    summary: "Permanent remote work for employees",
    prompt:
      "Some companies now offer their employees the option to work from home permanently. Do the advantages of this outweigh the disadvantages?",
  },
  {
    id: "living-big-city",
    label: "Advantages & Disadvantages",
    essayType: "Advantages & Disadvantages",
    title: "Life in a big city",
    summary: "Pros and cons of urban living",
    prompt:
      "More and more people are choosing to live in large cities. Do the advantages of living in a big city outweigh the disadvantages?",
  },
  {
    id: "studying-abroad",
    label: "Advantages & Disadvantages",
    essayType: "Advantages & Disadvantages",
    title: "Studying abroad",
    summary: "University students studying in another country",
    prompt:
      "An increasing number of students are choosing to study at universities in other countries. Do the advantages of studying abroad outweigh the disadvantages?",
  },
  {
    id: "gap-year",
    label: "Advantages & Disadvantages",
    essayType: "Advantages & Disadvantages",
    title: "Gap year",
    summary: "Taking a year off before starting university",
    prompt:
      "Some students take a gap year to travel or work before starting university. Do the advantages of taking a gap year outweigh the disadvantages?",
  },
  {
    id: "online-shopping",
    label: "Advantages & Disadvantages",
    essayType: "Advantages & Disadvantages",
    title: "Online shopping",
    summary: "Growth of online retail vs high-street shops",
    prompt:
      "Online shopping has become increasingly popular and many traditional shops have closed. Do the advantages of online shopping outweigh the disadvantages for consumers and society?",
  },

  // ── Two-Part Question (5) ──────────────────────────────────────────────────
  {
    id: "childhood-obesity",
    label: "Two-Part Question",
    essayType: "Two-Part Question",
    title: "Childhood obesity",
    summary: "Causes and effects of rising childhood obesity",
    prompt:
      "In many countries, the number of children who are overweight or obese is increasing. What are the causes of this problem? What effects does it have on children and society?",
  },
  {
    id: "globalisation-effects",
    label: "Two-Part Question",
    essayType: "Two-Part Question",
    title: "Globalisation",
    summary: "How globalisation affects culture and local businesses",
    prompt:
      "Globalisation has affected many aspects of life around the world. In what ways has globalisation influenced local cultures? How has it affected small local businesses?",
  },
  {
    id: "role-of-museums",
    label: "Two-Part Question",
    essayType: "Two-Part Question",
    title: "Museums today",
    summary: "Purpose of museums and how to attract visitors",
    prompt:
      "Museums are popular tourist attractions in many countries. Why are museums important to society? What can be done to encourage more people, especially young people, to visit museums?",
  },
  {
    id: "declining-reading",
    label: "Two-Part Question",
    essayType: "Two-Part Question",
    title: "Declining reading",
    summary: "Fewer people reading books for pleasure",
    prompt:
      "Fewer people today read books for pleasure compared with previous generations. Why is this happening? What could be done to encourage more people to read?",
  },
  {
    id: "fast-food-popularity",
    label: "Two-Part Question",
    essayType: "Two-Part Question",
    title: "Fast food",
    summary: "Why fast food is popular and how to promote healthier eating",
    prompt:
      "Fast food restaurants are becoming more popular in many countries. Why is this trend occurring? How can governments encourage people to eat more healthily?",
  },
];

export function getTask1PromptsByCategory(visualType: Task1VisualType): Task1Question[] {
  return TASK1_PROMPT_BANK.filter((q) => q.visualType === visualType);
}

export function getTask2PromptsByCategory(essayType: Task2EssayType): Task2Question[] {
  return TASK2_PROMPT_BANK.filter((q) => q.essayType === essayType);
}

export function getTask1PromptById(id: string): Task1Question | undefined {
  return TASK1_PROMPT_BANK.find((q) => q.id === id);
}

export function getTask2PromptById(id: string): Task2Question | undefined {
  return TASK2_PROMPT_BANK.find((q) => q.id === id);
}
