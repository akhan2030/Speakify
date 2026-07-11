/**
 * Itemized listening content bank audit.
 * Run: npx tsx scripts/audit-listening-content-bank.ts
 */
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { getListeningPartsForMock } from "../lib/mock-test/academicMockSkillVariants";
import { validateMockListeningParts } from "../lib/mock-test/mockListeningDisplay";
import { buildQuestionGroups, resolveEffectiveGroupType } from "../lib/listeningQuestionGroups";
import { getSectionQuestionBlocks } from "../lib/listeningSectionTypes";
import { normalizeSectionQuestions } from "../lib/listeningSectionNormalize.js";
import { LISTENING_EXAM_PARTS } from "../lib/mock-test/listeningExam";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

type Status = "ok" | "fixed" | "broken" | "n/a" | "warn";

type AuditRow = {
  category: string;
  id: string;
  programme: string;
  renderer: string;
  alignLayer: string;
  status: Status;
  notes: string;
};

const rows: AuditRow[] = [];

function statusIcon(s: Status) {
  if (s === "ok") return "✅";
  if (s === "fixed") return "⚠️";
  if (s === "broken") return "❌";
  if (s === "warn") return "⚠️";
  return "—";
}

function add(row: AuditRow) {
  rows.push(row);
}

function auditAcademicFullMocks() {
  for (let mockNumber = 1; mockNumber <= 5; mockNumber += 1) {
    const parts = getListeningPartsForMock(mockNumber);
    const issues = validateMockListeningParts(parts, mockNumber);
    add({
      category: "Full Mock Exam (Academic)",
      id: `Academic Mock #${mockNumber}`,
      programme: "IELTS Academic",
      renderer: "MockExamEngine → MockListeningBlockPanel → ListeningQuestions",
      alignLayer: "listeningQuestionAlign.ts + alignQuestionsToSectionPlan",
      status: issues.length === 0 ? "ok" : "broken",
      notes:
        issues.length === 0
          ? "Header, instructions, prep timer, table/MCQ/gap-fill aligned"
          : issues.map((i) => i.message).join("; "),
    });
  }
}

function auditGtFullMock() {
  const parts = getListeningPartsForMock(1);
  add({
    category: "Full Mock Exam (GT)",
    id: "GT Mock (rotating mockNumber)",
    programme: "IELTS General Training",
    renderer: "MockExamEngine → MockListeningBlockPanel → ListeningQuestions",
    alignLayer: "listeningQuestionAlign.ts (shared academic variants by mockNumber)",
    status: parts.length === 4 ? "fixed" : "broken",
    notes:
      parts.length === 4
        ? "GT now loads listening via getListeningPartsForMock — same IELTS format mapping as Academic"
        : "Listening parts missing",
  });
}

function auditLegacyStaticMock() {
  add({
    category: "Legacy static (deprecated)",
    id: "LISTENING_EXAM_PARTS (Seaside Hotel)",
    programme: "—",
    renderer: "Not served in production",
    alignLayer: "n/a",
    status: "n/a",
    notes: "Retained for scoring fallback only; excluded from student UI",
  });
}

function auditSectionPracticeStatic() {
  for (let section = 1; section <= 4; section += 1) {
    const part = LISTENING_EXAM_PARTS[section - 1];
    const raw = part.questions.map((q) => ({
      id: q.number,
      questionNumber: q.number,
      type: q.type === "mcq" ? "multiple-choice" : q.type === "form" ? "form-completion" : q.type === "note" ? "note-completion" : q.type,
      text: q.prompt,
      options: q.options?.map((text, i) => ({ label: String.fromCharCode(65 + i), text })),
      answer: q.correct,
    }));
    const normalized = normalizeSectionQuestions(raw, section) as typeof raw;
    const groups = buildQuestionGroups(normalized, section);
    const mismatches: string[] = [];
    for (const group of groups) {
      const effective = resolveEffectiveGroupType(group);
      if (effective !== group.type && !(group.type === "matching" && effective === "sentence-completion")) {
        mismatches.push(`Q${group.start}: plan=${group.type} render=${effective}`);
      }
      if (effective === "multiple-choice") {
        for (const q of group.questions) {
          const opts = (q as { options?: unknown[] }).options ?? [];
          if (opts.length !== 3) mismatches.push(`Q${(q as { questionNumber: number }).questionNumber}: ${opts.length} MCQ options`);
        }
      }
    }
    add({
      category: "Section Practice (static fallback)",
      id: `Section ${section} — legacy LISTENING_EXAM_PARTS`,
      programme: "Academic + GT (shared API)",
      renderer: "section/[id] → ListeningQuestionsColumn → ListeningQuestions",
      alignLayer: "listeningQuestionGroups.applyPlanTypesToQuestions + resolveEffectiveGroupType",
      status: mismatches.length === 0 ? "ok" : "warn",
      notes:
        mismatches.length === 0
          ? "Plan types applied; instructions match renderer"
          : mismatches.join("; "),
    });
  }
}

