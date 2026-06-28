import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { STEP_SECTIONS, type StepSectionId } from "@/lib/step/examModel";
import {
  parseBankContent,
  passagePlainText,
  pickRandom,
  stripAnswerKey,
} from "@/lib/step/bankContent";
import { getStepSupabase } from "@/lib/step/enrollmentService";
import {
  getFallbackCompositionalBatch,
  getFallbackListeningRecording,
  getFallbackReadingPassage,
  getFallbackStructureBatch,
} from "@/lib/step/fallbackQuestions";
import type { StepCompositionalItem, StepStructureItem } from "@/lib/step/types";
import { SECTION_POINT_MAX } from "@/lib/step/practiceScoreUtils";

const VALID_SECTIONS = new Set(Object.keys(STEP_SECTIONS));
const MIN_BANK_QUESTIONS = 5;

function shuffleRows<T>(rows: T[]): T[] {
  const copy = [...rows];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function countQuestionsInContent(section: StepSectionId, content: unknown): number {
  const parsed = parseBankContent(section, content);
  if (!parsed) return 0;
  if (parsed.kind === "reading") {
    return parsed.passages.reduce((n, p) => n + (p.questions?.length ?? 0), 0);
  }
  if (parsed.kind === "listening") {
    return parsed.recordings.reduce((n, r) => n + (r.questions?.length ?? 0), 0);
  }
  return parsed.items.length;
}

async function fetchTodayProgress(studentId: string, section: StepSectionId) {
  const supabase = getStepSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data: todayRow } = await supabase
    .from("step_section_scores")
    .select("questions_attempted, questions_correct, estimated_score")
    .eq("student_id", studentId)
    .eq("session_date", today)
    .eq("section", section)
    .maybeSingle();

  const { data: latestRow } = await supabase
    .from("step_section_scores")
    .select("estimated_score")
    .eq("student_id", studentId)
    .eq("section", section)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const maxPoints = SECTION_POINT_MAX[section];
  const rawEst = latestRow?.estimated_score ?? todayRow?.estimated_score ?? 0;

  return {
    questionsAttemptedToday: todayRow?.questions_attempted ?? 0,
    questionsCorrectToday: todayRow?.questions_correct ?? 0,
    estimatedSectionScore: Math.min(maxPoints, rawEst),
    sectionMax: maxPoints,
  };
}

async function loadBankRows(section: StepSectionId, limit: number) {
  const supabase = getStepSupabase();
  const { data: published } = await supabase
    .from("step_practice_bank")
    .select("id, title, content, question_count")
    .eq("section", section)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(limit * 3);

  let rows = published ?? [];
  if (rows.length === 0) {
    const { data: drafts } = await supabase
      .from("step_practice_bank")
      .select("id, title, content, question_count")
      .eq("section", section)
      .order("created_at", { ascending: false })
      .limit(limit * 3);
    rows = drafts ?? [];
  }

  return shuffleRows(rows);
}

function buildReadingResponse(
  bankRows: { content: unknown; title?: string }[],
  passageOffset: number
) {
  for (const row of bankRows) {
    const parsed = parseBankContent("reading", row.content);
    if (!parsed || parsed.kind !== "reading" || parsed.passages.length === 0) continue;

    const passage = pickRandom(parsed.passages, 1)[0];
    const questions = passage.questions ?? [];
    if (questions.length >= MIN_BANK_QUESTIONS) {
      return {
        source: "bank" as const,
        passage: {
          id: passage.id,
          title: row.title ?? "Reading Passage",
          text: passagePlainText(passage),
          paragraphs: passage.paragraphs,
        },
        questions: stripAnswerKey(questions),
      };
    }
  }

  const fallback = getFallbackReadingPassage(passageOffset);
  const questions = fallback.questions ?? [];
  return {
    source: "fallback" as const,
    passage: {
      id: fallback.id,
      title: "STEP Reading Practice",
      text: passagePlainText(fallback),
      paragraphs: fallback.paragraphs,
    },
    questions: stripAnswerKey(questions),
  };
}

