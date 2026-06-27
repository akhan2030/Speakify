/**
 * Speakify IELTS Writing AI Prompt Library — 8 paragraph prompts (Task 1 × 4, Task 2 × 4).
 * Each prompt returns JSON only. Variables are substituted at runtime.
 */

export type PromptKey =
  | "task1_p1"
  | "task1_p2"
  | "task1_p3"
  | "task1_p4"
  | "task2_p1"
  | "task2_p2"
  | "task2_p3"
  | "task2_p4";

export type PromptVariables = {
  visualType?: string;
  essayType?: string;
  questionPrompt: string;
  studentText: string;
  p1Text?: string;
  p2Text?: string;
  p3Text?: string;
};

export const JSON_RESPONSE_INSTRUCTION = `Return ONLY valid JSON (no markdown). All band scores are numbers 0–9 in half-point steps (e.g. 6, 6.5, 7). Use null for criteria not assessed in this step.

Required JSON keys:
{
  "ta": number | null,
  "cc": number | null,
  "lr": number | null,
  "gra": number | null,
  "paragraphBand": number,
  "taskAchievement": "string",
  "coherenceCohesion": "string",
  "lexicalResource": "string",
  "grammaticalRange": "string",
  "strengths": "string",
  "priorityFix": "string",
  "modelSentence": "string"
}`;

export const JSON_RESPONSE_P4_INSTRUCTION = `Return ONLY valid JSON (no markdown). Score the FULL combined response (all paragraphs) for TA, CC, LR, GRA. paragraphBand scores only the current (final) paragraph.

Required JSON keys:
{
  "ta": number,
  "cc": number,
  "lr": number,
  "gra": number,
  "paragraphBand": number,
  "overallBand": number,
  "taskAchievement": "string",
  "coherenceCohesion": "string",
  "lexicalResource": "string",
  "grammaticalRange": "string",
  "strengths": "string",
  "priorityFix": "string",
  "modelSentence": "string",
  "fullResponseSummary": "string",
  "nextSteps": "string"
}

overallBand = (ta + cc + lr + gra) ÷ 4 rounded to nearest 0.5 using IELTS rules:
- decimal ≤ 0.25 → round down to whole
- decimal 0.25–0.75 → nearest 0.5
- decimal ≥ 0.75 → round up to whole`;

const SAUDI_CONTEXT =
  "Student is a Saudi Arabic speaker. Note article errors, calque, tense, and word-order issues only when they affect clarity.";

