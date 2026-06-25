import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";
import {
  IELTS_ACHIEVEMENTS,
  evaluateAchievements,
} from "@/lib/ielts/achievements";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function safeCount(query) {
  try {
    const result = await query;
    if (result.error) {
      console.warn("[ielts-achievements]", result.error.message);
      return 0;
    }
    return result.count ?? 0;
  } catch {
    return 0;
  }
}

async function safeRows(query) {
  try {
    const result = await query;
    if (result.error) {
      console.warn("[ielts-achievements]", result.error.message);
      return [];
    }
    return result.data ?? [];
  } catch {
    return [];
  }
}

async function safeSingle(query) {
  try {
    const result = await query;
    if (result.error) {
      console.warn("[ielts-achievements]", result.error.message);
      return null;
    }
    return result.data ?? null;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await fetchStudentProfile(studentId);
    const supabase = process.env.SUPABASE_SERVICE_KEY ? getSupabase() : null;

    let tasksCompleted = 0;
    let mocksTaken = 0;
    let writingAttempts = 0;
    let wordsMastered = 0;
    let streak = profile.studyStreak ?? 0;
    let trackProgressPercent = profile.courseProgressPercent ?? 0;
    let storedEarned = [];

    if (supabase) {
      const [
        completionsCount,
        mocksCount,
        writingCount,
        vocabCount,
        streakRow,
        earnedRows,
      ] = await Promise.all([
        safeCount(
          supabase
            .from("daily_task_completions")
            .select("id", { count: "exact", head: true })
            .eq("student_id", studentId)
        ),
        safeCount(
          supabase
            .from("mock_test_attempts")
            .select("id", { count: "exact", head: true })
            .eq("student_id", studentId)
            .eq("status", "completed")
        ),
        safeCount(
          supabase
            .from("writing_attempts")
            .select("id", { count: "exact", head: true })
            .eq("student_id", studentId)
        ),
        safeCount(
          supabase
            .from("student_vocab_progress")
            .select("id", { count: "exact", head: true })
            .eq("student_id", studentId)
        ),
        safeSingle(
          supabase
            .from("study_streaks")
            .select("current_streak, total_tasks_completed")
            .eq("student_id", studentId)
            .maybeSingle()
        ),
        safeRows(
          supabase
            .from("student_achievements")
            .select("achievement_id")
            .eq("student_id", studentId)
        ),
      ]);

      tasksCompleted = streakRow?.total_tasks_completed ?? completionsCount;
      mocksTaken = mocksCount;
      writingAttempts = writingCount;
      wordsMastered = vocabCount;
      streak = streakRow?.current_streak ?? streak;
      storedEarned = earnedRows.map((r) => r.achievement_id);
    }

    const skillsAttempted = [
      profile.skillBands.writing,
      profile.skillBands.speaking,
      profile.skillBands.reading,
      profile.skillBands.listening,
    ].filter((b) => b != null).length;

    const computed = evaluateAchievements({
      tasksCompleted,
      streak,
      mocksTaken,
      currentBand: profile.currentBand,
      writingAttempts,
      wordsMastered,
      skillsAttempted,
      trackProgressPercent,
    });

    const earnedSet = new Set([...storedEarned, ...computed]);
    const newlyEarned = computed.filter((id) => !storedEarned.includes(id));

    if (supabase && newlyEarned.length) {
      try {
        await supabase.from("student_achievements").upsert(
          newlyEarned.map((achievement_id) => ({
            student_id: studentId,
            achievement_id,
          })),
          { onConflict: "student_id,achievement_id" }
        );
      } catch (err) {
        console.warn("[ielts-achievements] upsert failed:", err);
      }
    }

    const achievements = IELTS_ACHIEVEMENTS.map((a) => ({
      ...a,
      earned: earnedSet.has(a.id),
    }));

    return NextResponse.json({
      achievements,
      earnedCount: earnedSet.size,
      totalCount: IELTS_ACHIEVEMENTS.length,
    });
  } catch (err) {
    console.error("[ielts-achievements]", err);
    return NextResponse.json({ error: "Failed to load achievements" }, { status: 500 });
  }
}
