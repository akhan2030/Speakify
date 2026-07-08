/**
 * Validates the GT writing prompt bank before ship.
 * Run: npm run validate:gt-writing-prompts
 */

import {
  GT_LETTER_PROMPT_BANK,
  GT_LETTER_CATEGORIES,
  GT_TASK2_PROMPT_BANK,
  GT_TASK2_CATEGORIES,
} from "../lib/ielts-general/writingPromptBank.ts";

type Issue = { id: string; message: string };
const issues: Issue[] = [];

function add(id: string, message: string) {
  issues.push({ id, message });
}

function validateLetters() {
  const ids = new Set<string>();

  for (const q of GT_LETTER_PROMPT_BANK) {
    if (ids.has(q.id)) add(q.id, "Duplicate letter id");
    ids.add(q.id);

    if (!q.title?.trim()) add(q.id, "Missing title");
    if (!q.summary?.trim()) add(q.id, "Missing summary");
    if (!q.situation?.trim()) add(q.id, "Missing situation");
    if (!q.writeTo?.trim()) add(q.id, "Missing writeTo");
    if (!q.beginAs?.trim()) add(q.id, "Missing beginAs greeting");

    if (q.bulletPoints.length !== 3) {
      add(q.id, `Letter must have exactly 3 bullet points (has ${q.bulletPoints.length})`);
    }

    for (const b of q.bulletPoints) {
      if (!b.trim()) add(q.id, "Empty bullet point");
    }

    if (!q.prompt.includes("Write a letter to")) {
      add(q.id, "Prompt missing 'Write a letter to' instruction");
    }
    if (!q.prompt.includes("Begin your letter as follows:")) {
      add(q.id, "Prompt missing 'Begin your letter as follows' line");
    }
    if (q.prompt.toLowerCase().includes("chart") || q.prompt.toLowerCase().includes("graph")) {
      add(q.id, "Letter prompt must not reference charts/graphs");
    }

    if (q.letterType === "formal" && !q.beginAs.includes("Sir or Madam")) {
      add(q.id, "Formal letter should begin with Dear Sir or Madam");
    }
    if (q.letterType === "informal" && q.beginAs.includes("Sir or Madam")) {
      add(q.id, "Informal letter should not use Dear Sir or Madam");
    }
  }

  for (const cat of GT_LETTER_CATEGORIES) {
    const count = GT_LETTER_PROMPT_BANK.filter((q) => q.letterType === cat.id).length;
    if (count !== 6) add(cat.id, `Letter category "${cat.label}" has ${count} prompts (expected 6)`);
  }
}

function validateTask2() {
  const ids = new Set<string>();

  for (const q of GT_TASK2_PROMPT_BANK) {
    if (ids.has(q.id)) add(q.id, "Duplicate essay id");
    ids.add(q.id);

    if (!q.title?.trim()) add(q.id, "Missing title");
    if (!q.summary?.trim()) add(q.id, "Missing summary");
    if (!q.prompt?.trim()) add(q.id, "Missing prompt");

    const p = q.prompt.toLowerCase();
    if (p.includes("research funding") || p.includes("scientific study")) {
      add(q.id, "Essay topic may be too academic for GT");
    }

    switch (q.essayType) {
      case "Opinion":
        if (!/agree|disagree|opinion|extent/i.test(q.prompt)) {
          add(q.id, "Opinion prompt should ask for agree/disagree");
        }
        break;
      case "Discussion":
        if (!/discuss both views|both views/i.test(q.prompt)) {
          add(q.id, "Discussion prompt should ask to discuss both views");
        }
        break;
      case "Cause & Effect":
        if (!/causes?|effects?|reasons?|consequences/i.test(q.prompt)) {
          add(q.id, "Cause & Effect prompt should ask about causes and/or effects");
        }
        break;
      case "Problem & Solution":
        if (!/problems?|solutions?|measures|what can/i.test(q.prompt)) {
          add(q.id, "Problem-Solution prompt should ask about problems and solutions");
        }
        break;
      case "Advantages & Disadvantages":
        if (!/advantages|disadvantages/i.test(q.prompt)) {
          add(q.id, "Advantages/Disadvantages prompt should mention both");
        }
        break;
      case "Two-Part Question":
        if (!/\?[\s\S]*\?/.test(q.prompt)) {
          add(q.id, "Two-Part prompt should contain two questions");
        }
        break;
    }
  }

  for (const cat of GT_TASK2_CATEGORIES) {
    const count = GT_TASK2_PROMPT_BANK.filter((q) => q.essayType === cat.id).length;
    if (count !== 6) add(cat.id, `Essay category "${cat.label}" has ${count} prompts (expected 6)`);
  }
}

validateLetters();
validateTask2();

if (issues.length === 0) {
  console.log("✓ GT writing prompt bank validation passed");
  console.log(`  Task 1 letters: ${GT_LETTER_PROMPT_BANK.length}`);
  console.log(`  Task 2 essays: ${GT_TASK2_PROMPT_BANK.length}`);
  process.exit(0);
} else {
  console.error(`✗ ${issues.length} validation issue(s):\n`);
  for (const i of issues) {
    console.error(`  [${i.id}] ${i.message}`);
  }
  process.exit(1);
}
