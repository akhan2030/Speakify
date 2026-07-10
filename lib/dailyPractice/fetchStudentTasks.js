import {
  formatVocabTopicLabel,
  normalizeVocabTopicKey,
} from "@/lib/vocabularyTopics";
import {
  PRACTICE_SKILLS,
  ensureDailySkillCoverage,
  getTodayDateKey,
} from "@/lib/dailyPractice/ensureSkillCoverage";
import { fetchStudentProfile } from "@/lib/course/fetchStudentProfile";
import { fetchWeaknessSignals } from "@/lib/dailyPractice/fetchWeaknessSignals";
import { personalizeDailyPracticeTasks } from "@/lib/dailyPractice/personalizeTasks";
import { parseDailyPracticeProgramme } from "@/lib/dailyPractice/programme";

function normalizeCefrLevel(raw) {
  const value = String(raw ?? "").trim();
  return value || "B1.1";
}

function cefrLevelPrefix(level) {
  return normalizeCefrLevel(level)
    .replace(/\.\d+$/, "")
    .replace(/\+$/, "");
}

function normalizeTask(row, source = "published") {
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
    source,
  };
}

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
        source: task.source ?? "published",
      });
    }
  }

  const vocabulary = Array.from(groups.values()).sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return [...vocabulary, ...other];
}

function coveredSkills(tasks) {
  return new Set(
    tasks.map((task) => String(task.skill ?? "").toLowerCase()).filter(Boolean)
  );
}

async function fetchDraftTasksForSkills(supabase, {
  missingSkills,
  levelPrefix,
  taskColumns,
}) {
  if (!missingSkills.length) return [];

  const drafts = [];

  for (const skill of missingSkills) {
    const levelQuery = await supabase
      .from("daily_ai_tasks")
      .select(taskColumns)
      .eq("skill", skill)
      .eq("status", "draft")
      .ilike("cefr_level", `${levelPrefix}%`)
      .order("generated_at", { ascending: false })
      .limit(skill === "vocabulary" ? 10 : 1);

    let rows = levelQuery.data ?? [];

    if (!levelQuery.error && rows.length === 0) {
      const anyLevel = await supabase
        .from("daily_ai_tasks")
        .select(taskColumns)
        .eq("skill", skill)
        .eq("status", "draft")
        .order("generated_at", { ascending: false })
        .limit(skill === "vocabulary" ? 10 : 1);

      if (!anyLevel.error) {
        rows = anyLevel.data ?? [];
      }
    }

    for (const row of rows) {
      drafts.push(normalizeTask(row, "draft"));
    }
  }

  return drafts;
}

export async function fetchStudentDailyPracticeTasks(
  supabase,
  studentId,
  programmeInput
) {
  const programme = parseDailyPracticeProgramme(programmeInput);

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("cefr_level")
    .eq("id", studentId)
    .maybeSingle();

  if (userError) {
    console.warn("[dailyPractice/fetchStudentTasks] user lookup:", userError.message);
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
    .limit(40);

  let levelMatch = true;

  if (!error && (data ?? []).length === 0) {
    const fallback = await supabase
      .from("daily_ai_tasks")
      .select(taskColumns)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(40);

    if (!fallback.error && (fallback.data ?? []).length > 0) {
      data = fallback.data;
      levelMatch = false;
    }
  }

  if (error) {
    throw error;
  }

  let normalized = (data ?? []).map((row) => normalizeTask(row, "published"));
  let tasks = groupVocabularyTasksByTopic(normalized);

  const missingAfterPublished = PRACTICE_SKILLS.filter(
    (skill) => !coveredSkills(tasks).has(skill)
  );

  if (missingAfterPublished.length > 0) {
    const draftTasks = await fetchDraftTasksForSkills(supabase, {
      missingSkills: missingAfterPublished,
      levelPrefix,
      taskColumns,
    });

    if (draftTasks.length > 0) {
      const draftIds = draftTasks
        .map((task) => task.id)
        .filter(
          (id) =>
            id &&
            !String(id).startsWith("rotation-") &&
            !String(id).startsWith("vocabulary-topic-")
        );

      if (draftIds.length > 0) {
        await supabase
          .from("daily_ai_tasks")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
          })
          .in("id", draftIds)
          .eq("status", "draft");
      }

      tasks = groupVocabularyTasksByTopic([
        ...tasks,
        ...draftTasks.map((task) => ({ ...task, source: "published" })),
      ]);
    }
  }

  const dateKey = getTodayDateKey();
  tasks = ensureDailySkillCoverage(tasks, { cefrLevel, dateKey, programme });

  const profile = await fetchStudentProfile(studentId);
  const weaknessSignals = await fetchWeaknessSignals(supabase, studentId, profile, {
    programme,
  });
  const personalized = personalizeDailyPracticeTasks(tasks, {
    profile,
    signals: weaknessSignals,
    cefrLevel,
  });
  tasks = personalized.tasks;

  const usedRotation = tasks.some((task) => task.source === "rotation");
  const usedDraft = tasks.some((task) => task.source === "draft");

  return {
    tasks,
    studentLevel: cefrLevel,
    cefrLevel,
    levelMatch,
    personalization: {
      programme,
      topFocus: personalized.topFocus,
      personalizedCount: personalized.personalizedCount,
      focusSkills: weaknessSignals.focusSkills,
      weakSkills: weaknessSignals.weakSkills,
    },
    coverage: {
      complete: tasks.length >= PRACTICE_SKILLS.length,
      usedDraft,
      usedRotation,
    },
  };
}
