import type { SupabaseClient } from "@supabase/supabase-js";

function roundBand(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.round(n * 10) / 10;
}

export async function recordSpeakingBandForProfile(
  supabase: SupabaseClient,
  studentId: string,
  band: number,
  sessionId?: string | null
): Promise<void> {
  const score = roundBand(band);
  if (score == null || !studentId) return;

  try {
    const { error } = await supabase.from("band_score_history").insert({
      student_id: studentId,
      skill: "speaking",
      band_score: score,
      source: sessionId ? `speaking_session:${sessionId}` : "speaking_session",
      recorded_at: new Date().toISOString(),
    });

    if (error && !error.message?.includes("band_score_history")) {
      console.warn("[speaking/bandSync] band_score_history:", error.message);
    }
  } catch (err) {
    console.warn(
      "[speaking/bandSync] band_score_history threw:",
      err instanceof Error ? err.message : err
    );
  }
}

export async function resolveSpeakingBand(
  supabase: SupabaseClient,
  studentId: string
): Promise<number | null> {
  const [
    attemptsRes,
    progressRes,
    sessionsRes,
    historyRes,
  ] = await Promise.all([
    supabase
      .from("speaking_attempts")
      .select("band_overall")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("speaking_progress")
      .select("current_band, best_band")
      .eq("student_id", studentId)
      .maybeSingle(),
    supabase
      .from("speaking_sessions")
      .select("overall_band")
      .eq("student_id", studentId)
      .not("completed_at", "is", null)
      .not("overall_band", "is", null)
      .order("completed_at", { ascending: false })
      .limit(5),
    supabase
      .from("band_score_history")
      .select("band_score")
      .eq("student_id", studentId)
      .eq("skill", "speaking")
      .order("recorded_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const fromAttempts = (attemptsRes.data ?? [])
    .map((row) => roundBand(row.band_overall))
    .filter((v): v is number => v != null);

  if (fromAttempts.length) {
    return roundBand(fromAttempts.reduce((a, b) => a + b, 0) / fromAttempts.length);
  }

  const fromHistory = roundBand(historyRes.data?.band_score);
  if (fromHistory != null) return fromHistory;

  const fromProgress = roundBand(progressRes.data?.current_band);
  if (fromProgress != null) return fromProgress;

  const fromSessions = (sessionsRes.data ?? [])
    .map((row) => roundBand(row.overall_band))
    .filter((v): v is number => v != null);

  if (fromSessions.length) {
    return roundBand(fromSessions.reduce((a, b) => a + b, 0) / fromSessions.length);
  }

  return roundBand(progressRes.data?.best_band);
}