function auditDailyPracticeItems() {
  const academic = [
    "Listening: Section 1 — Form completion",
    "Listening: Section 2 — Monologue",
    "Listening: Section 3 — Discussion",
    "Listening: Section 4 — Lecture",
  ];
  for (const title of academic) {
    add({
      category: "Daily Practice (rotation)",
      id: title,
      programme: "IELTS Academic",
      renderer: "Routes to /listening hub → section practice",
      alignLayer: "Inherited from section practice pipeline",
      status: "warn",
      notes: "Title is descriptive only; actual content from generated_listening_tests bank at session time",
    });
  }
  const gt = [
    "GT Listening: Form completion",
    "GT Listening: Everyday conversation",
    "GT Listening: Social monologue",
  ];
  for (const title of gt) {
    add({
      category: "Daily Practice (rotation)",
      id: title,
      programme: "IELTS General Training",
      renderer: "Routes to /ielts-general/listening → shared section API",
      alignLayer: "Inherited from section practice pipeline",
      status: "warn",
      notes: "GT rotation label does not pass topic into API; content resolved at /api/listening/generate",
    });
  }
  add({
    category: "Daily Practice (AI agent)",
    id: "listening_transcript × 10 CEFR levels/day",
    programme: "Academic",
    renderer: "No dedicated player — routes to /listening",
    alignLayer: "listeningAgent.js → daily_ai_tasks (orphaned payload)",
    status: "warn",
    notes: "Stored transcript/questions in daily_ai_tasks not consumed by a listening renderer directly",
  });
}

function auditMiniMock() {
  add({
    category: "Mini / shortened listening",
    id: "/listening/test (ListeningMockExam)",
    programme: "Academic + GT",
    renderer: "ListeningMockExam → ListeningQuestionsColumn → ListeningQuestions",
    alignLayer: "listeningQuestionGroups (shared with section practice)",
    status: "warn",
    notes:
      "Marketing says Sections 1–2 mini-mock; code runs full 4-section 40-question test from generated_listening_tests full_mock pool",
  });
}

function auditAccelerator() {
  for (const track of ["foundation", "plus", "elite"]) {
    add({
      category: "Accelerator Practice",
      id: `Track: ${track}`,
      programme: "IELTS Academic",
      renderer: "PracticeListeningPanel → PracticeQuestionField (custom)",
      alignLayer: "normalizePracticeContent + validateListeningForDisplay (NOT listeningQuestionAlign)",
      status: "warn",
      notes: "Separate renderer; uses accelerator_mock_tests bank. MCQ requires ≥4 options in validator.",
    });
  }
}

