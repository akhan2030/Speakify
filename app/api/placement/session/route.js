import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { onboardingToDbRow } from "@/lib/placement/onboarding";

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

const RETAKE_LOCK_MS = 7 * 24 * 60 * 60 * 1000;

const DEMO_BYPASS_EMAILS = new Set([
  "admin@speakify.com",
  "student@speakify.com",
]);

function isDemoBypassEmail(email) {
  if (!email || typeof email !== "string") return false;
  return DEMO_BYPASS_EMAILS.has(email.trim().toLowerCase());
}

async function resolveStudentEmail(request, studentId, supabase) {
  const session = await getServerSession(authOptions);
  const sessionEmail = session?.user?.email?.trim();
  if (sessionEmail) return sessionEmail;

  if (supabase && isRealStudentId(studentId)) {
    const { data: user } = await supabase
      .from("users")
      .select("email")
      .eq("id", studentId)
      .maybeSingle();
    if (user?.email) return String(user.email).trim();
  }

  if (supabase && studentId) {
    const { data: attempt } = await supabase
      .from("placement_attempts")
      .select("email")
      .eq("student_id", studentId)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (attempt?.email) return String(attempt.email).trim();
  }

  return null;
}

async function resolveStudentId(bodyStudentId) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return String(session.user.id);
  const guest = String(bodyStudentId ?? "").trim();
  if (guest) return guest;
  return `guest_${crypto.randomUUID()}`;
}

async function resolveStudentIdFromRequest(request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) return String(session.user.id);
  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("studentId")?.trim();
  if (fromQuery) return fromQuery;
  return null;
}

