/**
 * Validates the pre-generated writing prompt bank before ship.
 * Run: npm run validate:writing-prompts
 */

import {
  TASK1_PROMPT_BANK,
  TASK2_PROMPT_BANK,
  TASK1_CATEGORIES,
  TASK2_CATEGORIES,
} from "../lib/ielts/writingPromptBank.ts";

type Issue = { id: string; message: string };

const issues: Issue[] = [];

function add(id: string, message: string) {
  issues.push({ id, message });
}

function validateTask1() {
  const ids = new Set<string>();

  for (const q of TASK1_PROMPT_BANK) {
    if (ids.has(q.id)) add(q.id, "Duplicate prompt id");
    ids.add(q.id);

    if (!q.title?.trim()) add(q.id, "Missing title");
    if (!q.summary?.trim()) add(q.id, "Missing summary");
    if (!q.prompt?.trim()) add(q.id, "Missing prompt");
    if (!q.chartTitle?.trim()) add(q.id, "Missing chartTitle");

    const promptLower = q.prompt.toLowerCase();
    const visualWords: Record<string, string[]> = {
      bar: ["bar chart", "chart"],
      line: ["line graph", "graph"],
      pie: ["pie chart"],
      table: ["table"],
      map: ["map"],
      process: ["diagram", "process"],
    };
    const expected = visualWords[q.visualType];
    if (!expected?.some((w) => promptLower.includes(w))) {
      add(q.id, `Prompt text may not match visual type "${q.visualType}"`);
    }

    if (!q.prompt.includes("Summarise the information")) {
      add(q.id, "Prompt missing standard IELTS instruction line");
    }

    switch (q.visualType) {
      case "bar": {
        if (!q.bar) add(q.id, "Bar chart missing bar data");
        else {
          const n = q.bar.categories.length;
          for (const s of q.bar.series) {
            if (s.values.length !== n) {
              add(q.id, `Bar series "${s.name}" length mismatch (${s.values.length} vs ${n})`);
            }
          }
        }
        break;
      }
      case "line": {
        if (!q.line) add(q.id, "Line graph missing line data");
        else {
          const n = q.line.years.length;
          for (const s of q.line.series) {
            if (s.values.length !== n) {
              add(q.id, `Line series "${s.name}" length mismatch (${s.values.length} vs ${n})`);
            }
          }
          const countryMatch = q.prompt.match(/(\w+)\s+countries?/i);
          if (countryMatch) {
            const countWord = countryMatch[1].toLowerCase();
            const numMap: Record<string, number> = {
              one: 1,
              two: 2,
              three: 3,
              four: 4,
              five: 5,
              six: 6,
            };
            const expectedCount = numMap[countWord];
            if (expectedCount && q.line.series.length !== expectedCount) {
              add(
                q.id,
                `Prompt says ${countWord} countries but chart has ${q.line.series.length} series`
              );
            }
          }
        }
        break;
      }
      case "pie": {
        if (!q.pie) add(q.id, "Pie chart missing pie data");
        else {
          const total = q.pie.segments.reduce((s, seg) => s + seg.value, 0);
          if (total !== 100) add(q.id, `Pie segments sum to ${total}, not 100`);
          if (/pie charts below show.*\d{4}.*\d{4}/i.test(q.prompt)) {
            add(q.id, "Prompt claims two pie charts but UI renders one — use singular year");
          }
        }
        break;
      }
      case "table": {
        if (!q.table) add(q.id, "Table missing table data");
        else {
          const cols = q.table.headers.length;
          for (const row of q.table.rows) {
            if (row.length !== cols) {
              add(q.id, `Table row has ${row.length} cells, expected ${cols}`);
            }
          }
        }
        break;
      }
      case "map": {
        if (!q.map) add(q.id, "Map missing map data");
        break;
      }
      case "process": {
        if (!q.process?.steps?.length) add(q.id, "Process missing steps");
        break;
      }
    }
  }

  for (const cat of TASK1_CATEGORIES) {
    const count = TASK1_PROMPT_BANK.filter((q) => q.visualType === cat.id).length;
    if (count < 4) add(cat.id, `Task 1 category "${cat.label}" has only ${count} prompts (target 4–6)`);
    if (count > 6) add(cat.id, `Task 1 category "${cat.label}" has ${count} prompts (max 6)`);
  }
}

function validateTask2() {
  const ids = new Set<string>();

  for (const q of TASK2_PROMPT_BANK) {
    if (ids.has(q.id)) add(q.id, "Duplicate prompt id");
    ids.add(q.id);

    if (!q.title?.trim()) add(q.id, "Missing title");
    if (!q.summary?.trim()) add(q.id, "Missing summary");
    if (!q.prompt?.trim()) add(q.id, "Missing prompt");

    const p = q.prompt;
    switch (q.essayType) {
      case "Opinion":
        if (!/agree|disagree|opinion|extent/i.test(p)) {
          add(q.id, "Opinion prompt should ask for agree/disagree or extent");
        }
        break;
      case "Discussion":
        if (!/discuss both views|both views/i.test(p)) {
          add(q.id, "Discussion prompt should ask to discuss both views");
        }
        break;
      case "Problem & Solution":
        if (!/what|how|measures|solutions|problems|causes/i.test(p)) {
          add(q.id, "Problem-Solution prompt should ask about problems/causes and solutions");
        }
        break;
      case "Advantages & Disadvantages":
        if (!/advantages|disadvantages|outweigh/i.test(p)) {
          add(q.id, "Advantages/Disadvantages prompt should mention advantages/disadvantages");
        }
        break;
      case "Two-Part Question":
        if (!/\?[\s\S]*\?/.test(p)) {
          add(q.id, "Two-Part prompt should contain two distinct questions");
        }
        break;
    }
  }

  for (const cat of TASK2_CATEGORIES) {
    const count = TASK2_PROMPT_BANK.filter((q) => q.essayType === cat.id).length;
    if (count < 4) add(cat.id, `Task 2 category "${cat.label}" has only ${count} prompts (target 4–6)`);
    if (count > 6) add(cat.id, `Task 2 category "${cat.label}" has ${count} prompts (max 6)`);
  }
}

validateTask1();
validateTask2();

if (issues.length === 0) {
  console.log("✓ Writing prompt bank validation passed");
  console.log(`  Task 1: ${TASK1_PROMPT_BANK.length} prompts`);
  console.log(`  Task 2: ${TASK2_PROMPT_BANK.length} prompts`);
  process.exit(0);
} else {
  console.error(`✗ ${issues.length} validation issue(s):\n`);
  for (const i of issues) {
    console.error(`  [${i.id}] ${i.message}`);
  }
  process.exit(1);
}
