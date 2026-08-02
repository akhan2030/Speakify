import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";
import { buildRecommendations } from "@/lib/course/recommendationEngine";
import { computeReadinessMeter } from "@/lib/course/readinessMeter";
import { normalizeAttemptRow } from "@/lib/mock-test/attemptSchema";
import {
  GT_MOCK_CATALOG,
  isValidGtMockNumber,
} from "@/lib/ielts-general/gtMockCatalog";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseSectionBand(sectionScores, skill) {
  if (!sectionScores || typeof sectionScores !== "object") return null;
  const raw = sectionScores[skill]?.band ?? sectionScores[skill];
  const num = Number(raw);
  return Number.isFinite(num) ? Math.round(num * 10) / 10 : null;
}

function reviewStatus(attempt) {
  const er = attempt.examiner_report;
  if (er && typeof er === "object" && Object.keys(er).length > 0) {
    if (er.humanReviewed || er.human_reviewed || er.reviewedBy) {
      return "Human reviewed";
    }
  }
  if (
    attempt.report &&
    typeof attempt.report === "object" &&
    Object.keys(attempt.report).length > 0
  ) {
    return "AI reviewed";
  }
  return "Pending";
}

function computeTrend(mocks) {
  if (!mocks.length) return "none";
  if (mocks.length === 1) return "baseline";
  const latest = Number(mocks[0].overall_band);
  const prev = Number(mocks[1].overall_band);
  if (!Number.isFinite(latest) || !Number.isFinite(prev)) return "stable";
  const diff = latest - prev;
  if (diff >= 0.25) return "improving";
  if (diff <= -0.25) return "needs_attention";
  return "stable";
}

