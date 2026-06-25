import { NextResponse } from "next/server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";

import { getCefrLevel } from "@/lib/course/cefrLevels";

import { getSupabase } from "@/lib/course/enrollment";

import { getPathwayLevelDisplay } from "@/lib/pathway/levelDisplay";

import { resolveDayType, weekDayKey } from "@/lib/pathway/dayMapping";

import {

  generateLessonContentWithAI,

} from "@/lib/pathway/generateLessonContent";

import { isPlaceholderLessonContent } from "@/lib/pathway/lessonContentValidation";

import { persistIeltsReadiness } from "@/lib/pathway/persistReadiness";

import { resolvePathwayLevel } from "@/lib/pathway/resolveLevel";

import {

  cacheLessonContent,

  fetchPreviousLevelVocab,

  resolvePathwayLesson,

} from "@/lib/pathway/resolveLesson";

import { pathwayLessonFallback } from "@/lib/pathway/apiFallbacks";

import { updateStudyStreak } from "@/lib/pathway/studyStreak.js";

import { getNextDayEncouragement } from "@/lib/pathway/nextDayMessage";

import { isAbortError } from "@/lib/openaiTimeout";



export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const maxDuration = 120;



function hasLessonContent(content) {

  if (!content || typeof content !== "object") return false;

  return Object.keys(content).length > 0;

}



async function loadOrGenerateContent(supabase, level, week, dayType, display, levelId, forceRegenerate = false) {

  const code = level.cefr_sub_level ?? getCefrLevel(level.slug)?.code ?? "B1.1";

  const focusAreas = level.description ?? display.focusAreas;

  console.log("4. Checking for existing lesson content...", { levelId, week, dayType });

  const lessonRow = await resolvePathwayLesson(supabase, level, week, dayType);

  console.log("4a. Lesson row resolved:", lessonRow?.id ?? "none", "hasContent:", hasLessonContent(lessonRow?.content));



  if (lessonRow?.content && hasLessonContent(lessonRow.content) && !forceRegenerate) {

    if (!isPlaceholderLessonContent(lessonRow.content, dayType)) {

      console.log("4b. Using cached lesson content from database");

      return {

        content: lessonRow.content,

        lessonId: lessonRow.id,

        cached: true,

      };

    }

    console.warn("4b. Cached content is placeholder — regenerating with OpenAI");

  }

  if (forceRegenerate) {

    console.log("4c. force=1 — regenerating lesson content with OpenAI");

  }



  if (!process.env.OPENAI_API_KEY?.trim()) {

    console.error("OPENAI_API_KEY missing — check .env.local");

    throw new Error(

      "OPENAI_API_KEY is not set. Add it to .env.local and restart the dev server."

    );

  }

  console.log("OPENAI_API_KEY is configured (length:", process.env.OPENAI_API_KEY.length, ")");



  let previousVocab = [];

  if (dayType === "review") {

    previousVocab = await fetchPreviousLevelVocab(supabase, level.slug ?? level.id);

  }



  let content;

  try {

    console.log("5. No existing content - calling OpenAI...");

    content = await generateLessonContentWithAI({

      dayType,

      cefrCode: code,

      week,

      focusAreas,

      levelSlug: level.slug ?? level.id,

      previousVocab,

    });

    console.log("6. OpenAI response received");

    if (isPlaceholderLessonContent(content, dayType)) {

      throw new Error("OpenAI returned placeholder content — generation rejected.");

    }

  } catch (genErr) {

    if (isAbortError(genErr)) {

      console.warn("[pathway/lesson] OpenAI timed out");

      throw genErr;

    }

    console.error("OpenAI error:", genErr instanceof Error ? genErr.message : genErr);

    throw genErr;

  }



  if (lessonRow?.id) {

    console.log("7. Saving to database...", lessonRow.id);

    await cacheLessonContent(supabase, lessonRow.id, content);

    console.log("7a. Saved to lessons.content");

  } else {

    console.warn("7. Skipped save — no lesson row id");

  }



  return {

    content,

    lessonId: lessonRow?.id ?? null,

    cached: false,

  };

}



