import {
  VOCAB_AI_TOPUP_BATCH_SIZE,
  VOCAB_CORE_MASTERY_THRESHOLD,
  VOCAB_CORE_TARGETS,
  VOCAB_SESSION_SIZE,
  coreTargetForLevel,
  isMasteredRating,
  normalizeSpeakifyCefrLevel,
} from "./vocabularyLevels.js";
import { DEFAULT_CEFR_LEVEL, todayDateKey } from "./vocabulary";
import { fetchVocabularyWordsByIds, mapWordRow } from "./vocabularySupabase.js";

function shuffle(list) {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export { coreTargetForLevel, isMasteredRating };

function isSchemaColumnError(error) {
  const msg = String(error?.message ?? "");
  return (
    msg.includes("schema cache") ||
    msg.includes("word_source") ||
    msg.includes("student_id") ||
    msg.includes("cefr_level") ||
    msg.includes("last_rating") ||
    msg.includes("next_review")
  );
}

async function fetchLevelWordIds(supabase, level) {
  const { data, error } = await supabase
    .from("vocabulary_words")
    .select("id")
    .eq("cefr_level", level);
  if (error) throw error;
  return (data ?? []).map((w) => w.id);
}

async function fetchLevelProgress(supabase, studentId, level) {
  const attempts = [
    () =>
      supabase
        .from("student_vocab_progress")
        .select("word_id, last_rating, next_review")
        .eq("student_id", studentId)
        .eq("cefr_level", level),
    async () => {
      const ids = await fetchLevelWordIds(supabase, level);
      if (!ids.length) return { data: [] };
      return supabase
        .from("student_vocab_progress")
        .select("word_id, last_rating, next_review")
        .eq("student_id", studentId)
        .in("word_id", ids);
    },
    async () => {
      const ids = await fetchLevelWordIds(supabase, level);
      if (!ids.length) return { data: [] };
      return supabase
        .from("student_vocab_progress")
        .select("word_id, next_review")
        .eq("student_id", studentId)
        .in("word_id", ids);
    },
    async () => {
      const ids = await fetchLevelWordIds(supabase, level);
      if (!ids.length) return { data: [] };
      const result = await supabase
        .from("student_vocab_progress")
        .select("word_id")
        .eq("student_id", studentId)
        .in("word_id", ids);
      if (result.error) return result;
      return {
        data: (result.data ?? []).map((row) => ({
          ...row,
          last_rating: null,
          next_review: todayDateKey(),
        })),
      };
    },
  ];

  for (const attempt of attempts) {
    const result = await attempt();
    if (!result.error) return result;
    if (!isSchemaColumnError(result.error)) throw result.error;
  }

  return { data: [] };
}

async function fetchCoreWordIds(supabase, level) {
  return supabase.from("vocabulary_words").select("id").eq("cefr_level", level);
}

async function fetchPersonalWordIds(supabase, studentId, level) {
  const modern = await supabase
    .from("vocabulary_words")
    .select("id")
    .eq("cefr_level", level)
    .eq("word_source", "ai_personal")
    .eq("student_id", studentId);

  if (!modern.error) return modern;
  if (isSchemaColumnError(modern.error)) return { data: [] };
  throw modern.error;
}

/**
 * Layer 2 study queue: due reviews first, then unseen core, then personal AI words.
 */
export async function buildStudyQueue(supabase, studentId, cefrLevel, limit = VOCAB_SESSION_SIZE) {
  const level = normalizeSpeakifyCefrLevel(cefrLevel);
  const today = todayDateKey();

  const [
    dueResult,
    coreResult,
    personalResult,
    progressResult,
  ] = await Promise.all([
    fetchLevelProgress(supabase, studentId, level).then((result) => ({
      ...result,
      data: (result.data ?? [])
        .filter((row) => !row.next_review || row.next_review <= today)
        .sort((a, b) => String(a.next_review).localeCompare(String(b.next_review))),
    })),
    fetchCoreWordIds(supabase, level),
    fetchPersonalWordIds(supabase, studentId, level),
    fetchLevelProgress(supabase, studentId, level),
  ]);

  const studiedSet = new Set((progressResult.data ?? []).map((r) => String(r.word_id)));
  const queueIds = [];
  const seen = new Set();

  const addId = (id) => {
    const key = String(id);
    if (!key || seen.has(key) || queueIds.length >= limit) return;
    seen.add(key);
    queueIds.push(key);
  };

  // Priority 1: due reviews (Again / Hard / any overdue card)
  for (const row of dueResult.data ?? []) {
    addId(row.word_id);
  }

  // Priority 2: unseen core words (Layer 1)
  const unseenCore = shuffle(
    (coreResult.data ?? []).filter((w) => !studiedSet.has(String(w.id)))
  );
  for (const row of unseenCore) {
    addId(row.id);
  }

  // Priority 3: personal AI pool (Layer 3)
  const unseenPersonal = shuffle(
    (personalResult.data ?? []).filter((w) => !studiedSet.has(String(w.id)))
  );
  for (const row of unseenPersonal) {
    addId(row.id);
  }

  // Priority 4: fill with studied core not yet due (continue the bank)
  if (queueIds.length < limit) {
    const studiedCore = shuffle(
      (coreResult.data ?? []).filter((w) => studiedSet.has(String(w.id)))
    );
    for (const row of studiedCore) {
      addId(row.id);
    }
  }

  if (!queueIds.length) {
    return { words: [], meta: { level, queueSize: 0 } };
  }

  const wordRows = await fetchVocabularyWordsByIds(supabase, queueIds);

  const order = new Map(queueIds.map((id, i) => [String(id), i]));
  const words = (wordRows ?? [])
    .sort((a, b) => (order.get(String(a.id)) ?? 0) - (order.get(String(b.id)) ?? 0))
    .map(mapWordRow);

  return {
    words,
    meta: {
      level,
      queueSize: words.length,
      dueCount: (dueResult.data ?? []).length,
      unseenCoreCount: unseenCore.length,
    },
  };
}

export async function computeLevelMastery(supabase, studentId, cefrLevel) {
  const level = normalizeSpeakifyCefrLevel(cefrLevel);
  const target = coreTargetForLevel(level);

  const [{ count: coreInDb }, { data: progress }] = await Promise.all([
    supabase
      .from("vocabulary_words")
      .select("id", { count: "exact", head: true })
      .eq("cefr_level", level)
      .or("word_source.eq.core,word_source.is.null")
      .is("student_id", null),
    supabase
      .from("student_vocab_progress")
      .select("word_id, last_rating")
      .eq("student_id", studentId)
      .eq("cefr_level", level),
  ]);

  const coreInDbCount = coreInDb ?? 0;
  const coreTotal = Math.max(target, coreInDbCount);
  const rows = progress ?? [];
  const studied = rows.length;
  const mastered = rows.filter((r) => isMasteredRating(r.last_rating)).length;
  const accuracy = studied > 0 ? mastered / studied : 0;
  const coverage = coreTotal > 0 ? studied / coreTotal : 0;
  const coreCompleted = coreInDbCount > 0 && studied >= coreInDbCount;
  const readyForTopup =
    coreCompleted && accuracy >= VOCAB_CORE_MASTERY_THRESHOLD;

  return {
    level,
    coreTotal,
    coreInDb: coreInDb ?? 0,
    studied,
    mastered,
    accuracy: Math.round(accuracy * 100),
    coverage: Math.round(coverage * 100),
    coreCompleted,
    readyForTopup,
  };
}

export async function syncLevelStatus(supabase, studentId, cefrLevel) {
  const stats = await computeLevelMastery(supabase, studentId, cefrLevel);

  const row = {
    student_id: studentId,
    cefr_level: stats.level,
    core_words_studied: stats.studied,
    core_words_mastered: stats.mastered,
    core_accuracy_pct: stats.accuracy,
    core_completed: stats.coreCompleted,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("student_vocab_level_status")
    .upsert(row, { onConflict: "student_id,cefr_level" });

  if (error && !error.message.includes("does not exist")) {
    console.warn("[vocabulary] level status upsert:", error.message);
  }

  return stats;
}

export async function getLevelProgressSummary(supabase, studentId) {
  /** @type {import('./vocabulary').SpeakifyCefrLevel[]} */
  const levels = Object.keys(VOCAB_CORE_TARGETS);

  let progress = [];
  let coreCounts = [];

  const progressResult = await supabase
    .from("student_vocab_progress")
    .select("word_id, cefr_level, last_rating")
    .eq("student_id", studentId);

  if (!progressResult.error) {
    progress = progressResult.data ?? [];
  } else if (isSchemaColumnError(progressResult.error)) {
    const legacy = await supabase
      .from("student_vocab_progress")
      .select("word_id")
      .eq("student_id", studentId);
    const wordIds = (legacy.data ?? []).map((r) => r.word_id).filter(Boolean);
    if (wordIds.length) {
      const { data: words } = await supabase
        .from("vocabulary_words")
        .select("id, cefr_level")
        .in("id", wordIds);
      const levelByWord = new Map((words ?? []).map((w) => [String(w.id), w.cefr_level]));
      progress = (legacy.data ?? []).map((row) => ({
        word_id: row.word_id,
        cefr_level: levelByWord.get(String(row.word_id)) ?? DEFAULT_CEFR_LEVEL,
        last_rating: null,
      }));
    }
  } else {
    throw progressResult.error;
  }

  const coreResult = await supabase
    .from("vocabulary_words")
    .select("cefr_level")
    .or("word_source.eq.core,word_source.is.null")
    .is("student_id", null);

  if (!coreResult.error) {
    coreCounts = coreResult.data ?? [];
  } else if (isSchemaColumnError(coreResult.error)) {
    const fallback = await supabase.from("vocabulary_words").select("cefr_level");
    coreCounts = fallback.data ?? [];
  }

  const learnedByLevel = {};
  const masteredByLevel = {};
  for (const row of progress) {
    const level = normalizeSpeakifyCefrLevel(row.cefr_level);
    learnedByLevel[level] = (learnedByLevel[level] ?? 0) + 1;
    if (isMasteredRating(row.last_rating)) {
      masteredByLevel[level] = (masteredByLevel[level] ?? 0) + 1;
    }
  }

  const dbCountByLevel = {};
  for (const row of coreCounts) {
    const level = normalizeSpeakifyCefrLevel(row.cefr_level);
    dbCountByLevel[level] = (dbCountByLevel[level] ?? 0) + 1;
  }

  return levels.map((level) => {
    const learned = learnedByLevel[level] ?? 0;
    const target = Math.max(coreTargetForLevel(level), dbCountByLevel[level] ?? 0);
    const percent = target > 0 ? Math.round((learned / target) * 100) : 0;
    return {
      level,
      learned,
      mastered: masteredByLevel[level] ?? 0,
      total: target,
      percent: Math.min(percent, 100),
    };
  });
}

export { VOCAB_AI_TOPUP_BATCH_SIZE };
