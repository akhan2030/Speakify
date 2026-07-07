import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";
import { buildRecommendations } from "@/lib/course/recommendationEngine";
import { computeReadinessMeter } from "@/lib/course/readinessMeter";
import { GENERAL_STUDENT_BASE } from "@/lib/ielts-general/paths";
import { gtAttemptSkill } from "@/lib/ielts-general/attemptRows";

export const runtime = "nodejs";

const BASE = GENERAL_STUDENT_BASE;

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function averageNumbers(values: number[]) {
  const nums = values.filter((v) => Number.isFinite(v));
  if (!nums.length) return null;
  return Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10;
}

function normalizeLetterType(value: unknown) {
  const v = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (v === "formal") return "formal";
  if (v === "semi_formal" || v === "semiformal") return "semiFormal";
  if (v === "informal") return "informal";
  return null;
}

function buildLetterTypeAccuracy(rows: Array<{ letter_type?: string; accuracy?: number; band_score?: number }>) {
  const buckets: Record<string, number[]> = {
    formal: [],
    semiFormal: [],
    informal: [],
  };
  for (const row of rows) {
    const type = normalizeLetterType(row.letter_type);
    if (!type) continue;
    const score =
      row.accuracy != null
        ? Number(row.accuracy) <= 1
          ? Number(row.accuracy) * 100
          : Number(row.accuracy)
        : row.band_score != null
          ? (Number(row.band_score) / 9) * 100
          : null;
    if (score != null && Number.isFinite(score)) buckets[type].push(score);
  }
  return {
    formal: averageNumbers(buckets.formal),
    semiFormal: averageNumbers(buckets.semiFormal),
    informal: averageNumbers(buckets.informal),
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await fetchStudentProfile(studentId);
  const recommendations = buildRecommendations(profile);
  const readiness = computeReadinessMeter(profile, recommendations);

  let letterTypeAccuracy: {
    formal: number | null;
    semiFormal: number | null;
    informal: number | null;
  } = { formal: null, semiFormal: null, informal: null };
  let readingSections = {
    A: { band: null as number | null, accuracy: null as number | null },
    B: { band: null as number | null, accuracy: null as number | null },
    C: { band: null as number | null, accuracy: null as number | null },
  };
  let skillBands = {
    writing: null as number | null,
    essay: null as number | null,
    speaking: null as number | null,
    listening: null as number | null,
    reading: null as number | null,
  };

  if (process.env.SUPABASE_SERVICE_KEY) {
    const supabase = getSupabase();
    const { data: attempts } = await supabase
      .from("ielts_general_attempts")
      .select("skill, task_type, band_score, accuracy, letter_type, completed_at")
      .eq("student_id", studentId)
      .order("completed_at", { ascending: false })
      .limit(60);

    const rows = attempts ?? [];
    letterTypeAccuracy = buildLetterTypeAccuracy(
      rows.filter((r) => r.letter_type)
    );

    const latestBySkill = new Map<string, (typeof rows)[0]>();
    for (const row of rows) {
      const skill = gtAttemptSkill(row);
      if (!skill) continue;
      if (!latestBySkill.has(skill)) latestBySkill.set(skill, row);
    }

    skillBands.listening = latestBySkill.get("listening")?.band_score ?? null;
    skillBands.speaking = latestBySkill.get("speaking")?.band_score ?? null;
    skillBands.reading = latestBySkill.get("reading")?.band_score ?? null;
    skillBands.writing = latestBySkill.get("writing")?.band_score ?? null;
    skillBands.essay = latestBySkill.get("writing_task2")?.band_score ?? skillBands.writing;

    for (const sec of ["a", "b", "c"] as const) {
      const row = latestBySkill.get(`reading_section_${sec}`);
      if (row) {
        const acc =
          row.accuracy != null
            ? Number(row.accuracy) <= 1
              ? Number(row.accuracy) * 100
              : Number(row.accuracy)
            : null;
        readingSections[sec.toUpperCase() as "A" | "B" | "C"] = {
          band: row.band_score != null ? Number(row.band_score) : null,
          accuracy: acc,
        };
      }
    }
  }

  const focusLinks = [
    {
      label: "Letter practice",
      href: `${BASE}/letter-practice`,
      skill: "writing",
    },
    {
      label: "GT Reading Section A",
      href: `${BASE}/reading/practice/section-a`,
      skill: "reading",
    },
    {
      label: "Listening full test",
      href: `${BASE}/listening/test`,
      skill: "listening",
    },
    {
      label: "Speaking practice",
      href: `${BASE}/speaking`,
      skill: "speaking",
    },
  ];

  return NextResponse.json({
    readinessPercent: readiness.readinessPercent,
    statusLabel: readiness.statusLabel,
    statusColor: readiness.statusColor,
    currentBand: readiness.currentBand,
    targetBand: readiness.targetBand,
    bandGap: readiness.bandGap,
    nextAction: readiness.nextAction,
    skillBands,
    readingSections,
    letterTypeAccuracy,
    focusLinks,
    recommendations: recommendations.focusSkills?.map((s) => ({
      ...s,
      href: s.href.replace("/dashboard/ielts/student", BASE),
    })),
  });
}
