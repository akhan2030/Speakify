import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { createClient } from "@supabase/supabase-js";

import { authOptions } from "@/lib/auth";

import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";

import { buildRecommendations } from "@/lib/course/recommendationEngine";

import { computeReadinessMeter } from "@/lib/course/readinessMeter";

import { normalizeAttemptRow } from "@/lib/mock-test/attemptSchema";



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

  if (attempt.report && typeof attempt.report === "object" && Object.keys(attempt.report).length > 0) {

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



    let targetBand = 7;

    let readinessPercent = 0;



    try {

      const profile = await fetchStudentProfile(studentId);

      const recommendations = buildRecommendations(profile);

      const meter = computeReadinessMeter(profile, recommendations);

      targetBand = meter.targetBand ?? profile.targetBand ?? 7;

      readinessPercent = meter.readinessPercent ?? 0;

    } catch {

      /* readiness optional */

    }



    if (!process.env.SUPABASE_SERVICE_KEY) {

      return NextResponse.json({

        studentName,

        targetBand,

        readinessPercent,

        mockCount: 0,

        bandTrend: "none",

        lastMock: null,

        history: [],

        availableMocks: [

          {

            id: null,

            mockNumber: 1,

            topic: "Full IELTS Academic Mock Exam",

            status: "available",

            overallBand: null,

            isCurrent: true,

          },

        ],

        currentMockNumber: 1,

      });

    }



    const supabase = getSupabase();



    const [mocksRes, generatedRes, inProgressRes] = await Promise.all([

      supabase

        .from("mock_test_attempts")

        .select(

          "id, mock_number, overall_band, completed_at, created_at, status, examiner_report, exam_content"

        )

        .eq("student_id", studentId)

        .order("created_at", { ascending: false }),

      supabase

        .from("generated_mock_tests")

        .select("id, mock_number, topic, status, generation_date, created_at")

        .eq("test_type", "full_mock")

        .in("status", ["published", "draft"])

        .order("mock_number", { ascending: true }),

      supabase

        .from("mock_test_attempts")

        .select("id, mock_number, status")

        .eq("student_id", studentId)

        .eq("status", "in_progress")

        .limit(1),

    ]);



    const allAttempts = (mocksRes.data ?? []).map(normalizeAttemptRow);

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
          .filter((n) => Number.isInteger(n) && n >= 1 && n <= 5)
      ),
    ];

    const accessCtx = await loadMockAccessContext(
      supabase,
      userRow ?? {
        id: studentId,
        role: session.user?.role ?? "student",
      },
      {
        hasAttemptHistory: allAttempts.length > 0,
        attemptedMockNumbers,
      }
    );

    if (!accessCtx.canAccessLobby) {
      return NextResponse.json(
        {
          error:
            "Purchase a mock exam or enroll in IELTS Accelerator to access mock exams.",
        },
        { status: 403 }
      );
    }

    const completedMocks = allAttempts.filter((m) => m.status === "completed");

    const attemptsByMockNumber = new Map();

    for (const attempt of allAttempts) {

      if (attempt.mock_number == null) continue;

      const existing = attemptsByMockNumber.get(attempt.mock_number);

      if (!existing || attempt.status === "completed") {

        attemptsByMockNumber.set(attempt.mock_number, attempt);

      }

    }



    const generated = generatedRes.data ?? [];

    let availableMocks = generated.map((row) => {

      const mockNumber = row.mock_number ?? row.test_number ?? row.id;

      const attempt = attemptsByMockNumber.get(mockNumber);

      const completed = attempt?.status === "completed";

      return {

        id: row.id,

        mockNumber,

        topic: row.topic ?? "Full IELTS Academic Mock Exam",

        generationDate: row.generation_date,

        status: completed ? "completed" : "available",

        overallBand: completed ? attempt.overall_band : null,

        attemptId: completed ? attempt.id : null,

        isCurrent: false,

      };

    });



    if (availableMocks.length === 0) {

      availableMocks = [

        {

          id: null,

          mockNumber: 1,

          topic: "Full IELTS Academic Mock Exam",

          generationDate: null,

          status: "available",

          overallBand: null,

          attemptId: null,

          isCurrent: true,

        },

      ];

    }



    availableMocks = availableMocks
      .filter((m) => accessCtx.visibleMockNumbers.includes(m.mockNumber))
      .map((m) => ({
        ...m,
        canStart: canStartMock(accessCtx, m.mockNumber),
      }));



    if (availableMocks.length === 0) {
      return NextResponse.json(
        { error: "No mock exams available for your account." },
        { status: 403 }
      );
    }



    const firstAvailable = availableMocks.find(
      (m) => m.status === "available" && m.canStart
    );

    const inProgress = inProgressRes.data?.[0];

    const currentMockNumber =

      inProgress?.mock_number ?? firstAvailable?.mockNumber ?? availableMocks[0]?.mockNumber ?? 1;



    availableMocks = availableMocks.map((m) => ({

      ...m,

      isCurrent: m.mockNumber === currentMockNumber && m.status === "available",

    }));



    const history = completedMocks.map((m) => ({

      id: m.id,

      mockNumber: m.mock_number,

      date: m.completed_at,

      overallBand: m.overall_band,

      listening: parseSectionBand(m.section_scores, "listening"),

      reading: parseSectionBand(m.section_scores, "reading"),

      writing: parseSectionBand(m.section_scores, "writing"),

      speaking: parseSectionBand(m.section_scores, "speaking"),

      reviewStatus: reviewStatus(m),

    }));



    const last = completedMocks[0] ?? null;

    const lastMock = last

      ? {

          attemptId: last.id,

          mockNumber: last.mock_number,

          overallBand: last.overall_band,

          completedAt: last.completed_at,

          confidencePercent:

            last.report?.confidencePercent ??

            last.report?.bandPrediction?.probabilityPercent ??

            null,

        }

      : null;



    return NextResponse.json({

      studentName,

      targetBand,

      readinessPercent,

      mockCount: completedMocks.length,

      bandTrend: computeTrend(completedMocks),

      lastMock,

      history,

      availableMocks,

      currentMockNumber,

      access: {
        hasAllMocks: accessCtx.hasAllMocks,
        purchasedMockNumbers: accessCtx.purchasedMockNumbers,
        accessibleMockNumbers: accessCtx.accessibleMockNumbers,
      },

    });

  } catch (err) {

    console.error("[student/mock-exam/page-data]", err);

    return NextResponse.json(

      { error: err instanceof Error ? err.message : "Failed to load page data" },

      { status: 500 }

    );

  }

}

