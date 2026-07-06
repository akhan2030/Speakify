import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { gtReadingRawToBand } from "@/lib/ielts-general/readingScore";

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
  const sectionScores = body.sectionScores ?? {};
  const overallBand = Number(body.overallBand);
  const readingSectionBreakdown = body.readingSectionBreakdown as
    | Record<string, { correct: number; total: number; band?: number }>
    | undefined;
  const mockNumber = Number(body.mockNumber) || 1;
  const completedAt = new Date().toISOString();

  if (!process.env.SUPABASE_SERVICE_KEY) {
    return NextResponse.json({ ok: true, saved: false });
  }

  const supabase = getSupabase();
  const rows = [];

  const listeningBand = sectionScores?.listening?.band;
  const readingBand = sectionScores?.reading?.band;

  if (Number.isFinite(listeningBand)) {
    rows.push({
      student_id: studentId,
      skill: "listening",
      band_score: listeningBand,
      accuracy: sectionScores.listening?.accuracy ?? null,
      completed_at: completedAt,
      status: "completed",
      mock_number: mockNumber,
    });
  }

  if (Number.isFinite(readingBand)) {
    rows.push({
      student_id: studentId,
      skill: "reading",
      band_score: readingBand,
      accuracy: sectionScores.reading?.accuracy ?? null,
      completed_at: completedAt,
      status: "completed",
      mock_number: mockNumber,
    });
  }

  if (readingSectionBreakdown) {
    for (const sec of ["A", "B", "C"] as const) {
      const row = readingSectionBreakdown[sec];
      if (!row?.total) continue;
      rows.push({
        student_id: studentId,
        skill: `reading_section_${sec.toLowerCase()}`,
        band_score: row.band ?? gtReadingRawToBand(row.correct, row.total),
        accuracy: row.total ? row.correct / row.total : null,
        completed_at: completedAt,
        status: "completed",
        mock_number: mockNumber,
      });
    }
  }

  if (Number.isFinite(overallBand)) {
    rows.push({
      student_id: studentId,
      skill: "mock",
      band_score: overallBand,
      completed_at: completedAt,
      status: "completed",
      mock_number: mockNumber,
    });
  }

  if (rows.length) {
    const { error } = await supabase.from("ielts_general_attempts").insert(rows);
    if (error && !error.message?.includes("does not exist")) {
      console.warn("[ielts-general/mock-exam/complete]", error.message);
    }
  }

  return NextResponse.json({ ok: true, saved: rows.length > 0 });
}
