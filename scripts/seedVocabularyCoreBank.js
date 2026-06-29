/**
 * Seed curated core vocabulary into public.vocabulary_words.
 * Run: node scripts/seedVocabularyCoreBank.js
 */
const path = require("path");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const { A1_1, A1_2 } = require("./data/vocabularyCoreBankData");
const { SPEAKIFY_CEFR_LEVELS } = require("../lib/vocabularyLevels.js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const TARGETS = {
  "A1.1": 50,
  "A1.2": 50,
  "A2.1": 50,
  "A2.2": 50,
  "B1.1": 50,
  "B1.2": 50,
  "B2.1": 40,
  "B2.2": 40,
  "C1.1": 30,
  "C1.2": 30,
  "C2.1": 30,
  "C2.2": 30,
};

const CURATED = {
  "A1.1": A1_1,
  "A1.2": A1_2,
};

const LEVEL_THEMES = {
  "A2.1":
    "travel, transport, hotels, health, hobbies, weather, directions — elementary everyday English",
  "A2.2":
    "work, study, technology, opinions, plans, comparisons — upper elementary",
  "B1.1":
    "education, environment, social life, experiences, problems and solutions — intermediate",
  "B1.2":
    "work communication, culture, media, goals, opinions — upper intermediate",
  "B2.1":
    "academic topics, abstract ideas, argument, cause and effect, global issues — lower advanced",
  "B2.2":
    "critical thinking, formal discussion, debate, advanced writing vocabulary — advanced",
  "C1.1":
    "professional, academic, legal and business precision — proficient",
  "C1.2":
    "idioms, nuance, precision, high-level academic and professional language — proficient plus",
  "C2.1":
    "sophisticated academic vocabulary, nuanced argument, formal discourse markers — mastery",
  "C2.2":
    "near-native vocabulary, rhetoric, subtle register, expert collocations — mastery plus",
};

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function toDbRow(entry) {
  const collocations = (entry.collocations || [entry.word])
    .map((c) => String(c).trim())
    .filter(Boolean)
    .slice(0, 4);
  while (collocations.length < 4) collocations.push(entry.word);

  const arabic = entry.definition_arabic || "";
  const ipa = entry.pronunciation_ipa || "";

  return {
    word: entry.word,
    cefr_level: entry.cefr_level,
    part_of_speech: entry.part_of_speech,
    definition: entry.definition,
    definition_arabic: arabic,
    pronunciation_ipa: ipa,
    example_sentence: entry.example_sentence,
    ielts_example: entry.ielts_example || entry.example_sentence,
    word_family: entry.word_family || {},
    collocations,
    memory_hook: entry.memory_hook || "",
    saudi_context: entry.saudi_context || "",
    topic_category: entry.topic_category || "general",
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateLevelWords(openai, level, count, exclude) {
  const theme = LEVEL_THEMES[level];
  const prompt = `Generate exactly ${count} REAL English vocabulary items for CEFR ${level}.
Theme: ${theme}.
Rules:
- Use genuine dictionary words appropriate ONLY for ${level}.
- A1/A2 = simple everyday words. B1/B2 = intermediate/academic. C1/C2 = sophisticated near-native vocabulary.
- No placeholders, no invented words, no repeating words.
- Each item needs: word, part_of_speech (noun|verb|adjective|adverb|interjection|number), definition (clear, concise), example_sentence (natural).
${exclude.length ? `Exclude: ${exclude.slice(0, 200).join(", ")}` : ""}

Return JSON: { "words": [ { "word", "part_of_speech", "definition", "example_sentence" } ] }`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.7,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are an expert CEFR vocabulary curator. Output valid JSON only with real English words.",
      },
      { role: "user", content: prompt },
    ],
  });

  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw);
  const words = Array.isArray(parsed.words) ? parsed.words : [];

  return words
    .filter((w) => w.word && w.definition && w.example_sentence)
    .map((w) =>
      toDbRow({
        word: String(w.word).trim(),
        cefr_level: level,
        part_of_speech: String(w.part_of_speech || "noun").trim(),
        definition: String(w.definition).trim(),
        example_sentence: String(w.example_sentence).trim(),
        ielts_example: String(w.example_sentence).trim(),
      })
    );
}

async function main() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existing, error: listError } = await supabase
    .from("vocabulary_words")
    .select("id");

  if (listError) {
    console.error("Failed to list vocabulary_words:", listError.message);
    process.exit(1);
  }

  if (existing?.length) {
    const ids = existing.map((row) => row.id);
    const { error: deleteError } = await supabase
      .from("vocabulary_words")
      .delete()
      .in("id", ids);

    if (deleteError) {
      console.error("Failed to clear vocabulary_words:", deleteError.message);
      process.exit(1);
    }
  }
  console.log("Cleared existing vocabulary_words rows.");

  let openai = null;
  if (process.env.OPENAI_API_KEY) {
    const OpenAI = (await import("openai")).default;
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  const summary = {};

  for (const level of SPEAKIFY_CEFR_LEVELS) {
    const target = TARGETS[level];
    let rows = (CURATED[level] || []).map(toDbRow);
    const seen = new Set(rows.map((r) => r.word.toLowerCase()));

    if (rows.length < target) {
      if (!openai) {
        console.error(`Need OPENAI_API_KEY to generate words for ${level}`);
        process.exit(1);
      }

      let remaining = target - rows.length;
      while (remaining > 0) {
        const batchSize = Math.min(25, remaining);
        console.log(`[${level}] generating ${batchSize} words (${rows.length}/${target})...`);
        const generated = await generateLevelWords(
          openai,
          level,
          batchSize,
          [...seen]
        );
        for (const row of generated) {
          const key = row.word.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          rows.push(row);
          if (rows.length >= target) break;
        }
        remaining = target - rows.length;
        if (generated.length === 0) {
          console.error(`[${level}] AI returned no new words; stopping.`);
          break;
        }
        await sleep(1200);
      }
    }

    rows = rows.slice(0, target);

    const { data, error } = await supabase
      .from("vocabulary_words")
      .insert(rows)
      .select("id, cefr_level");

    if (error) {
      console.error(`[${level}] insert failed:`, error.message);
      process.exit(1);
    }

    summary[level] = data?.length ?? rows.length;
    console.log(`[${level}] inserted ${summary[level]} words`);
  }

  console.log("\n=== Seed summary ===");
  let total = 0;
  for (const level of SPEAKIFY_CEFR_LEVELS) {
    console.log(`  ${level}: ${summary[level] ?? 0}`);
    total += summary[level] ?? 0;
  }
  console.log(`  TOTAL: ${total}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