function isGtAttempt(attempt) {
  const content = attempt.exam_content;
  if (content && typeof content === "object" && content.examVariant === "general") {
    return true;
  }
  if (attempt.programme === "ielts_general") return true;
  // Legacy GT attempts may lack variant — include if programme column missing and
  // student is GT-only (caller filters by enrollment context).
  return false;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const studentName =
      session.user?.name?.trim() ||
      session.user?.email?.split("@")[0] ||
      "Student";

    const profile = await fetchStudentProfile(studentId);
    const recommendations = buildRecommendations(profile);
    const readiness = computeReadinessMeter(profile, recommendations);

    if (!process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({
        studentName,
        targetBand: readiness.targetBand ?? 6.5,
        readinessPercent: readiness.readinessPercent ?? 0,
        bandTrend: "none",
        currentMockNumber: 1,
        lastMock: null,
        history: [],
        availableMocks: GT_MOCK_CATALOG.map((item, index) => ({
          id: null,
          mockNumber: item.mockNumber,
          topic: "Full IELTS General Training Mock Exam",
          theme: item.theme,
          status: "available",
          overallBand: null,
          attemptId: null,
          canStart: false,
          isCurrent: index === 0,
        })),
        access: {
          hasAllMocks: false,
          purchasedMockNumbers: [],
          accessibleMockNumbers: [],
          programme: "ielts_general",
        },
      });
    }

    const supabase = getSupabase();
    const [mocksRes, inProgressRes] = await Promise.all([
      supabase
        .from("mock_test_attempts")
        .select(
          "id, mock_number, status, overall_band, section_scores, completed_at, created_at, exam_content, programme, report, examiner_report"
        )
        .eq("student_id", studentId)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("mock_test_attempts")
        .select("id, mock_number, status, exam_content, programme")
        .eq("student_id", studentId)
        .eq("status", "in_progress")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const allAttempts = (mocksRes.data ?? [])
      .map(normalizeAttemptRow)
      .filter(isGtAttempt);

    const { data: userRow } = await supabase
      .from("users")
      .select(
        "id, role, payment_status, payment_comped_until, enrolled_programs, program_selected, purchase_intent"
      )
      .eq("id", studentId)
      .maybeSingle();

    const { loadMockAccessContext, canStartMock } = await import(
      "@/lib/mock-test/loadMockAccessContext"
    );

    const attemptedMockNumbers = [
      ...new Set(
        allAttempts
          .map((attempt) => Number(attempt.mock_number))
          .filter((n) => isValidGtMockNumber(n))
      ),
    ];

    const accessCtx = await loadMockAccessContext(
      supabase,
      userRow ?? {
        id: studentId,
        role: session.user?.role ?? "student",
      },
      {
        programme: "ielts_general",
        hasAttemptHistory: allAttempts.length > 0,
        attemptedMockNumbers,
      }
    );

    const completedMocks = allAttempts.filter((m) => m.status === "completed");

    const attemptsByMockNumber = new Map();
    for (const attempt of allAttempts) {
      if (attempt.mock_number == null) continue;
      const n = Number(attempt.mock_number);
      if (!isValidGtMockNumber(n)) continue;
      const existing = attemptsByMockNumber.get(n);
      if (!existing || attempt.status === "completed") {
        attemptsByMockNumber.set(n, attempt);
      }
    }

    let availableMocks = GT_MOCK_CATALOG.map((item) => {
      const attempt = attemptsByMockNumber.get(item.mockNumber);
      const completed = attempt?.status === "completed";
      return {
        id: null,
        mockNumber: item.mockNumber,
        topic: "Full IELTS General Training Mock Exam",
        theme: item.theme,
        readingFocus: item.readingFocus,
        generationDate: null,
        status: completed ? "completed" : "available",
        overallBand: completed ? attempt.overall_band : null,
        attemptId: completed ? attempt.id : null,
        canStart: canStartMock(accessCtx, item.mockNumber),
        isCurrent: false,
      };
    });

    const firstStartable = availableMocks.find(
      (m) => m.status === "available" && m.canStart
    );
    const inProgress = (inProgressRes.data ?? []).find(isGtAttempt);
    const currentMockNumber =
      (isValidGtMockNumber(Number(inProgress?.mock_number))
        ? Number(inProgress.mock_number)
        : null) ??
      firstStartable?.mockNumber ??
      availableMocks[0]?.mockNumber ??
      1;

    availableMocks = availableMocks.map((m) => ({
      ...m,
      isCurrent: m.mockNumber === currentMockNumber && m.status === "available",
    }));

    const history = completedMocks.map((m) => ({
      id: m.id,
      mockNumber: m.mock_number,
      date: m.completed_at ?? m.created_at,
      overallBand: m.overall_band,
      listening: parseSectionBand(m.section_scores, "listening"),
      reading: parseSectionBand(m.section_scores, "reading"),
      writing: parseSectionBand(m.section_scores, "writing"),
      speaking: parseSectionBand(m.section_scores, "speaking"),
      reviewStatus: reviewStatus(m),
    }));

    const lastCompleted = completedMocks[0] ?? null;

    return NextResponse.json({
      studentName,
      targetBand: readiness.targetBand ?? 6.5,
      readinessPercent: readiness.readinessPercent ?? 0,
      bandTrend: computeTrend(completedMocks),
      currentMockNumber,
      lastMock: lastCompleted
        ? {
            mockNumber: lastCompleted.mock_number,
            overallBand: lastCompleted.overall_band,
            completedAt: lastCompleted.completed_at,
            confidencePercent: null,
          }
        : null,
      availableMocks,
      history,
      access: {
        hasAllMocks: accessCtx.hasAllMocks,
        purchasedMockNumbers: accessCtx.purchasedMockNumbers,
        accessibleMockNumbers: accessCtx.accessibleMockNumbers,
        programme: "ielts_general",
        sellableCount: GT_MOCK_CATALOG.length,
      },
    });
  } catch (err) {
    console.error("[ielts-general/mock-exam/page-data]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load GT mock lobby" },
      { status: 500 }
    );
  }
}
