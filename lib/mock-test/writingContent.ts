export const WRITING_TASK1 = {
  id: "write-task1",
  title: "Task 1",
  prompt: `The bar chart below shows the percentage of households with internet access in five Saudi cities in 2020 and 2023.

Riyadh: 78% → 91%
Jeddah: 71% → 88%
Dammam: 65% → 85%
Mecca: 60% → 82%
Medina: 58% → 79%

Write a report of at least 150 words describing the main features and making comparisons.`,
  minWords: 150,
  chartData: {
    title: "Internet access (% of households)",
    countries: ["Riyadh", "Jeddah", "Dammam", "Mecca", "Medina"],
    years: [2020, 2023],
    values: [
      [78, 91],
      [71, 88],
      [65, 85],
      [60, 82],
      [58, 79],
    ],
  },
};

export const WRITING_TASK2 = {
  id: "write-task2",
  title: "Task 2",
  prompt: `Some people believe that technology has made human communication less meaningful. Others disagree.

Discuss both views and give your own opinion.

Write at least 250 words.`,
  minWords: 250,
};
