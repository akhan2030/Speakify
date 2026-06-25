import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  extractExaminerReport,
  generateMockTestReport,
  isFullReport,
} from "@/lib/mock-test/reportGenerator";

export const runtime = "nodejs";
export const maxDuration = 120;

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

export async function POST(request, { params }) {
  try {
    const attemptId = String(params?.id ?? "").trim();
    if (!attemptId) {
      return NextResponse.json({ error: "Attempt id required" }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));

    if (attemptId.startsWith("local_")) {
      const report = await generateMockTestReport(
        body.answers ?? {},
        body.transcripts ?? {},
        {
          examContent: body.examContent ?? null,
          studentName: body.studentName ?? "Candidate",
          completedAt: body.completedAt ?? new Date().toISOString(),
        }
      );
      return NextResponse.json({
        report,
        examinerReport: extractExaminerReport(report),
        cached: false,
        overallBand: report.overallBand,
      });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const supabase = getSupabase();
    const { data: attempt, error } = await supabase
      .from("mock_test_attempts")
      .select("*")
      .eq("id", attemptId)
      .maybeSingle();

    if (error) throw error;
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (isFullReport(attempt.report)) {
      return NextResponse.json({
        report: attempt.report,
        examinerReport: attempt.examiner_report ?? extractExaminerReport(attempt.report),
        cached: true,
        overallBand: attempt.overall_band,
        studentName: attempt.report.studentName,
        completedAt: attempt.completed_at ?? attempt.report.completedAt,
      });
    }

    const answers =
      typeof attempt.answers === "object" && attempt.answers ? attempt.answers : {};
    const transcripts =
      typeof attempt.transcripts === "object" && attempt.transcripts
        ? attempt.transcripts
        : {};
    const examContent =
      attempt.report?.examContent ?? attempt.exam_content ?? null;

    const report = await generateMockTestReport(answers, transcripts, {
      examContent,
      studentName: body.studentName ?? attempt.student_name ?? "Candidate",
      completedAt: attempt.completed_at ?? new Date().toISOString(),
    });

    const examinerReport = extractExaminerReport(report);

    const sectionScores = {
      listening: { band: report.skills.listening.band },
      reading: { band: report.skills.reading.band },
      writing: { band: report.skills.writing.band },
      speaking: { band: report.skills.speaking.band },
    };

    await supabase
      .from("mock_test_attempts")
      .update({
        overall_band: report.overallBand,
        section_scores: sectionScores,
        report,
        examiner_report: examinerReport,
        status: "completed",
        completed_at: attempt.completed_at ?? new Date().toISOString(),
      })
      .eq("id", attemptId);

    return NextResponse.json({
      report,
      examinerReport,
      cached: false,
      overallBand: report.overallBand,
    });
  } catch (err) {
    console.error("[mock-test/evaluate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Evaluation failed" },
      { status: 500 }
    );
  }
}

export async function GET(_request, { params }) {
  try {
    const attemptId = String(params?.id ?? "").trim();
    if (!attemptId || attemptId.startsWith("local_")) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const supabase = getSupabase();
    const { data: attempt, error } = await supabase
      .from("mock_test_attempts")
      .select("report, examiner_report, overall_band, status, completed_at, student_id")
      .eq("id", attemptId)
      .maybeSingle();

    if (error) throw error;
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    return NextResponse.json({
      report: isFullReport(attempt.report) ? attempt.report : null,
      examinerReport: attempt.examiner_report ?? null,
      overallBand: attempt.overall_band,
      status: attempt.status,
      completedAt: attempt.completed_at,
      needsEvaluation: !isFullReport(attempt.report),
    });
  } catch (err) {
    console.error("[mock-test/evaluate] GET", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load report" },
      { status: 500 }
    );
  }
}