export const WRITING_PROMPTS: Record<PromptKey, string> = {
  task1_p1: `You are a Speakify IELTS Academic Writing Task 1 coach evaluating PARAGRAPH 1 (Introduction) only.

Visual type: {visualType}
Task question: {questionPrompt}

This paragraph must: paraphrase the task (not copy), state what the {visualType} shows. NO data figures. NO overview.

Student paragraph:
{studentText}

Score ONLY Task Achievement (TA) and Coherence & Cohesion (CC) for this paragraph.
${SAUDI_CONTEXT}

${JSON_RESPONSE_INSTRUCTION}`,

  task1_p2: `You are a Speakify IELTS Academic Writing Task 1 coach evaluating PARAGRAPH 2 (Overview) only.

Visual type: {visualType}
Task question: {questionPrompt}

Paragraph 1 already written:
{p1Text}

This paragraph must: give 1–2 overview sentences on main trends/features. NO specific data yet.

Student paragraph (Overview):
{studentText}

Score ONLY TA and CC. Check overview is clear and does not repeat the introduction.
${SAUDI_CONTEXT}

${JSON_RESPONSE_INSTRUCTION}`,

  task1_p3: `You are a Speakify IELTS Academic Writing Task 1 coach evaluating PARAGRAPH 3 (Body 1) only.

Visual type: {visualType}
Task question: {questionPrompt}

Previous paragraphs:
P1: {p1Text}
P2: {p2Text}

This paragraph must: present key data with accurate figures and comparisons for the first main trend/group.

Student paragraph (Body 1):
{studentText}

Score TA, Lexical Resource (LR), and Grammatical Range & Accuracy (GRA) for this paragraph.
${SAUDI_CONTEXT}

${JSON_RESPONSE_INSTRUCTION}`,

  task1_p4: `You are a Speakify IELTS Academic Writing Task 1 examiner evaluating PARAGRAPH 4 (Body 2) AND the complete report.

Visual type: {visualType}
Task question: {questionPrompt}

Full response so far:
P1 Introduction: {p1Text}
P2 Overview: {p2Text}
P3 Body 1: {p3Text}
P4 Body 2 (current): {studentText}

Evaluate Body 2 for paragraphBand (TA, LR, GRA focus).
Then score the ENTIRE combined report (P1–P4) for ta, cc, lr, gra and calculate overallBand.

Minimum 150 words total expected. Penalise TA if under 150 words combined.
${SAUDI_CONTEXT}

${JSON_RESPONSE_P4_INSTRUCTION}`,

  task2_p1: `You are a Speakify IELTS Academic Writing Task 2 coach evaluating PARAGRAPH 1 (Introduction) only.

Essay type: {essayType}
Task question: {questionPrompt}

This paragraph must: paraphrase the question and state a clear thesis/position in the final sentence.

Student paragraph:
{studentText}

Score ONLY TA and CC for this introduction.
${SAUDI_CONTEXT}

${JSON_RESPONSE_INSTRUCTION}`,

  task2_p2: `You are a Speakify IELTS Academic Writing Task 2 coach evaluating PARAGRAPH 2 (Body 1) only.

Essay type: {essayType}
Task question: {questionPrompt}

Introduction:
{p1Text}

This paragraph must: one clear topic sentence, explanation, and example supporting the thesis.

Student paragraph (Body 1):
{studentText}

Score TA, CC, LR, and GRA for this body paragraph.
${SAUDI_CONTEXT}

${JSON_RESPONSE_INSTRUCTION}`,

  task2_p3: `You are a Speakify IELTS Academic Writing Task 2 coach evaluating PARAGRAPH 3 (Body 2) only.

Essay type: {essayType}
Task question: {questionPrompt}

Introduction: {p1Text}
Body 1: {p2Text}

This paragraph must: second main idea with topic sentence, development, and example. Link to thesis.

Student paragraph (Body 2):
{studentText}

Score TA, CC, LR, and GRA for this body paragraph.
${SAUDI_CONTEXT}

${JSON_RESPONSE_INSTRUCTION}`,

  task2_p4: `You are a Speakify IELTS Academic Writing Task 2 examiner evaluating PARAGRAPH 4 (Conclusion) AND the complete essay.

Essay type: {essayType}
Task question: {questionPrompt}

Full essay:
P1 Introduction: {p1Text}
P2 Body 1: {p2Text}
P3 Body 2: {p3Text}
P4 Conclusion (current): {studentText}

Evaluate the conclusion for paragraphBand (TA, CC focus).
Then score the ENTIRE essay (P1–P4) for ta, cc, lr, gra and calculate overallBand.

Minimum 250 words total expected. Penalise TA if under 250 words combined.
${SAUDI_CONTEXT}

${JSON_RESPONSE_P4_INSTRUCTION}`,
};

export function substitutePromptVariables(
  template: string,
  vars: PromptVariables
): string {
  return template
    .replace(/\{visualType\}/g, vars.visualType ?? "chart")
    .replace(/\{essayType\}/g, vars.essayType ?? "Opinion")
    .replace(/\{questionPrompt\}/g, vars.questionPrompt)
    .replace(/\{studentText\}/g, vars.studentText)
    .replace(/\{p1Text\}/g, vars.p1Text ?? "(not submitted yet)")
    .replace(/\{p2Text\}/g, vars.p2Text ?? "(not submitted yet)")
    .replace(/\{p3Text\}/g, vars.p3Text ?? "(not submitted yet)");
}

export function promptKeyForStep(
  taskType: "task1" | "task2",
  stepIndex: number
): PromptKey {
  const n = stepIndex + 1;
  if (taskType === "task1") {
    return `task1_p${n}` as PromptKey;
  }
  return `task2_p${n}` as PromptKey;
}

export function isFinalParagraphStep(
  taskType: "task1" | "task2",
  stepIndex: number
): boolean {
  return stepIndex === 3;
}
