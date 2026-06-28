import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { STEP_SECTIONS, type StepSectionId } from "@/lib/step/examModel";
import { getStepSupabase } from "@/lib/step/enrollmentService";
import {
  getSampleQuestions,
  normalizeStepQuestions,
} from "@/lib/step/sampleQuestions";

const VALID_SECTIONS = new Set(Object.keys(STEP_SECTIONS));

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section") as StepSectionId | null;
  const count = Math.min(10, Math.max(5, Number(searchParams.get("count") ?? 5)));

  if (!section || !VALID_SECTIONS.has(section)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  let questions = getSampleQuestions(section, count);

  try {
    const supabase = getStepSupabase();
    const { data: bankRow } = await supabase
      .from("step_practice_bank")
      .select("content")
      .eq("section", section)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!bankRow?.content) {
      const { data: draftRow } = await supabase
        .from("step_practice_bank")
        .select("content")
        .eq("section", section)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (draftRow?.content) {
        const fromBank = normalizeStepQuestions(draftRow.content);
        if (fromBank.length > 0) questions = fromBank.slice(0, count);
      }
    } else {
      const fromBank = normalizeStepQuestions(bankRow.content);
      if (fromBank.length > 0) questions = fromBank.slice(0, count);
    }
  } catch {
    // fall back to embedded samples
  }

  const spec = STEP_SECTIONS[section];

  return NextResponse.json({
    section,
    label: spec.label,
    weightPercent: spec.weightPercent,
    timeLimitMinutes: Math.ceil((count * spec.secondsPerQuestion) / 60),
    questions: questions.map((q, i) => ({
      ...q,
      number: i + 1,
    })),
  });
}
