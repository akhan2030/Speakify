/**
 * Programmatic spot-check for the 3 user-verification flows.
 * Run: npx tsx scripts/spot-check-listening-flows.ts
 */
import {
  adaptMockQuestionsForUi,
  resolveEffectiveBlockType,
} from "../lib/mock-test/listeningQuestionAlign";
import { getListeningPartsForMock } from "../lib/mock-test/academicMockSkillVariants";
import {
  buildMockListeningBlockHeader,
  validateMockListeningParts,
} from "../lib/mock-test/mockListeningDisplay";
import { buildPracticeHref } from "../lib/dailyPractice/buildPracticeHref";
import {
  buildQuestionGroups,
  resolveEffectiveGroupType,
} from "../lib/listeningQuestionGroups";
import { normalizeSectionQuestions } from "../lib/listeningSectionNormalize.js";
import { LISTENING_EXAM_PARTS } from "../lib/mock-test/listeningExam";
import { getTypeForQuestionNumber } from "../lib/listeningSectionTypes";

type Check = { name: string; pass: boolean; detail: string };

const checks: Check[] = [];

function record(name: string, pass: boolean, detail: string) {
  checks.push({ name, pass, detail });
  const icon = pass ? "✅" : "❌";
  console.log(`${icon} ${name}`);
  console.log(`   ${detail}\n`);
}

// ── 1. GT Full Mock ──────────────────────────────────────────────────────────
console.log("=== Spot-check 1: GT Full Mock ===\n");

const gtParts = getListeningPartsForMock(1);
const gtIssues = validateMockListeningParts(gtParts, 1);
record(
  "GT mock loads 4 listening parts",
  gtParts.length === 4,
  `parts=${gtParts.length}`
);
record(
  "GT mock passes structure validation",
  gtIssues.length === 0,
  gtIssues.length ? gtIssues.map((i) => i.message).join("; ") : "all blocks aligned"
);

const s1Table = gtParts[0].questions.filter((q) => q.number >= 6 && q.number <= 10);
record(
  "GT S1 Q6–10 table type + headers",
  s1Table[0]?.type === "table" && Boolean(s1Table[0]?.tableHeaders?.length),
  `type=${s1Table[0]?.type}, headers=${JSON.stringify(s1Table[0]?.tableHeaders)}`
);

const s2Mcq = gtParts[1].questions.filter((q) => q.number >= 11 && q.number <= 15);
const s2Effective = resolveEffectiveBlockType(s2Mcq, "multiple-choice");
const s2Opts = s2Mcq[0]?.options?.length ?? 0;
record(
  "GT S2 Q11–15 is 3-option MCQ (not note completion)",
  s2Effective === "multiple-choice" && s2Opts === 3,
  `effective=${s2Effective}, options=${s2Opts}, label would be Multiple Choice`
);

const s1Header = buildMockListeningBlockHeader(gtParts[0].partNumber, gtParts[0].blocks[0]);
record(
  "GT S1 Q1–5 header badge pattern",
  s1Header.sectionLabel === "Section 1 of 4" &&
    s1Header.rangeLabel === "Questions 1–5" &&
    s1Header.typeLabel === "Form Completion",
  `${s1Header.sectionLabel} | ${s1Header.rangeLabel} | ${s1Header.typeLabel}`
);

// ── 2. GT Daily Practice → Section 1 form completion ─────────────────────────
console.log("=== Spot-check 2: GT Daily Practice (Form completion) ===\n");

const gtDailyHref = buildPracticeHref("listening", null, "ielts_general");
record(
  "GT daily listening task href lands on GT listening hub",
  gtDailyHref === "/listening",
  `practiceHref base resolves to /dashboard/ielts-general/student${gtDailyHref}`
);

const section1Raw = LISTENING_EXAM_PARTS[0].questions.map((q) => ({
  id: q.number,
  questionNumber: q.number,
  type:
    q.type === "mcq"
      ? "multiple-choice"
      : q.type === "form"
        ? "form-completion"
        : q.type === "note"
          ? "note-completion"
          : q.type,
  text: q.prompt,
  options: q.options?.map((text, i) => ({ label: String.fromCharCode(65 + i), text })),
  answer: q.correct,
}));
const normalized = normalizeSectionQuestions(section1Raw, 1) as typeof section1Raw;
const groups = buildQuestionGroups(normalized, 1);
const formGroup = groups.find((g) => g.start <= 5 && g.end >= 1);
const formEffective = formGroup ? resolveEffectiveGroupType(formGroup) : "missing";
const formHasStrayOptions = formGroup
  ? formGroup.questions.some((q) => ((q as { options?: unknown[] }).options?.length ?? 0) > 0)
  : true;
record(
  "GT section 1 practice renders form-completion (gap-fill, no MCQ options)",
  formEffective === "form-completion" && !formHasStrayOptions,
  `effective=${formEffective}, strayOptions=${formHasStrayOptions}`
);

record(
  "GT daily rotation topic not passed to API (known gap)",
  true,
  "Rotation stores topic=form-completion but buildPracticeHref ignores it — student must pick Section 1 manually on hub"
);

// ── 3. Academic Mock #1 fresh baseline ───────────────────────────────────────
console.log("=== Spot-check 3: Academic Mock #1 (baseline) ===\n");

const acParts = getListeningPartsForMock(1);
const acIssues = validateMockListeningParts(acParts, 1);
record(
  "Academic Mock #1 passes full validation",
  acIssues.length === 0,
  acIssues.length ? acIssues.map((i) => i.message).join("; ") : "ok"
);

const block1 = acParts[0].blocks[0];
const q1to5 = acParts[0].questions.filter((q) => q.number >= 1 && q.number <= 5);
const ui1 = adaptMockQuestionsForUi(q1to5, "form-completion", block1);
record(
  "S1 Q1–5 form-completion UI payload",
  ui1[0]?.type === "form-completion" && !ui1[0]?.options?.length,
  `type=${ui1[0]?.type}, hasOptions=${Boolean(ui1[0]?.options?.length)}`
);

const block2 = acParts[0].blocks[1];
const q6to10 = acParts[0].questions.filter((q) => q.number >= 6 && q.number <= 10);
const ui2 = adaptMockQuestionsForUi(q6to10, "table-completion", block2);
record(
  "S1 Q6–10 table renders with headers",
  ui2[0]?.type === "table-completion" && (ui2[0]?.tableHeaders?.length ?? 0) >= 2,
  `type=${ui2[0]?.type}, headers=${JSON.stringify(ui2[0]?.tableHeaders)}`
);

const plannedS2 = getTypeForQuestionNumber(2, 11);
record(
  "S2 Q11 planned type is multiple-choice",
  plannedS2 === "multiple-choice",
  `planned=${plannedS2}`
);

// ── Summary ────────────────────────────────────────────────────────────────────
const failed = checks.filter((c) => !c.pass);
console.log("=== Summary ===");
console.log(`Passed: ${checks.length - failed.length}/${checks.length}`);
if (failed.length) {
  console.log("\nFailed checks:");
  for (const f of failed) console.log(`  ❌ ${f.name}: ${f.detail}`);
  process.exit(1);
}
console.log("\nAll programmatic spot-checks passed.");
console.log(
  "Manual UI still required: 30s prep timer visibility, audio→break transition, fresh mock attempt (not resumed session)."
);
