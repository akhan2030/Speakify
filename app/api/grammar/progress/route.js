import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import {
  GRAMMAR_CATEGORIES,
  getCategoryMeta,
  isGrammarCategorySlug,
  percentComplete,
} from "@/lib/grammar";

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

function buildDefaultProgress(studentId) {
  return GRAMMAR_CATEGORIES.map((cat) => ({
    studentId,
    category: cat.slug,
    lessonsCompleted: 0,
    totalLessons: cat.lessonCount,
    exercisesCompleted: 0,
    percentComplete: 0,
  }));
}

function mapRow(row) {
  const meta = getCategoryMeta(row.category);
  const total = row.total_lessons ?? meta?.lessonCount ?? 6;
  const completed = row.lessons_completed ?? 0;
  return {
    category: row.category,
    lessonsCompleted: completed,
    totalLessons: total,
    exercisesCompleted: row.exercises_completed ?? 0,
    percentComplete: percentComplete(completed, total),
    updatedAt: row.updated_at,
  };
}

const LEGACY_META_LESSON_ID = "_meta";

function isMissingTableError(error) {
  if (!error) return false;
  if (error.code === "42P01") return true;
  const msg = error.message ?? "";
  return msg.includes("relation") && msg.includes("does not exist");
}

function isLegacySchemaError(error) {
  return error?.code === "42703";
}

function mapLegacyRows(rows, studentId) {
  const byCategory = new Map();
  for (const row of rows ?? []) {
    const list = byCategory.get(row.category) ?? [];
    list.push(row);
    byCategory.set(row.category, list);
  }

  return GRAMMAR_CATEGORIES.map((cat) => {
    const catRows = byCategory.get(cat.slug) ?? [];
    const metaRow = catRows.find((r) => r.lesson_id === LEGACY_META_LESSON_ID);
    const exerciseRows = catRows.filter(
      (r) => r.lesson_id && r.lesson_id !== LEGACY_META_LESSON_ID
    );
    const exercisesCompleted = exerciseRows.filter((r) => r.completed).length;
    const lessonsCompleted = metaRow?.completed
      ? cat.lessonCount
      : Math.min(
          cat.lessonCount,
          Math.max(0, Number(metaRow?.score) || 0)
        );

    return {
      studentId,
      category: cat.slug,
      lessonsCompleted,
      totalLessons: cat.lessonCount,
      exercisesCompleted,
      percentComplete: percentComplete(lessonsCompleted, cat.lessonCount),
    };
  });
}

async function detectProgressSchema(supabase) {
  const { error } = await supabase
    .from("grammar_progress")
    .select("lessons_completed")
    .limit(0);

  if (!error) return "modern";
  if (isMissingTableError(error)) return "missing";
  if (isLegacySchemaError(error)) return "legacy";
  throw error;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({
        categories: buildDefaultProgress(studentId),
        tableMissing: false,
      });
    }

    const supabase = getSupabase();
    const schema = await detectProgressSchema(supabase);

    if (schema === "missing") {
      return NextResponse.json({
        categories: buildDefaultProgress(studentId),
        tableMissing: true,
      });
    }

    if (schema === "legacy") {
      const { data, error } = await supabase
        .from("grammar_progress")
        .select("category, lesson_id, score, completed, created_at")
        .eq("student_id", studentId);

      if (error) throw error;

      return NextResponse.json({
        categories: mapLegacyRows(data, studentId),
        schemaLegacy: true,
      });
    }

    const { data, error } = await supabase
      .from("grammar_progress")
      .select(
        "category, lessons_completed, total_lessons, exercises_completed, updated_at"
      )
      .eq("student_id", studentId);

    if (error) throw error;

    const byCategory = new Map((data ?? []).map((r) => [r.category, r]));

    const categories = GRAMMAR_CATEGORIES.map((cat) => {
      const row = byCategory.get(cat.slug);
      if (!row) {
        return {
          studentId,
          category: cat.slug,
          lessonsCompleted: 0,
          totalLessons: cat.lessonCount,
          exercisesCompleted: 0,
          percentComplete: 0,
        };
      }
      return mapRow({ ...row, category: cat.slug });
    });

    return NextResponse.json({ categories });
  } catch (err) {
    console.error("[grammar/progress] GET", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to load progress" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const category = String(body?.category ?? "").trim();

    if (!isGrammarCategorySlug(category)) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const meta = getCategoryMeta(category);
    const lessonsCompleted = Math.min(
      meta?.lessonCount ?? 6,
      Math.max(0, Number(body?.lessonsCompleted) ?? 0)
    );
    const exercisesCompleted = Math.max(
      0,
      Number(body?.exercisesCompleted) ?? 0
    );
    const markComplete = Boolean(body?.markComplete);

    const finalLessons = markComplete
      ? meta?.lessonCount ?? 6
      : lessonsCompleted;

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 });
    }

    const supabase = getSupabase();
    const schema = await detectProgressSchema(supabase);

    if (schema === "missing") {
      return NextResponse.json(
        {
          error:
            "grammar_progress table missing. Run supabase/grammar_progress_setup.sql.",
        },
        { status: 503 }
      );
    }

    if (schema === "legacy") {
      const payload = {
        student_id: studentId,
        category,
        lesson_id: LEGACY_META_LESSON_ID,
        score: finalLessons,
        completed: markComplete,
      };

      const { data: existing } = await supabase
        .from("grammar_progress")
        .select("id")
        .eq("student_id", studentId)
        .eq("category", category)
        .eq("lesson_id", LEGACY_META_LESSON_ID)
        .maybeSingle();

      const write = existing?.id
        ? supabase.from("grammar_progress").update(payload).eq("id", existing.id)
        : supabase.from("grammar_progress").insert(payload);

      const { data, error } = await write
        .select("category, lesson_id, score, completed")
        .single();

      if (error) {
        if (isMissingTableError(error)) {
          return NextResponse.json(
            {
              error:
                "grammar_progress table missing. Run supabase/grammar_progress_setup.sql.",
            },
            { status: 503 }
          );
        }
        throw error;
      }

      const mapped = mapLegacyRows([data], studentId)[0];
      return NextResponse.json({
        ok: true,
        progress: {
          ...mapped,
          exercisesCompleted,
        },
      });
    }

    const { data, error } = await supabase
      .from("grammar_progress")
      .upsert(
        {
          student_id: studentId,
          category,
          lessons_completed: finalLessons,
          total_lessons: meta?.lessonCount ?? 6,
          exercises_completed: exercisesCompleted,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "student_id,category" }
      )
      .select(
        "category, lessons_completed, total_lessons, exercises_completed, updated_at"
      )
      .single();

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      progress: mapRow(data),
    });
  } catch (err) {
    console.error("[grammar/progress] POST", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to save progress" },
      { status: 500 }
    );
  }
}
