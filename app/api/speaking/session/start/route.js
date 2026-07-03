import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

function isMissingColumnError(error) {
  const message = String(error?.message || error?.details || "").toLowerCase();
  return (
    message.includes("part2_cue_card") ||
    message.includes("part2_transcript") ||
    message.includes("part3_questions") ||
    message.includes("schema cache") ||
    message.includes("could not find")
  );
}

export async function POST(req) {
  try {
    const { studentId, sessionType, programme } = await req.json();

    if (!studentId) {
      return NextResponse.json({ error: "studentId is required" }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 });
    }

    const supabase = getSupabase();

    const { count } = await supabase
      .from("speaking_sessions")
      .select("*", { count: "exact", head: true })
      .eq("student_id", studentId);

    const { data: recentCards } = await supabase
      .from("speaking_sessions")
      .select("cue_card_id")
      .eq("student_id", studentId)
      .order("started_at", { ascending: false })
      .limit(5);

    const recentCardIds =
      recentCards?.map((s) => s.cue_card_id).filter(Boolean) || [];

    const { PART2_CUE_CARDS } = await import("@/lib/speaking/examinerPrompt");
    const availableCards = PART2_CUE_CARDS.filter(
      (c) => !recentCardIds.includes(c.id)
    );
    const selectedCard =
      availableCards[Math.floor(Math.random() * availableCards.length)] ||
      PART2_CUE_CARDS[0];

    const baseRow = {
      student_id: studentId,
      session_number: (count || 0) + 1,
      session_type: sessionType || "practice",
      programme: programme || "ielts",
      cue_card_id: selectedCard.id,
      transcript: [],
    };

    const part2CueCard = {
      id: selectedCard.id,
      title: selectedCard.topic,
      prompt: selectedCard.prompt,
      bullets: selectedCard.bullets,
      closing: selectedCard.closing,
    };

    let { data: session, error } = await supabase
      .from("speaking_sessions")
      .insert({
        ...baseRow,
        part2_cue_card: part2CueCard,
      })
      .select()
      .single();

    // Production may not have run speaking_part3_columns.sql yet.
    if (error && isMissingColumnError(error)) {
      console.warn(
        "[speaking/session/start] part2 columns missing — insert without them. Run supabase/speaking_part3_columns.sql"
      );
      ({ data: session, error } = await supabase
        .from("speaking_sessions")
        .insert(baseRow)
        .select()
        .single());
    }

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      sessionId: session.id,
      sessionNumber: session.session_number,
      cueCard: selectedCard,
    });
  } catch (err) {
    console.error("[speaking/session/start]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start session" },
      { status: 500 }
    );
  }
}
