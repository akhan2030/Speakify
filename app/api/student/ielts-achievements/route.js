import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";
import {
  IELTS_ACHIEVEMENTS,
  evaluateAchievements,
  formatAchievementProgress,
} from "@/lib/ielts/achievements";
import { fetchAchievementMetrics } from "@/lib/ielts/fetchAchievementMetrics";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await fetchStudentProfile(studentId);
    const supabase = process.env.SUPABASE_SERVICE_KEY ? getSupabase() : null;

    const metrics = await fetchAchievementMetrics(supabase, studentId, profile);

    let storedEarned = [];
    if (supabase) {
      storedEarned = await safeRows(
        supabase
          .from("student_achievements")
          .select("achievement_id")
          .eq("student_id", studentId)
      ).then((rows) => rows.map((r) => r.achievement_id));
    }

    const computed = evaluateAchievements(metrics);
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

    const achievements = IELTS_ACHIEVEMENTS.map((a) => {
      const earned = earnedSet.has(a.id);
      return {
        ...a,
        earned,
        progress: formatAchievementProgress(a.id, metrics, earned),
      };
    });

    return NextResponse.json({
      achievements,
      earnedCount: earnedSet.size,
      totalCount: IELTS_ACHIEVEMENTS.length,
      metrics,
    });
  } catch (err) {
    console.error("[ielts-achievements]", err);
    return NextResponse.json({ error: "Failed to load achievements" }, { status: 500 });
  }
}
