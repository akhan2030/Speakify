import OpenAI from "openai";
import {
  VOCAB_AI_TOPUP_BATCH_SIZE,
  VOCAB_LEVEL_BANKS,
  normalizeSpeakifyCefrLevel,
} from "./vocabularyLevels.js";

function parseJsonFromResponse(raw) {
  const text = String(raw ?? "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : text;
  return JSON.parse(candidate);
}

function toDbRow(entry, cefrLevel, studentId) {
  const collocations = Array.isArray(entry.collocations)
    ? entry.collocations.map(String).filter(Boolean).slice(0, 4)
    : [];

  return {
    word: String(entry.word ?? "").trim(),
    cefr_level: cefrLevel,
    part_of_speech: String(entry.part_of_speech ?? "noun").trim(),
    definition: String(entry.definition ?? "").trim(),
    definition_arabic: String(entry.definition_arabic ?? "").trim(),
    pronunciation_ipa: String(entry.pronunciation_ipa ?? "").trim(),
    example_sentence: String(entry.example_sentence ?? "").trim(),
    ielts_example: String(entry.ielts_example ?? entry.example_sentence ?? "").trim(),
    word_family: entry.word_family && typeof entry.word_family === "object" ? entry.word_family : {},
    collocations: collocations.length ? collocations : [entry.word, entry.word, entry.word, entry.word],
    memory_hook: String(entry.memory_hook ?? "").trim(),
    saudi_context: String(entry.saudi_context ?? "").trim(),
    topic_category: String(entry.topic_category ?? "general").trim(),
    word_source: "ai_personal",
    student_id: studentId,
  };
}

/**
 * Layer 3 — generate personal contextual words for a student who mastered core bank.
 */
export async function generatePersonalVocabularyTopup({
  supabase,
  studentId,
  cefrLevel,
  batchSize = VOCAB_AI_TOPUP_BATCH_SIZE,
  excludeWords = [],
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured for vocabulary top-up.");
  }

  const level = normalizeSpeakifyCefrLevel(cefrLevel);
  const bank = VOCAB_LEVEL_BANKS[level] ?? "general English vocabulary";
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const excludeList =
    excludeWords.length > 0
      ? `\nDo NOT repeat these words: ${excludeWords.slice(0, 200).join(", ")}.`
      : "";

  const prompt = `Generate exactly ${batchSize} advanced vocabulary items for CEFR ${level}.
Focus: ${bank}.
Student context: Saudi IELTS learner, personal enrichment pool after mastering core words.
${excludeList}

Return JSON:
{
  "words": [
    {
      "word": "string",
      "part_of_speech": "noun|verb|adjective|adverb",
      "definition": "string",
      "definition_arabic": "string",
      "pronunciation_ipa": "string",
      "example_sentence": "string",
      "ielts_example": "string",
      "collocations": ["a","b","c","d"],
      "memory_hook": "string",
      "saudi_context": "string",
      "topic_category": "string"
    }
  ]
}`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.75,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a Speakify vocabulary curator. Output valid JSON only. Words must be unique and level-appropriate.",
      },
      { role: "user", content: prompt },
    ],
  });

  const parsed = parseJsonFromResponse(completion.choices[0]?.message?.content);
  const entries = Array.isArray(parsed?.words) ? parsed.words : [];
  if (!entries.length) {
    throw new Error("AI returned no vocabulary words.");
  }

  const rows = entries
    .map((entry) => toDbRow(entry, level, studentId))
    .filter((row) => row.word && row.definition);

  const { data: inserted, error } = await supabase
    .from("vocabulary_words")
    .insert(rows)
    .select("id, word");

  if (error) throw error;

  const now = new Date().toISOString();
  const { data: status } = await supabase
    .from("student_vocab_level_status")
    .select("ai_topup_count")
    .eq("student_id", studentId)
    .eq("cefr_level", level)
    .maybeSingle();

  await supabase.from("student_vocab_level_status").upsert(
    {
      student_id: studentId,
      cefr_level: level,
      ai_topup_count: (status?.ai_topup_count ?? 0) + 1,
      last_ai_topup_at: now,
      updated_at: now,
    },
    { onConflict: "student_id,cefr_level" }
  );

  return {
    level,
    generated: inserted?.length ?? rows.length,
    words: inserted ?? [],
  };
}

/**
 * Core bank expansion (Layer 1 bulk seeding via AI).
 */
export async function generateCoreVocabularyBatch({
  supabase,
  cefrLevel,
  batchSize = 25,
  excludeWords = [],
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY not configured.");
  }

  const level = normalizeSpeakifyCefrLevel(cefrLevel);
  const bank = VOCAB_LEVEL_BANKS[level] ?? "general English";
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const excludeList =
    excludeWords.length > 0
      ? `\nExclude: ${excludeWords.slice(0, 300).join(", ")}.`
      : "";

  const prompt = `Generate exactly ${batchSize} CORE vocabulary words for Speakify CEFR ${level}.
Every student at this level must learn these. Theme bank: ${bank}.
${excludeList}

Return JSON { "words": [ { "word", "part_of_speech", "definition", "definition_arabic", "pronunciation_ipa", "example_sentence", "ielts_example", "collocations"[4], "memory_hook", "saudi_context", "topic_category" } ] }`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: "Speakify core vocabulary author. JSON only." },
      { role: "user", content: prompt },
    ],
  });

  const parsed = parseJsonFromResponse(completion.choices[0]?.message?.content);
  const entries = Array.isArray(parsed?.words) ? parsed.words : [];

  const rows = entries
    .map((entry) => {
      const row = toDbRow(entry, level, null);
      return { ...row, word_source: "core", student_id: null };
    })
    .filter((row) => row.word && row.definition);

  if (!rows.length) return { level, inserted: 0 };

  const { data, error } = await supabase.from("vocabulary_words").insert(rows).select("id");
  if (error) throw error;
  return { level, inserted: data?.length ?? rows.length };
}