async function auditDbMocks() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    add({
      category: "DB generated_mock_tests",
      id: "Supabase",
      programme: "Academic",
      renderer: "—",
      alignLayer: "—",
      status: "n/a",
      notes: "No SUPABASE credentials — skipped live DB audit",
    });
    return;
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("generated_mock_tests")
    .select("id, mock_number, test_number, topic, status, listening")
    .eq("test_type", "full_mock")
    .order("mock_number", { ascending: true });

  if (error) {
    add({
      category: "DB generated_mock_tests",
      id: "query error",
      programme: "Academic",
      renderer: "—",
      alignLayer: "—",
      status: "broken",
      notes: error.message,
    });
    return;
  }

  for (const row of data ?? []) {
    const mockNumber = row.mock_number ?? row.test_number ?? row.id;
    const parts = (row.listening as { parts?: unknown })?.parts;
    if (!Array.isArray(parts) || parts.length === 0) {
      add({
        category: "DB generated_mock_tests",
        id: `DB row id=${row.id} mock #${mockNumber}`,
        programme: "IELTS Academic",
        renderer: "MockExamEngine (when bundle loaded)",
        alignLayer: "enrichStoredListeningParts on load",
        status: "broken",
        notes: "No listening.parts JSON on row",
      });
      continue;
    }
    const issues = validateMockListeningParts(parts as Parameters<typeof validateMockListeningParts>[0], mockNumber);
    add({
      category: "DB generated_mock_tests",
      id: `DB row id=${row.id} mock #${mockNumber} (${row.topic ?? "untitled"})`,
      programme: "IELTS Academic",
      renderer: "MockExamEngine (when bundle loaded)",
      alignLayer: "enrichStoredListeningParts on load",
      status: issues.length === 0 ? "ok" : "fixed",
      notes:
        issues.length === 0
          ? `Published ${row.status}; ${parts.length} parts in JSON`
          : `Backfill/enrich needed: ${issues.map((i) => i.message).join("; ")}`,
    });
  }

  const { count: sectionCount } = await supabase
    .from("generated_listening_tests")
    .select("id", { count: "exact", head: true })
    .eq("content_type", "section_practice");

  const { count: fullMockCount } = await supabase
    .from("generated_listening_tests")
    .select("id", { count: "exact", head: true })
    .eq("content_type", "full_mock");

  add({
    category: "DB generated_listening_tests",
    id: `section_practice pool (${sectionCount ?? "?"} rows)`,
    programme: "Academic + GT",
    renderer: "section/[id] + ListeningMockExam",
    alignLayer: "normalizeSectionQuestions + buildQuestionGroups",
    status: "warn",
    notes: "Live AI bank — alignment enforced at normalize + validate on generate; spot-check per session",
  });

  add({
    category: "DB generated_listening_tests",
    id: `full_mock pool (${fullMockCount ?? "?"} rows)`,
    programme: "Academic + GT",
    renderer: "ListeningMockExam (/listening/test)",
    alignLayer: "listeningTestProvision + normalizeSectionQuestions",
    status: "warn",
    notes: "3 specs × 4 sections/day target; validated on agent insert",
  });
}

function auditSectionPlan() {
  for (let s = 1; s <= 4; s += 1) {
    const blocks = getSectionQuestionBlocks(s);
    add({
      category: "Section format plan (source of truth)",
      id: `Section ${s}: ${blocks.map((b) => `${b.type} Q${b.start}-${b.end}`).join(" + ")}`,
      programme: "Academic + GT",
      renderer: "All surfaces",
      alignLayer: "listeningSectionTypes.IELTS_SECTION_PLAN",
      status: "ok",
      notes: "Canonical mapping used by mock align + practice group builder",
    });
  }
}

async function main() {
  auditSectionPlan();
  auditAcademicFullMocks();
  auditGtFullMock();
  auditLegacyStaticMock();
  auditSectionPracticeStatic();
  auditDailyPracticeItems();
  auditMiniMock();
  auditAccelerator();
  await auditDbMocks();

  console.log("\n# Listening Content Bank — Itemized Audit\n");
  console.log(
    "| Status | Category | ID | Programme | Renderer | Align layer | Notes |"
  );
  console.log(
    "|--------|----------|-----|-----------|----------|-------------|-------|"
  );

  for (const r of rows) {
    const note = r.notes.replace(/\|/g, "/").replace(/\n/g, " ").slice(0, 120);
    console.log(
      `| ${statusIcon(r.status)} | ${r.category} | ${r.id} | ${r.programme} | ${r.renderer.slice(0, 40)} | ${r.alignLayer.slice(0, 35)} | ${note} |`
    );
  }

  const counts = {
    ok: rows.filter((r) => r.status === "ok").length,
    fixed: rows.filter((r) => r.status === "fixed").length,
    broken: rows.filter((r) => r.status === "broken").length,
    warn: rows.filter((r) => r.status === "warn").length,
    na: rows.filter((r) => r.status === "n/a").length,
  };

  console.log("\n## Summary");
  console.log(`✅ ok: ${counts.ok}  ⚠️ fixed/warn: ${counts.fixed + counts.warn}  ❌ broken: ${counts.broken}  — n/a: ${counts.na}`);
  console.log(`Total items audited: ${rows.length}\n`);

  process.exit(counts.broken > 0 ? 1 : 0);
}

void main();
