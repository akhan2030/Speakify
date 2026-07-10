import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { gtReadingRawToBand } from "@/lib/ielts-general/readingScore";
import { gtAttemptInsertRow } from "@/lib/ielts-general/attemptRows";
import { readSessionState } from "@/lib/mock-test/attemptSchema";
import { computeMockObjectiveFinish } from "@/lib/mock-test/serverFinish";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const attemptId = String(body.attemptId ?? "").trim();
  const mockNumber = Number(body.mockNumber) || 1;
  const completedAt = new Date().toISOString();

  if (!process.env.SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ ok: true, saved: false });
  }

  const supabase = getSupabase();
  let sectionScores = body.sectionScores ?? {};
  let overallBand = Number(body.overallBand);
  let readingSectionBreakdown = body.readingSectionBreakdown as
    | Record<string, { correct: number; total: number; band?: number }>
    | undefined;

  if (attemptId && !attemptId.startsWith("local_")) {
    const { data: attempt } = await supabase
      .from("mock_test_attempts")
      .select("exam_content, student_id")
      .eq("id", attemptId)
      .maybeSingle();

    if (attempt?.student_id && String(attempt.student_id) !== String(studentId)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (attempt?.exam_content) {
      const sessionState = readSessionState(attempt.exam_content);
      const computed = computeMockObjectiveFinish({
        answers: sessionState.answers ?? body.answers ?? {},
        examContent: attempt.exam_content,
        variant: "general",
      });
      sectionScores = computed.sectionScores;
      overallBand = Number(computed.overallBand);
      readingSectionBreakdown = computed.readingSectionBreakdown;
    }
  } else if (body.answers && body.examContent) {
    const computed = computeMockObjectiveFinish({
      answers: body.answers,
      examContent: body.examContent,
      variant: "general",
    });
    sectionScores = computed.sectionScores;
    overallBand = Number(computed.overallBand);
    readingSectionBreakdown = computed.readingSectionBreakdown;
  }

  const rows = [];

  const listeningBand = sectionScores?.listening?.band;
  const readingBand = sectionScores?.reading?.band;

  if (Number.isFinite(listeningBand)) {
    rows.push(
      gtAttemptInsertRow({
        studentId,
        skill: "listening",
        bandScore: listeningBand,
        accuracy: sectionScores.listening?.accuracy ?? null,
        mockNumber,
        completedAt,
      })
    );
  }

  if (Number.isFinite(readingBand)) {
    rows.push(
      gtAttemptInsertRow({
        studentId,
        skill: "reading",
        bandScore: readingBand,
        accuracy: sectionScores.reading?.accuracy ?? null,
        mockNumber,
        completedAt,
      })
    );
  }

  if (readingSectionBreakdown) {
    for (const sec of ["A", "B", "C"] as const) {
      const row = readingSectionBreakdown[sec];
      if (!row?.total) continue;
      rows.push(
        gtAttemptInsertRow({
          studentId,
          skill: `reading_section_${sec.toLowerCase()}`,
          bandScore: row.band ?? gtReadingRawToBand(row.correct, row.total || 1),
          accuracy: row.total ? row.correct / row.total : null,
          mockNumber,
          completedAt,
        })
      );
    }
  }

  if (Number.isFinite(overallBand)) {
    rows.push(
      gtAttemptInsertRow({
        studentId,
        skill: "mock",
        bandScore: overallBand,
        mockNumber,
        completedAt,
      })
    );
  }

  if (rows.length) {
    const { error } = await supabase.from("ielts_general_attempts").insert(rows);
    if (error && !error.message?.includes("does not exist")) {
      console.warn("[ielts-general/mock-exam/complete]", error.message);
    }
  }

  return NextResponse.json({
    ok: true,
    saved: rows.length > 0,
    overallBand,
    sectionScores,
    readingSectionBreakdown,
    serverComputed: true,
  });
}
