import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "../../../../lib/auth";
import { getQuestionTypeName } from "../../../../lib/readingPassageTypes.js";

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

function resolveStudentId(session, queryStudentId) {
  const sessionId = session?.user?.id;
  if (!sessionId) return null;
  if (queryStudentId && queryStudentId !== sessionId) return null;
  return sessionId;
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const studentId = resolveStudentId(session, searchParams.get("studentId"));

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ rows: [], total: 0 });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("student_passage_history")
      .select("passage_id, passage_bank:passage_id ( question_type, topic, title )")
      .eq("student_id", studentId);

    if (error) {
      console.warn("[reading/passage-history]", error.message);
      return NextResponse.json({ rows: [], total: 0 });
    }

    /** @type {Record<string, { count: number, topics: Set<string> }>} */
    const byType = {};

    for (const row of data ?? []) {
      const bank = row.passage_bank;
      const type = bank?.question_type ?? "unknown";
      if (!byType[type]) {
        byType[type] = { count: 0, topics: new Set() };
      }
      byType[type].count += 1;
      if (bank?.topic) byType[type].topics.add(bank.topic);
    }

    const rows = Object.entries(byType).map(([questionType, info]) => ({
      questionType,
      label: getQuestionTypeName(questionType),
      count: info.count,
      topics: [...info.topics].slice(0, 5),
    }));

    rows.sort((a, b) => b.count - a.count);

    return NextResponse.json({
      total: (data ?? []).length,
      rows,
    });
  } catch (err) {
    console.error("[reading/passage-history]", err);
    return NextResponse.json({ rows: [], total: 0 });
  }
}
