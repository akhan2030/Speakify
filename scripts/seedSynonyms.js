/**
 * One-time seed: Claude-generated synonyms for all vocabulary_words rows.
 * Run: node scripts/seedSynonyms.js
 *
 * Requires:
 *   - supabase/vocabulary_synonyms_setup.sql applied
 *   - ANTHROPIC_API_KEY in .env.local
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const CLAUDE_MODEL = "claude-sonnet-4-6";
const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getConnectionString() {
  let connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

  if (!connectionString && process.env.SUPABASE_DB_PASSWORD) {
    const ref = getSupabaseUrl().match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
    if (ref) {
      const enc = encodeURIComponent(process.env.SUPABASE_DB_PASSWORD);
      connectionString = `postgresql://postgres.${ref}:${enc}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;
    }
  }

  return connectionString;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPrompt(word, partOfSpeech, exampleSentence) {
  const pos = partOfSpeech || "word";
  const example = exampleSentence || word;
  return `Give exactly 3 synonyms for the word '${word}' used as a ${pos} in this context: '${example}'. Return only a JSON array of 3 words, nothing else. Example: ["assist","aid","back"]`;
}

function parseSynonyms(rawText) {
  const text = String(rawText ?? "").trim();
  const match = text.match(/\[[\s\S]*\]/);
  const candidate = match ? match[0] : text;
  const parsed = JSON.parse(candidate);
  if (!Array.isArray(parsed)) {
    throw new Error("Response is not a JSON array");
  }
  return parsed
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, 3);
}

async function ensureSynonymsColumn() {
  const connectionString = getConnectionString();
  const sqlPath = path.join(__dirname, "..", "supabase", "vocabulary_synonyms_setup.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");

  if (connectionString) {
    const { Client } = require("pg");
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    await client.connect();
    try {
      await client.query(sql);
      console.log("Applied supabase/vocabulary_synonyms_setup.sql");
    } finally {
      await client.end();
    }
    return;
  }

  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase.from("vocabulary_words").select("synonyms").limit(1);
  if (error?.message?.includes("synonyms")) {
    console.error(
      "Missing synonyms column. Run supabase/vocabulary_synonyms_setup.sql in Supabase SQL Editor, then re-run."
    );
    process.exit(1);
  }
}

async function fetchSynonymsFromClaude(apiKey, row) {
  const partOfSpeech = row.part_of_speech || "word";
  const example = row.example_sentence || row.word;
  const prompt = buildPrompt(row.word, partOfSpeech, example);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 128,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Claude API ${response.status}: ${body.slice(0, 300)}`);
  }

  const payload = await response.json();
  const text = payload?.content?.find((block) => block.type === "text")?.text ?? "";
  return parseSynonyms(text);
}

function needsSynonyms(row) {
  const existing = row.synonyms;
  return !Array.isArray(existing) || existing.length < 3;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("Missing ANTHROPIC_API_KEY in .env.local");
    process.exit(1);
  }

  const url = getSupabaseUrl();
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
  }

  await ensureSynonymsColumn();

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: words, error } = await supabase
    .from("vocabulary_words")
    .select("id, word, part_of_speech, example_sentence, synonyms")
    .order("cefr_level", { ascending: true })
    .order("word", { ascending: true });

  if (error) {
    console.error("Failed to fetch vocabulary_words:", error.message);
    process.exit(1);
  }

  const pending = (words ?? []).filter(needsSynonyms);
  console.log(`Total words: ${words?.length ?? 0}. Pending synonyms: ${pending.length}.`);

  if (!pending.length) {
    console.log("All words already have synonyms.");
    return;
  }

  let updated = 0;
  let failed = 0;

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(pending.length / BATCH_SIZE);
    console.log(`Batch ${batchNum}/${totalBatches} (${batch.length} words)...`);

    await Promise.all(
      batch.map(async (row) => {
        try {
          const synonyms = await fetchSynonymsFromClaude(apiKey, row);
          const { error: updateError } = await supabase
            .from("vocabulary_words")
            .update({ synonyms })
            .eq("id", row.id);

          if (updateError) throw new Error(updateError.message);
          updated += 1;
          console.log(`  ✓ ${row.word} → [${synonyms.join(", ")}]`);
        } catch (err) {
          failed += 1;
          console.error(`  ✗ ${row.word}: ${err.message || err}`);
        }
      })
    );

    if (i + BATCH_SIZE < pending.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log("\n=== Synonyms seed summary ===");
  console.log(`  Updated: ${updated}`);
  console.log(`  Failed:  ${failed}`);
  console.log(`  Skipped: ${(words?.length ?? 0) - pending.length} (already had synonyms)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
