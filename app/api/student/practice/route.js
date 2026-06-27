import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { createClient } from "@supabase/supabase-js";
import { authOptions } from "@/lib/auth";
import {
  formatVocabTopicLabel,
  normalizeVocabTopicKey,
} from "@/lib/vocabularyTopics";

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

function normalizeCefrLevel(raw) {
  const value = String(raw ?? "").trim();
  return value || "B1.1";
}

/** B2 → B2; B2.1 → B2; B1+ → B1 — matches sub-levels and plus variants */
function cefrLevelPrefix(level) {
  return normalizeCefrLevel(level)
    .replace(/\.\d+$/, "")
    .replace(/\+$/, "");
}

function normalizeTask(row) {
  return {
    id: row.id,
    skill: row.skill,
    title: row.title,
    topic: row.topic,
    task_type: row.task_type,
    taskType: row.task_type,
    status: row.status,
    cefr_level: row.cefr_level,
    cefrLevel: row.cefr_level,
    estimated_minutes: row.estimated_minutes,
    estimatedMinutes: row.estimated_minutes,
    published_at: row.published_at,
    publishedAt: row.published_at,
    wordCount: row.wordCount,
  };
}

/** Collapse per-word vocabulary daily tasks into one card per topic. */
function groupVocabularyTasksByTopic(tasks) {
  const other = [];
  const groups = new Map();

  for (const task of tasks) {
    if ((task.skill ?? "").toLowerCase() !== "vocabulary") {
      other.push(task);
      continue;
    }

    const topicKey = normalizeVocabTopicKey(task.topic);
    const existing = groups.get(topicKey);
    if (existing) {
      existing.wordCount += 1;
      existing.estimated_minutes = Math.min(20, existing.wordCount * 2);
      existing.estimatedMinutes = existing.estimated_minutes;
    } else {
      groups.set(topicKey, {
        id: `vocabulary-topic-${topicKey}`,
        skill: "vocabulary",
        task_type: "vocabulary_topic",
        taskType: "vocabulary_topic",
        topic: topicKey,
        title: formatVocabTopicLabel(topicKey),
        cefr_level: task.cefr_level,
        cefrLevel: task.cefrLevel ?? task.cefr_level,
        estimated_minutes: Math.min(20, Math.max(5, 2)),
        estimatedMinutes: Math.min(20, Math.max(5, 2)),
        status: task.status,
        published_at: task.published_at,
        publishedAt: task.publishedAt ?? task.published_at,
        wordCount: 1,
      });
    }
  }

  const vocabulary = Array.from(groups.values()).sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return [...vocabulary, ...other];
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ tasks: [], studentLevel: "B1.1" });
    }

    if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) {
      return NextResponse.json({ tasks: [], studentLevel: "B1.1" });
    }

    const supabase = getSupabase();
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("cefr_level")
      .eq("id", session.user.id)
      .maybeSingle();

    if (userError) {
      console.warn("[student/practice] user lookup:", userError.message);
    }

    const cefrLevel = normalizeCefrLevel(user?.cefr_level);
    const levelPrefix = cefrLevelPrefix(cefrLevel);
    const taskColumns =
      "id, skill, title, topic, task_type, cefr_level, estimated_minutes, status, published_at";

    let { data, error } = await supabase
      .from("daily_ai_tasks")
      .select(taskColumns)
      .eq("status", "published")
      .ilike("cefr_level", `${levelPrefix}%`)
      .order("published_at", { ascending: false })
      .limit(30);

    let levelMatch = true;

    // No published content at this level yet — show whatever is available
    if (!error && (data ?? []).length === 0) {
      const fallback = await supabase
        .from("daily_ai_tasks")
        .select(taskColumns)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(30);

      if (!fallback.error && (fallback.data ?? []).length > 0) {
        data = fallback.data;
        levelMatch = false;
      }
    }

    console.log("Student level:", cefrLevel);
    console.log("Level prefix:", levelPrefix);
    console.log("Level match:", levelMatch);
    console.log("Tasks found:", data?.length ?? 0);

    if (error) {
      console.warn("[student/practice] GET", error.message);
      return NextResponse.json({ tasks: [], studentLevel: cefrLevel, error: error.message });
    }

    const normalized = (data ?? []).map(normalizeTask);
    const tasks = groupVocabularyTasksByTopic(normalized);

    return NextResponse.json({
      tasks,
      studentLevel: cefrLevel,
      cefrLevel,
      levelMatch,
    });
  } catch (err) {
    console.error("[student/practice] GET", err);
    return NextResponse.json(
      { tasks: [], studentLevel: "B1.1", error: "Internal server error" },
      { status: 500 }
    );
  }
}
