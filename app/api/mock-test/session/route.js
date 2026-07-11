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
    const generatedMockTestId =
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
      .select("id, mock_number, created_at, exam_content")
      .eq("student_id", studentId)
      .eq("status", "in_progress")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const inProgressVariant =
      inProgress?.exam_content?.examVariant === "general" ? "general" : "academic";

    if (inProgress?.id && inProgressVariant === examVariant) {
      return NextResponse.json({
        attemptId: inProgress.id,
        studentId,
        startedAt: inProgress.created_at ?? null,
        mockNumber: inProgress.mock_number ?? mockNumber,
        resumed: true,
      });
    }

    let examContent = { examVariant, mockNumber };
    if (generatedMockTestId) {
      const { data: mockRow } = await supabase
        .from("generated_mock_tests")
        .select("*")
        .eq("id", generatedMockTestId)
        .maybeSingle();
      if (mockRow) {
        const { resolveAcademicMockBundle } = await import(
          "@/lib/mock-test/resolveFullMockContent"
        );
        const bundle = resolveAcademicMockBundle({
          ...mockRow,
          generatedMockTestId: mockRow.id,
        });
        examContent = {
          examVariant: "academic",
          mockNumber: bundle.mockNumber,
          generatedMockTestId: mockRow.id,
          topic: bundle.topic,
          reading: bundle.reading.reading,
          listeningParts: bundle.listening,
          writingTasks: bundle.writing,
          speakingParts: bundle.speaking,
          resolvedAt: new Date().toISOString(),
        };
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
