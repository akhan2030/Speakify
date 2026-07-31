import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  buildAttemptInsertRow,
  formatSupabaseError,
  mergeSessionIntoExamContent,
  readSessionState,
} from "@/lib/mock-test/attemptSchema";
import { verifyMockAttemptOwnership } from "@/lib/mock-test/ownership";

export const runtime = "nodejs";

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getSupabase() {
  return createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function resolveStudentId(bodyStudentId) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return String(session.user.id);
  const guest = String(bodyStudentId ?? "").trim();
  if (guest) return guest;
  return `guest_${crypto.randomUUID()}`;
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const studentId = await resolveStudentId(body.studentId);
    const planId = String(body.planId ?? "").trim() || null;
    const mockNumber = Number(body.mockNumber) || null;
    const examVariant =
      String(body.examVariant ?? "").trim().toLowerCase() === "general"
        ? "general"
        : "academic";
    let generatedMockTestId =
      body.generatedMockTestId != null && body.generatedMockTestId !== ""
        ? Number(body.generatedMockTestId) || null
        : null;

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({
        attemptId: `local_${crypto.randomUUID()}`,
        studentId,
        mockNumber,
        localOnly: true,
      });
    }

    const supabase = getSupabase();

    const { data: inProgress } = await supabase
      .from("mock_test_attempts")
      .select("id, mock_number, created_at, exam_content, student_id")
      .eq("student_id", studentId)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const inProgressVariant =
      inProgress?.exam_content?.examVariant === "general" ? "general" : "academic";

    if (inProgress?.id && inProgressVariant === examVariant) {
      const authSession = await getServerSession(authOptions);
      if (
        authSession?.user?.id &&
        String(inProgress.student_id ?? studentId) !== String(authSession.user.id)
      ) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.json({
        attemptId: inProgress.id,
        studentId,
        startedAt: inProgress.created_at ?? null,
        mockNumber: inProgress.mock_number ?? mockNumber,
        resumed: true,
      });
    }

    if (examVariant === "academic" && mockNumber) {
      const authSession = await getServerSession(authOptions);
      if (!authSession?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      const { data: userRow } = await supabase
        .from("users")
        .select(
          "id, role, payment_status, payment_comped_until, enrolled_programs, program_selected, purchase_intent"
        )
        .eq("id", authSession.user.id)
        .maybeSingle();

      const { loadMockAccessContext, canStartMock } = await import(
        "@/lib/mock-test/loadMockAccessContext"
      );

      const accessCtx = await loadMockAccessContext(
        supabase,
        userRow ?? { id: authSession.user.id, role: authSession.user.role ?? "student" }
      );

      if (!canStartMock(accessCtx, mockNumber)) {
        return NextResponse.json(
          { error: "Purchase this mock exam to start a new attempt." },
          { status: 403 }
        );
      }
    }

    let examContent = { examVariant, mockNumber };
    if (examVariant === "academic" && (generatedMockTestId || mockNumber)) {
      let mockRow = null;
      if (generatedMockTestId) {
        const { data } = await supabase
          .from("generated_mock_tests")
          .select("*")
          .eq("id", generatedMockTestId)
          .maybeSingle();
        mockRow = data;
      }
      if (!mockRow && mockNumber) {
        const { data } = await supabase
          .from("generated_mock_tests")
          .select("*")
          .eq("test_type", "full_mock")
          .eq("mock_number", mockNumber)
          .in("status", ["published", "draft"])
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        mockRow = data;
      }

      const { resolveAcademicMockBundle } = await import(
        "@/lib/mock-test/resolveFullMockContent"
      );
      const { getAcademicMockByNumber } = await import(
        "@/lib/mock-test/academicMockCatalog"
      );
      const catalog = getAcademicMockByNumber(mockNumber);
      const bundle = resolveAcademicMockBundle(
        mockRow
          ? { ...mockRow, generatedMockTestId: mockRow.id }
          : {
              mock_number: mockNumber,
              topic: catalog?.theme ?? `Mock ${mockNumber}`,
            }
      );
      examContent = {
        examVariant: "academic",
        mockNumber: bundle.mockNumber,
        generatedMockTestId: bundle.generatedMockTestId,
        topic: bundle.topic || catalog?.theme || null,
        reading: bundle.reading.reading,
        listeningParts: bundle.listening,
        writingTasks: bundle.writing,
        speakingParts: bundle.speaking,
        resolvedAt: new Date().toISOString(),
      };
      if (!generatedMockTestId && bundle.generatedMockTestId) {
        generatedMockTestId = bundle.generatedMockTestId;
      }
    }

    const insertRow = buildAttemptInsertRow({
      studentId,
      mockNumber,
      planId,
      generatedMockTestId,
      examContent,
    });

    const { data, error } = await supabase
      .from("mock_test_attempts")
      .insert(insertRow)
      .select("id, student_id, created_at, mock_number")
      .single();

    if (error) throw error;

    return NextResponse.json({
      attemptId: data.id,
      studentId: data.student_id,
      startedAt: data.created_at,
      mockNumber: data.mock_number,
    });
  } catch (err) {
    console.error("[mock-test/session] POST", err);
    return NextResponse.json(
      { error: formatSupabaseError(err, "Failed to start mock test") },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const attemptId = String(body.attemptId ?? "").trim();

    if (!attemptId) {
      return NextResponse.json({ error: "attemptId required" }, { status: 400 });
    }

    if (attemptId.startsWith("local_") || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ ok: true, localOnly: true });
    }

    const supabase = getSupabase();
    const ownership = await verifyMockAttemptOwnership(
      supabase,
      attemptId,
      session.user.id,
      "exam_content, status"
    );
    if (!ownership.ok) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status });
    }

    const sessionPatch = {};

    if (body.answers && typeof body.answers === "object") {
      sessionPatch.answers = body.answers;
    }
    if (Array.isArray(body.flagged)) {
      sessionPatch.flagged = body.flagged;
    }
    if (body.currentSection) {
      sessionPatch.currentSection = String(body.currentSection);
    }
    if (body.transcripts && typeof body.transcripts === "object") {
      sessionPatch.transcripts = body.transcripts;
    }
    if (body.sectionScores && typeof body.sectionScores === "object") {
      sessionPatch.sectionScores = body.sectionScores;
    }

    if (Object.keys(sessionPatch).length === 0) {
      return NextResponse.json({ ok: true });
    }

    const { data: existing, error: loadError } = await supabase
      .from("mock_test_attempts")
      .select("exam_content")
      .eq("id", attemptId)
      .maybeSingle();

    if (loadError) throw loadError;
    if (!existing) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    const exam_content = mergeSessionIntoExamContent(existing.exam_content, sessionPatch);

    const { error } = await supabase
      .from("mock_test_attempts")
      .update({ exam_content })
      .eq("id", attemptId);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[mock-test/session] PATCH", err);
    return NextResponse.json(
      { error: formatSupabaseError(err, "Failed to save progress") },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const attemptId = String(body.attemptId ?? "").trim();

    if (!attemptId) {
      return NextResponse.json({ error: "attemptId required" }, { status: 400 });
    }

    if (attemptId.startsWith("local_") || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ ok: true, localOnly: true });
    }

    const supabase = getSupabase();
    const ownership = await verifyMockAttemptOwnership(
      supabase,
      attemptId,
      session.user.id,
      "exam_content, programme, status"
    );
    if (!ownership.ok) {
      return NextResponse.json({ error: ownership.error }, { status: ownership.status });
    }

    const existing = ownership.attempt;

    const answers =
      typeof body.answers === "object" && body.answers ? body.answers : {};
    const transcripts =
      typeof body.transcripts === "object" && body.transcripts ? body.transcripts : {};

    const examContent = existing?.exam_content ?? body.examContent ?? null;
    const variant =
      body.examVariant === "general" || existing?.programme === "ielts_general"
        ? "general"
        : "academic";

    const { computeMockObjectiveFinish } = await import("@/lib/mock-test/serverFinish");
    const computed = computeMockObjectiveFinish({
      answers,
      examContent,
      variant,
    });

    const sessionPatch = {
      currentSection: "speaking",
      answers,
      flagged: Array.isArray(body.flagged) ? body.flagged : [],
      sectionScores: computed.sectionScores,
      transcripts,
      report: body.report ?? {},
      certificateMeta: {
        examReference: body.examReference ?? null,
        examDateTime: body.examDateTime ?? null,
        studentName: body.studentName ?? null,
        mockNumber: body.mockNumber ?? null,
        examVariant: body.examVariant ?? variant,
        completedAt: body.completedAt ?? new Date().toISOString(),
      },
    };

    const payload = {
      status: "completed",
      completed_at: new Date().toISOString(),
      overall_band: computed.overallBand,
      section_scores: computed.sectionScores,
      answers,
      transcripts,
      exam_content: mergeSessionIntoExamContent(existing?.exam_content, sessionPatch),
    };

    const { error } = await supabase
      .from("mock_test_attempts")
      .update(payload)
      .eq("id", attemptId);

    if (error) throw error;
    return NextResponse.json({
      ok: true,
      overallBand: computed.overallBand,
      sectionScores: computed.sectionScores,
      readingSectionBreakdown: computed.readingSectionBreakdown,
      serverComputed: true,
    });
  } catch (err) {
    console.error("[mock-test/session] PUT", err);
    return NextResponse.json(
      { error: formatSupabaseError(err, "Failed to complete mock test") },
      { status: 500 }
    );
  }
}
