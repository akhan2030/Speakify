import { createClient } from "@supabase/supabase-js";
import { addDaysToDateKey, ratingToInterval, todayDateKey } from "./vocabulary";

export function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

export function getSupabase() {
  return createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function mapWordRow(row) {
  return {
    id: row.id,
    word: row.word,
    cefr_level: row.cefr_level,
    part_of_speech: row.part_of_speech ?? null,
    definition: row.definition,
    definition_arabic: row.definition_arabic ?? row.arabic_translation ?? "",
    pronunciation_ipa: row.pronunciation_ipa ?? row.ipa ?? "",
    example_sentence: row.example_sentence,
    ielts_example: row.ielts_example ?? null,
    memory_hook: row.memory_hook ?? null,
    topic_category: row.topic_category ?? null,
    audio_url: row.audio_url ?? null,
  };
}

export function mapPhraseRow(row) {
  return {
    id: row.id,
    phrase: row.phrase,
    skill: row.skill ?? row.skill_area ?? "",
    function: row.function ?? row.phrase_function ?? "",
    band_level: row.band_level ?? "",
    example_sentence: row.example_sentence,
    avoid_phrase: row.avoid_phrase ?? row.weaker_phrase_replaces ?? null,
    memory_hook: row.memory_hook ?? null,
  };
}

export async function upsertWordProgress(supabase, studentId, payload) {
  const { wordId, rating, cefrLevel } = payload;
  const today = todayDateKey();
  const intervalDays = ratingToInterval(rating);
  const nextReview =
    intervalDays === 0 ? today : addDaysToDateKey(today, intervalDays);

  const { data: existing } = await supabase
    .from("student_vocab_progress")
    .select("id, repetitions")
    .eq("student_id", studentId)
    .eq("word_id", wordId)
    .maybeSingle();

  const repetitions = (existing?.repetitions ?? 0) + (rating === "again" ? 0 : 1);

  const row = {
    student_id: studentId,
    word_id: wordId,
    cefr_level: cefrLevel,
    next_review: nextReview,
    interval_days: intervalDays,
    last_rating: rating,
    last_studied_at: new Date().toISOString(),
    repetitions,
  };

  if (existing?.id) {
    const { error } = await supabase
      .from("student_vocab_progress")
      .update(row)
      .eq("id", existing.id);
    if (error) throw error;
    return { nextReview, intervalDays };
  }

  const { error } = await supabase.from("student_vocab_progress").insert(row);
  if (error) throw error;
  return { nextReview, intervalDays };
}

export async function computeStreak(supabase, studentId) {
  const { data, error } = await supabase
    .from("student_vocab_progress")
    .select("last_studied_at")
    .eq("student_id", studentId)
    .order("last_studied_at", { ascending: false })
    .limit(200);

  if (error || !data?.length) return 0;

  const days = new Set(
    data.map((r) => String(r.last_studied_at).slice(0, 10)).filter(Boolean)
  );

  let streak = 0;
  let cursor = todayDateKey();
  while (days.has(cursor)) {
    streak += 1;
    cursor = addDaysToDateKey(cursor, -1);
  }
  return streak;
}