function buildStructureResponse(bankRows: { content: unknown }[], limit: number) {
  const collected: StepStructureItem[] = [];

  for (const row of bankRows) {
    const parsed = parseBankContent("structure", row.content);
    if (!parsed || parsed.kind !== "structure") continue;
    collected.push(...parsed.items);
    if (collected.length >= limit) break;
  }

  const items =
    collected.length >= MIN_BANK_QUESTIONS
      ? pickRandom(collected, limit)
      : getFallbackStructureBatch(limit);

  return {
    source: collected.length >= MIN_BANK_QUESTIONS ? ("bank" as const) : ("fallback" as const),
    questions: stripAnswerKey(items),
  };
}

function buildListeningResponse(
  bankRows: { content: unknown }[],
  recordingOffset: number
) {
  for (const row of bankRows) {
    const parsed = parseBankContent("listening", row.content);
    if (!parsed || parsed.kind !== "listening" || parsed.recordings.length === 0) continue;

    const recording = parsed.recordings[0];
    const questions = recording.questions ?? [];
    if (questions.length >= 3) {
      return {
        source: "bank" as const,
        recording: {
          id: recording.id,
          recordingNumber: recording.recordingNumber,
          transcript: recording.transcript,
          setting: recording.setting,
          speakers: recording.speakers,
        },
        questions: stripAnswerKey(questions),
      };
    }
  }

  const fallback = getFallbackListeningRecording(recordingOffset);
  return {
    source: "fallback" as const,
    recording: {
      id: fallback.id,
      recordingNumber: fallback.recordingNumber,
      transcript: fallback.transcript,
      setting: fallback.setting,
      speakers: fallback.speakers,
    },
    questions: stripAnswerKey(fallback.questions),
  };
}

function buildCompositionalResponse(bankRows: { content: unknown }[], limit: number) {
  const collected: StepCompositionalItem[] = [];

  for (const row of bankRows) {
    const parsed = parseBankContent("compositional_analysis", row.content);
    if (!parsed || parsed.kind !== "compositional_analysis") continue;
    collected.push(...parsed.items);
    if (collected.length >= limit) break;
  }

  const items =
    collected.length >= MIN_BANK_QUESTIONS
      ? pickRandom(collected, limit)
      : getFallbackCompositionalBatch(limit);

  return {
    source: collected.length >= MIN_BANK_QUESTIONS ? ("bank" as const) : ("fallback" as const),
    questions: stripAnswerKey(items),
  };
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.id;
  if (!studentId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section") as StepSectionId | null;
  const limit = Math.min(20, Math.max(1, Number(searchParams.get("limit") ?? 10)));
  const phase = Number(searchParams.get("phase") ?? 1);
  const passageOffset = Number(searchParams.get("passageOffset") ?? 0);
  const recordingOffset = Number(searchParams.get("recordingOffset") ?? 0);

  if (!section || !VALID_SECTIONS.has(section)) {
    return NextResponse.json({ error: "Invalid section" }, { status: 400 });
  }

  try {
    const progress = await fetchTodayProgress(studentId, section);
    const spec = STEP_SECTIONS[section];
    const bankRows = await loadBankRows(section, limit);

    let payload: Record<string, unknown> = {
      section,
      label: spec.label,
      weightPercent: spec.weightPercent,
      phase,
      progress,
      bankQuestionCount: bankRows.reduce(
        (n, r) => n + countQuestionsInContent(section, r.content),
        0
      ),
    };

    if (section === "reading") {
      payload = { ...payload, ...buildReadingResponse(bankRows, passageOffset) };
    } else if (section === "structure") {
      payload = { ...payload, ...buildStructureResponse(bankRows, limit) };
    } else if (section === "listening") {
      payload = { ...payload, ...buildListeningResponse(bankRows, recordingOffset) };
    } else if (section === "compositional_analysis") {
      payload = { ...payload, ...buildCompositionalResponse(bankRows, limit) };
    }

    return NextResponse.json(payload);
  } catch (err) {
    console.error("[step/questions]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load questions" },
      { status: 500 }
    );
  }
}
