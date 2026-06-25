import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import { buildBandTrendFromHistory } from "@/lib/ielts/projectedExamBand";
import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";

export const runtime = "nodejs";

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function addDays(dateKey, delta) {
  const d = new Date(`${dateKey}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const studentId = session?.user?.id;
    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await fetchStudentProfile(studentId);
    const today = new Date().toISOString().slice(0, 10);
    const rangeStart = addDays(today, -56);

    let days = [];
    let bandTrend = [];
    let weeklyHours = [];

    if (process.env.SUPABASE_SERVICE_KEY) {
      const supabase = getSupabase();
      const [completionsRes, bandRes] = await Promise.all([
        supabase
          .from("daily_task_completions")
          .select("task_id, completed_at, task_type, time_spent_minutes")
          .eq("student_id", studentId)
          .gte("completed_at", `${rangeStart}T00:00:00`)
          .order("completed_at", { ascending: true }),
        supabase
          .from("band_score_history")
          .select("skill, band_score, recorded_at")
          .eq("student_id", studentId)
          .order("recorded_at", { ascending: true })
          .limit(50),
      ]);

      const completions = completionsRes.data ?? [];
      const byDate = new Map();

      for (const row of completions) {
        const date = String(row.completed_at).slice(0, 10);
        if (!byDate.has(date)) {
          byDate.set(date, { count: 0, types: new Set(), minutes: 0 });
        }
        const entry = byDate.get(date);
        entry.count += 1;
        entry.types.add(row.task_type ?? "study");
        entry.minutes += Number(row.time_spent_minutes) || 0;
      }

      for (let i = 56; i >= 0; i -= 1) {
        const date = addDays(today, -i);
        const entry = byDate.get(date);
        const d = new Date(`${date}T12:00:00`);
        days.push({
          date,
          label: d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }),
          studied: Boolean(entry?.count),
          tasksCompleted: entry?.count ?? 0,
          summary: entry
            ? `${entry.count} tasks · ${[...entry.types].slice(0, 3).join(", ")}`
            : "",
        });
      }

      bandTrend = buildBandTrendFromHistory(bandRes.data ?? [], profile.currentBand);

      const weekMap = new Map();
      for (const row of completions) {
        const date = String(row.completed_at).slice(0, 10);
        const d = new Date(`${date}T12:00:00`);
        const weekStart = addDays(date, -d.getDay());
        weekMap.set(weekStart, (weekMap.get(weekStart) ?? 0) + (Number(row.time_spent_minutes) || 15) / 60);
      }
      weeklyHours = [...weekMap.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-8)
        .map(([week, hours]) => ({
          week: new Date(`${week}T12:00:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          hours: Math.round(hours * 10) / 10,
        }));
    }

    return NextResponse.json({
      days,
      bandTrend,
      weeklyHours,
      totalStudyDays: days.filter((d) => d.studied).length,
      targetBand: profile.targetBand ?? 6.5,
    });
  } catch (err) {
    console.error("[ielts-history]", err);
    return NextResponse.json({ error: "Failed to load history" }, { status: 500 });
  }
}
