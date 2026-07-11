import { formatBand } from "@/lib/placement/certificate";
import { bandToCefr } from "@/lib/placement/scoring";
import type { MockTestFullReport } from "@/lib/mock-test/reportTypes";
import { computeOverallBand } from "@/lib/mock-test/scoring";

export type MockProgramme = "ielts_academic" | "ielts_general";

export type MockCertificateSkillRow = {
  key: "listening" | "reading" | "writing" | "speaking";
  label: string;
  band: number | null;
  cefr: string | null;
  note?: string | null;
};

export type MockCertificateData = {
  certificateId: string;
  examReference: string;
  programme: MockProgramme;
  programmeTitle: string;
  programmeSubtitle: string;
  studentName: string;
  testDate: string;
  testDateIso: string;
  issuedDate: string;
  mockNumber: number | null;
  centreName: string;
  centreCountry: string;
  overallBand: number | null;
  overallCefr: { level: string; label: string } | null;
  skillRows: MockCertificateSkillRow[];
  testFormat: string;
  disclaimer: string;
};

export function generateExamReference(seed?: string): string {
  const year = new Date().getFullYear();
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const seq = String(Math.abs(hash % 90000) + 10000);
    return `SPK-MOCK-${year}-${seq}`;
  }
  const seq = String(Math.floor(10000 + Math.random() * 90000));
  return `SPK-MOCK-${year}-${seq}`;
}

export function programmeMeta(programme: MockProgramme): {
  programmeTitle: string;
  programmeSubtitle: string;
  testFormat: string;
} {
  if (programme === "ielts_general") {
    return {
      programmeTitle: "IELTS General Training",
      programmeSubtitle: "IELTS General Training Accelerator — Mock Test Report",
      testFormat: "Listening · Reading · Writing (Letter + Essay) · Speaking",
    };
  }
  return {
    programmeTitle: "IELTS Academic",
    programmeSubtitle: "IELTS Academic Accelerator — Mock Test Report",
    testFormat: "Listening · Academic Reading · Writing (Task 1 + Task 2) · Speaking",
  };
}

function formatTrfDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTrfDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function skillRow(
  key: MockCertificateSkillRow["key"],
  label: string,
  band: number | null | undefined,
  note?: string | null
): MockCertificateSkillRow {
  if (band == null || !Number.isFinite(band)) {
    return { key, label, band: null, cefr: null, note: note ?? null };
  }
  const rounded = Math.round(band * 2) / 2;
  return {
    key,
    label,
    band: rounded,
    cefr: bandToCefr(rounded).cefr,
    note: note ?? null,
  };
}

export function buildMockCertificateData(input: {
  programme: MockProgramme;
  studentName: string;
  completedAt: string;
  examReference?: string | null;
  examDateTime?: string | null;
  mockNumber?: number | null;
  skills: {
    listening?: number | null;
    reading?: number | null;
    writing?: number | null;
    speaking?: number | null;
  };
  speakingNote?: string | null;
}): MockCertificateData {
  const meta = programmeMeta(input.programme);
  const testDateIso = input.completedAt || new Date().toISOString();
  const examReference =
    input.examReference?.trim() ||
    generateExamReference(`${testDateIso}|${input.studentName}|${input.mockNumber ?? ""}`);

  const skillRows: MockCertificateSkillRow[] = [
    skillRow("listening", "Listening", input.skills.listening),
    skillRow("reading", "Reading", input.skills.reading),
    skillRow("writing", "Writing", input.skills.writing),
    skillRow(
      "speaking",
      "Speaking",
      input.skills.speaking,
      input.speakingNote ?? (input.skills.speaking == null ? "Practice session recorded" : null)
    ),
  ];

  const scoredBands = skillRows
    .map((r) => r.band)
    .filter((b): b is number => b != null && Number.isFinite(b));

  const overallBand =
    scoredBands.length > 0
      ? computeOverallBand({
          listening: input.skills.listening ?? undefined,
          reading: input.skills.reading ?? undefined,
          writing: input.skills.writing ?? undefined,
          speaking: input.skills.speaking ?? undefined,
        })
      : null;

  const overallCefr =
    overallBand != null ? bandToCefr(overallBand) : null;

  return {
    certificateId: examReference,
    examReference,
    programme: input.programme,
    programmeTitle: meta.programmeTitle,
    programmeSubtitle: meta.programmeSubtitle,
    studentName: input.studentName.trim() || "Candidate",
    testDate: input.examDateTime?.trim() || formatTrfDateTime(testDateIso),
    testDateIso,
    issuedDate: formatTrfDate(testDateIso),
    mockNumber: input.mockNumber ?? null,
    centreName: "Speakify Global Language Center",
    centreCountry: "Kingdom of Saudi Arabia",
    overallBand,
    overallCefr: overallCefr
      ? { level: overallCefr.cefr, label: overallCefr.label }
      : null,
    skillRows,
    testFormat: meta.testFormat,
    disclaimer:
      "This is a Speakify mock test simulation report for practice purposes. It is not an official IELTS Test Report Form issued by the British Council, IDP, or Cambridge Assessment English.",
  };
}

export function buildMockCertificateFromReport(
  report: MockTestFullReport,
  meta?: {
    examReference?: string | null;
    examDateTime?: string | null;
    mockNumber?: number | null;
    programme?: MockProgramme;
  }
): MockCertificateData {
  const variant =
    meta?.programme ??
    ((report as { examVariant?: string }).examVariant === "general"
      ? "ielts_general"
      : "ielts_academic");

  return buildMockCertificateData({
    programme: variant,
    studentName: report.studentName,
    completedAt: report.completedAt,
    examReference: meta?.examReference,
    examDateTime: meta?.examDateTime,
    mockNumber: meta?.mockNumber,
    skills: {
      listening: report.skills.listening.band,
      reading: report.skills.reading.band,
      writing: report.skills.writing.band,
      speaking: report.skills.speaking.band,
    },
  });
}

export function formatCertificateBand(band: number | null): string {
  if (band == null || !Number.isFinite(band)) return "—";
  return formatBand(band);
}

export type MockSessionMeta = {
  examReference?: string;
  examDateTime?: string;
  mockNumber?: number;
  examVariant?: string;
  studentName?: string;
  completedAt?: string;
};

export function readMockSessionMeta(
  payload: Record<string, unknown> | null | undefined
): MockSessionMeta {
  if (!payload || typeof payload !== "object") return {};
  const cert =
    payload.certificateMeta && typeof payload.certificateMeta === "object"
      ? (payload.certificateMeta as Record<string, unknown>)
      : null;
  return {
    examReference:
      typeof payload.examReference === "string"
        ? payload.examReference
        : typeof cert?.examReference === "string"
          ? cert.examReference
          : undefined,
    examDateTime:
      typeof payload.examDateTime === "string"
        ? payload.examDateTime
        : typeof cert?.examDateTime === "string"
          ? cert.examDateTime
          : undefined,
    mockNumber:
      typeof payload.mockNumber === "number"
        ? payload.mockNumber
        : typeof cert?.mockNumber === "number"
          ? cert.mockNumber
          : undefined,
    examVariant:
      typeof payload.examVariant === "string"
        ? payload.examVariant
        : typeof cert?.examVariant === "string"
          ? cert.examVariant
          : undefined,
    studentName:
      typeof payload.studentName === "string"
        ? payload.studentName
        : typeof cert?.studentName === "string"
          ? cert.studentName
          : undefined,
    completedAt:
      typeof payload.completedAt === "string"
        ? payload.completedAt
        : typeof cert?.completedAt === "string"
          ? cert.completedAt
          : undefined,
  };
}