export async function GET(request, { params }) {

  try {

    const session = await getServerSession(authOptions);



    const url = new URL(request.url);

    const week = Number(url.searchParams.get("week") ?? "1");

    const dayParam = url.searchParams.get("day");

    const forceRegenerate = url.searchParams.get("force") === "1";

    const levelId = params.levelId;

    console.log("1. Lesson API GET - levelId:", levelId, "week:", week, "day:", dayParam);



    if (!session?.user?.id) {

      console.log("1a. No session — returning fallback");

      return NextResponse.json(

        pathwayLessonFallback(levelId, week, dayParam)

      );

    }



    const dayType = resolveDayType(dayParam);



    if (!dayType || !Number.isFinite(week)) {

      console.log("1b. Invalid week/day — returning fallback");

      return NextResponse.json(

        pathwayLessonFallback(levelId, week, dayParam ?? "monday")

      );

    }



    console.log("2. Fetching level from database...");

    const supabase = getSupabase();

    const { level } = await resolvePathwayLevel(

      supabase,

      levelId

    );

    if (!level) {

      console.log("2a. Level not found — returning fallback");

      return NextResponse.json(pathwayLessonFallback(levelId, week, dayParam));

    }

    console.log("3. Level found:", level.cefr_sub_level ?? level.slug);



    const code = level.cefr_sub_level ?? getCefrLevel(level.slug)?.code ?? "B1.1";

    const display = getPathwayLevelDisplay(code, level.description);



    const { content, lessonId, cached } = await loadOrGenerateContent(

      supabase,

      level,

      week,

      dayType,

      display,

      levelId,

      forceRegenerate

    );

    console.log("8. Returning content to page", { cached, lessonId, keys: Object.keys(content ?? {}) });



    let weeklyScores = {};

    let completed = false;

    try {

      const { data: progress, error: progressError } = await supabase

        .from("student_level_progress")

        .select("weekly_scores, current_week")

        .eq("student_id", session.user.id)

        .eq("level_id", level.id)

        .maybeSingle();



      if (!progressError && !progress) {

        await supabase.from("student_level_progress").insert({

          student_id: session.user.id,

          level_id: level.id,

          status: "active",

          current_week: week,

          weekly_scores: {},

          started_at: new Date().toISOString(),

        });

      }



      weeklyScores = progress?.weekly_scores ?? {};

      const progressKey = weekDayKey(week, dayType);

      completed = Boolean(weeklyScores[progressKey]?.completed);

    } catch (dbErr) {

      console.warn("[pathway/lesson] progress read", dbErr);

    }



    const key = weekDayKey(week, dayType);



    return NextResponse.json({

      level: {

        slug: level.slug,

        code,

        name: `${code} — ${display.displayName}`,

      },

      week,

      day: dayParam,

      dayType,

      content,

      lessonId,

      contentCached: cached,

      completed,

      weeklyScore: weeklyScores[key]?.score ?? null,

    });

  } catch (err) {

    console.error("[pathway/lesson] GET", err);

    if (isAbortError(err)) {

      return NextResponse.json(

        { error: "Content generation timed out. Please try again." },

        { status: 408 }

      );

    }

    const message = err instanceof Error ? err.message : "Lesson generation failed";

    if (message.includes("OPENAI_API_KEY")) {

      return NextResponse.json({ error: message }, { status: 503 });

    }

    return NextResponse.json({ error: message }, { status: 500 });

  }

}



export async function POST(request, { params }) {

  try {

    const session = await getServerSession(authOptions);

    const studentId = session?.user?.id;

    if (!studentId) {

      return NextResponse.json({ success: false, fallback: true, error: "Not signed in" });

    }



    const body = await request.json().catch(() => ({}));

    const week = Number(body.week);

    const dayType = resolveDayType(body.day ?? body.dayType);

    const score = body.score != null ? Number(body.score) : 100;

    const lessonId = body.lessonId;



    if (!dayType || !Number.isFinite(week)) {

      return NextResponse.json({ error: "week and day required" }, { status: 400 });

    }



    const supabase = getSupabase();

    const { level, error: levelError } = await resolvePathwayLevel(

      supabase,

      params.levelId

    );

    if (!level) {

      return NextResponse.json(

        { error: levelError ?? "Level not found" },

        { status: 404 }

      );

    }



    const key = weekDayKey(week, dayType);

    const now = new Date().toISOString();



    const { data: existing } = await supabase

      .from("student_level_progress")

      .select("id, weekly_scores, current_week, overall_score")

      .eq("student_id", studentId)

      .eq("level_id", level.id)

      .maybeSingle();



    const weeklyScores = { ...(existing?.weekly_scores ?? {}) };

    weeklyScores[key] = {

      completed: true,

      score,

      completedAt: now,

      dayType,

      week,

    };



    const progressPayload = {

      weekly_scores: weeklyScores,

      updated_at: now,

    };



    if (dayType === "assessment") {

      progressPayload.overall_score = score;

    }



    if (existing?.id) {

      await supabase

        .from("student_level_progress")

        .update(progressPayload)

        .eq("id", existing.id);

    } else {

      await supabase.from("student_level_progress").insert({

        student_id: studentId,

        level_id: level.id,

        status: "active",

        current_week: week,

        weekly_scores: weeklyScores,

        overall_score: dayType === "assessment" ? score : null,

        started_at: now,

      });

    }



    if (lessonId) {

      await supabase.from("student_progress").upsert(

        {

          student_id: studentId,

          lesson_id: lessonId,

          status: "completed",

          score,

          completed_at: now,

          updated_at: now,

        },

        { onConflict: "student_id,lesson_id,exercise_id" }

      );



      try {

        await supabase.from("lesson_completions").upsert(

          {

            student_id: studentId,

            lesson_id: lessonId,

            level_id: level.id,

            week_number: week,

            day_type: dayType,

            score,

            completed_at: now,

          },

          { onConflict: "student_id,lesson_id" }

        );

      } catch (completionErr) {

        console.warn("[pathway/lesson] lesson_completions", completionErr);

      }

    }



    let streak = { current: 0, longest: 0 };

    try {

      streak = await updateStudyStreak(supabase, studentId);

    } catch (streakErr) {

      console.warn("[pathway/lesson] streak", streakErr);

    }



    await persistIeltsReadiness(studentId);



    return NextResponse.json({

      success: true,

      message: "Lesson marked complete",

      nextDayMessage: getNextDayEncouragement(dayType),

      streak,

      weeklyScores,

    });

  } catch (err) {

    console.error("[pathway/lesson] POST", err);

    return NextResponse.json({ error: "Failed to save progress" }, { status: 500 });

  }

}


