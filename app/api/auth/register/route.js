import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";
import {
  englishLevelToCefr,
  validateRegistration,
} from "@/lib/registration";
import { hashPassword } from "@/lib/password";
import { trackFromEnrollmentSlug } from "@/lib/accelerator/tracks";
import { normalizeSaudiPhone } from "@/lib/auth/phone";
import { issueRegistrationVerifications } from "@/lib/auth/verification";

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

async function insertUser(supabase, row) {
  const { data, error } = await supabase
    .from("users")
    .insert(row)
    .select("id")
    .single();

  if (!error) return { data, error: null };

  if (!error.message?.includes("column")) {
    return { data: null, error };
  }

  const minimal = {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role,
  };
  return supabase.from("users").insert(minimal).select("id").single();
}

export async function POST(request) {
  try {
    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json(
        { error: "Registration is not available. Please try again later." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const registrationSlug = String(body.registrationSlug ?? "").trim();
    const courseSlug = String(body.courseSlug ?? registrationSlug ?? "").trim();
    const acceleratorTrackParam = String(body.acceleratorTrack ?? body.track ?? "").trim();
    const purchasedTrack =
      trackFromEnrollmentSlug(acceleratorTrackParam) ??
      trackFromEnrollmentSlug(courseSlug);
    const validated = validateRegistration(body);
    if (!validated.ok) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const {
      fullName,
      email,
      phone,
      password,
      programType,
      englishLevel,
      targetBand,
      studyReason,
    } = validated.data;

    const supabase = getSupabase();

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const userId = randomUUID();
    const cefrLevel = englishLevel ? englishLevelToCefr(englishLevel) : null;
    const normalizedPhone = normalizeSaudiPhone(phone) ?? phone.trim();

    const isStepRegistration = registrationSlug === "step-test";
    const isIeltsGeneralRegistration =
      registrationSlug === "ielts-general" ||
      courseSlug === "ielts-general" ||
      courseSlug.startsWith("ielts-gt");
    const isIeltsAcademicRegistration =
      !isIeltsGeneralRegistration &&
      (programType === "ielts" ||
        registrationSlug === "ielts" ||
        (registrationSlug.startsWith("ielts-") &&
          !registrationSlug.startsWith("ielts-gt") &&
          registrationSlug !== "ielts-general") ||
        (courseSlug.startsWith("ielts-") &&
          !courseSlug.startsWith("ielts-gt") &&
          courseSlug !== "ielts-general"));

    const { data: newUser, error: userError } = await insertUser(supabase, {
      id: userId,
      name: fullName,
      email,
      password: passwordHash,
      role: "student",
      phone: normalizedPhone,
      email_verified_at: null,
      phone_verified_at: null,
      program_type: isIeltsGeneralRegistration
        ? "ielts_general"
        : isIeltsAcademicRegistration
          ? "ielts"
          : programType,
      ...(isStepRegistration
        ? { step_enrolled: true, enrolled_programs: ["step"] }
        : isIeltsGeneralRegistration
          ? {
              enrolled_programs: ["ielts_general"],
              ...(purchasedTrack
                ? { checkout_track: purchasedTrack, payment_status: "unpaid" }
                : {}),
            }
          : isIeltsAcademicRegistration
            ? {
                enrolled_programs: ["ielts"],
                ...(purchasedTrack
                  ? { checkout_track: purchasedTrack, payment_status: "unpaid" }
                  : {}),
              }
            : {}),
      ...(englishLevel ? { english_level: englishLevel } : {}),
      ...(targetBand ? { target_band: targetBand } : {}),
      ...(studyReason ? { study_reason: studyReason } : {}),
      ...(cefrLevel ? { cefr_level: cefrLevel } : {}),
    });

    if (userError) {
      if (userError.code === "23505" || userError.message?.includes("duplicate")) {
        return NextResponse.json(
          { error: "An account with this email already exists" },
          { status: 409 }
        );
      }
      console.error("[auth/register] users insert", userError);
      return NextResponse.json(
        { error: "Could not create account. Please try again." },
        { status: 500 }
      );
    }

    const { error: streakError } = await supabase.from("vocab_streaks").insert({
      student_id: newUser.id,
      current_streak: 0,
      longest_streak: 0,
    });

    if (streakError) {
      console.error("[auth/register] vocab_streaks insert", streakError);
      await supabase.from("users").delete().eq("id", newUser.id);
      const missingTable = streakError.message?.includes("vocab_streaks");
      return NextResponse.json(
        {
          error: missingTable
            ? "Registration setup incomplete. Run supabase/vocab_streaks_setup.sql."
            : "Could not finish registration. Please try again.",
        },
        { status: missingTable ? 503 : 500 }
      );
    }

    if (isIeltsAcademicRegistration && purchasedTrack) {
      const { error: trackUpdateError } = await supabase
        .from("users")
        .update({ checkout_track: purchasedTrack, payment_status: "unpaid" })
        .eq("id", newUser.id);
      if (trackUpdateError?.message?.includes("checkout_track")) {
        console.warn(
          "[auth/register] users.checkout_track column missing — run supabase/payment_setup.sql"
        );
      } else if (trackUpdateError) {
        console.warn("[auth/register] checkout_track update:", trackUpdateError.message);
      }
    }

    try {
      await issueRegistrationVerifications(
        supabase,
        {
          id: newUser.id,
          name: fullName,
          email,
          phone: normalizedPhone,
        },
        request
      );
    } catch (verifyErr) {
      console.error("[auth/register] verification issue", verifyErr);
    }

    return NextResponse.json({
      success: true,
      userId: newUser.id,
      name: fullName,
      programType,
      requiresVerification: true,
    });
  } catch (err) {
    console.error("[auth/register]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Registration failed" },
      { status: 500 }
    );
  }
}