function isRealStudentId(studentId) {
  return studentId && !String(studentId).startsWith("guest_");
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const studentId = await resolveStudentId(body.studentId);

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({
        attemptId: `local_${crypto.randomUUID()}`,
        studentId,
        localOnly: true,
      });
    }

    const onboarding = body.onboarding ?? body.profile ?? null;
    let profileRow = {};

    if (onboarding && typeof onboarding === "object") {
      profileRow = onboardingToDbRow(onboarding);
      if (!profileRow.full_name) {
        return NextResponse.json(
          { error: "Full name is required." },
          { status: 400 }
        );
      }
      if (!profileRow.email) {
        return NextResponse.json(
          { error: "Email is required." },
          { status: 400 }
        );
      }
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("placement_attempts")
      .insert({
        student_id: studentId,
        status: "in_progress",
        ...profileRow,
      })
      .select("id, student_id, started_at")
      .single();

    if (error) throw error;

    return NextResponse.json({
      attemptId: data.id,
      studentId: data.student_id,
      startedAt: data.started_at,
    });
  } catch (err) {
    console.error("[placement/session] POST", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to start session" },
      { status: 500 }
    );
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const attemptId = String(body.attemptId ?? "").trim();
    const questionId = String(body.questionId ?? "").trim();

    if (!attemptId || !questionId) {
      return NextResponse.json(
        { error: "attemptId and questionId required" },
        { status: 400 }
      );
    }

    if (attemptId.startsWith("local_") || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ ok: true, localOnly: true });
    }

    const supabase = getSupabase();
    const { error } = await supabase.from("placement_answers").insert({
      attempt_id: attemptId,
      question_id: questionId,
      section: String(body.section ?? ""),
      band_level: Number(body.band) || null,
      student_answer: String(body.studentAnswer ?? ""),
      correct: Boolean(body.correct),
      time_taken: Math.max(0, Number(body.timeTaken) || 0),
    });

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[placement/session] PATCH", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save answer" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    if (url.searchParams.get("check") !== "true") {
      return NextResponse.json({ error: "Use ?check=true" }, { status: 400 });
    }

    const studentId = await resolveStudentIdFromRequest(request);
    if (!studentId) {
      return NextResponse.json({ locked: false });
    }

    const supabase =
      process.env.SUPABASE_SERVICE_KEY && getSupabaseUrl()
        ? getSupabase()
        : null;

    const studentEmail = await resolveStudentEmail(request, studentId, supabase);
    if (isDemoBypassEmail(studentEmail)) {
      return NextResponse.json({ locked: false });
    }

    if (!supabase) {
      return NextResponse.json({ locked: false });
    }

    const { data: latest, error } = await supabase
      .from("placement_attempts")
      .select("id, completed_at, overall_band, cefr_level")
      .eq("student_id", studentId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!latest?.completed_at) {
      return NextResponse.json({ locked: false });
    }

    const completedAt = new Date(latest.completed_at);
    const retakeAvailableAt = new Date(completedAt.getTime() + RETAKE_LOCK_MS);
    const now = new Date();

    if (now >= retakeAvailableAt) {
      return NextResponse.json({ locked: false });
    }

    return NextResponse.json({
      locked: true,
      completedAt: latest.completed_at,
      completedAtLabel: completedAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      retakeAvailableAt: retakeAvailableAt.toISOString(),
      retakeAvailableAtLabel: retakeAvailableAt.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      overallBand:
        latest.overall_band != null ? Number(latest.overall_band) : null,
      cefrLevel: latest.cefr_level ?? null,
      attemptId: latest.id,
      msRemaining: Math.max(0, retakeAvailableAt.getTime() - now.getTime()),
    });
  } catch (err) {
    console.error("[placement/session] GET", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to check session" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const attemptId = String(body.attemptId ?? "").trim();

    if (!attemptId) {
      return NextResponse.json({ error: "attemptId required" }, { status: 400 });
    }

    if (attemptId.startsWith("local_") || !process.env.SUPABASE_SERVICE_KEY) {
      return NextResponse.json({ ok: true, localOnly: true });
    }

    const supabase = getSupabase();
    const { computePlacementFinishFromDb } = await import(
      "@/lib/placement/serverFinish"
    );

    let result;
    try {
      result = await computePlacementFinishFromDb(supabase, attemptId);
    } catch (computeErr) {
      console.warn(
        "[placement/session] server finish failed, using client payload:",
        computeErr instanceof Error ? computeErr.message : computeErr
      );
      result = {
        overallBand: Number(body.overallBand) || null,
        cefr: String(body.cefr ?? "").trim(),
        skillBands: body.skillBands ?? {},
        weakAreas: body.weakAreas ?? [],
        strongAreas: body.strongAreas ?? [],
        totalQuestions: Number(body.totalQuestions) || 0,
        confidenceScore: Number(body.confidenceScore) || 0,
      };
    }

    const cefrLevel = String(result.cefr ?? "").trim();

    const payload = {
      completed_at: new Date().toISOString(),
      overall_band: Number(result.overallBand) || null,
      cefr_level: cefrLevel,
      skill_bands: result.skillBands ?? {},
      weak_areas: result.weakAreas ?? [],
      strong_areas: result.strongAreas ?? [],
      total_questions: Number(result.totalQuestions) || 0,
      confidence_score: Number(result.confidenceScore) || 0,
      status: "completed",
    };

    const { data: attempt, error: fetchError } = await supabase
      .from("placement_attempts")
      .select("student_id")
      .eq("id", attemptId)
      .maybeSingle();

    if (fetchError) throw fetchError;

    const { error } = await supabase
      .from("placement_attempts")
      .update(payload)
      .eq("id", attemptId);

    if (error) throw error;

    const studentId = attempt?.student_id;
    if (isRealStudentId(studentId) && cefrLevel) {
      const { error: userError } = await supabase
        .from("users")
        .update({
          cefr_level: cefrLevel,
          placement_test_completed: true,
        })
        .eq("id", studentId);

      if (userError) {
        console.error("[placement/session] PUT user update", userError);
      }
    }

    return NextResponse.json({
      ok: true,
      overallBand: payload.overall_band,
      cefr: cefrLevel,
      skillBands: payload.skill_bands,
      weakAreas: payload.weak_areas,
      strongAreas: payload.strong_areas,
      totalQuestions: payload.total_questions,
      confidenceScore: payload.confidence_score,
      serverComputed: true,
    });
  } catch (err) {
    console.error("[placement/session] PUT", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to complete session" },
      { status: 500 }
    );
  }
}
