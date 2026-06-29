/**
 * Expand core vocabulary banks toward VOCAB_CORE_TARGETS via OpenAI.
 *
 * Usage:
 *   node scripts/expandVocabularyBank.js
 *   node scripts/expandVocabularyBank.js --level A1.1
 *   node scripts/expandVocabularyBank.js --level B1.1 --batch 30 --max-batches 5
 */
const path = require("path");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const {
  SPEAKIFY_CEFR_LEVELS,
  VOCAB_CORE_TARGETS,
  normalizeSpeakifyCefrLevel,
} = require("../lib/vocabularyLevels.js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function parseArgs(argv) {
  const opts = {
    level: null,
    batch: 25,
    maxBatches: 20,
    delayMs: 1500,
  };

  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--level" && argv[i + 1]) {
      opts.level = normalizeSpeakifyCefrLevel(argv[++i]);
    } else if (arg === "--batch" && argv[i + 1]) {
      opts.batch = Math.max(5, Number(argv[++i]) || 25);
    } else if (arg === "--max-batches" && argv[i + 1]) {
      opts.maxBatches = Math.max(1, Number(argv[++i]) || 20);
    } else if (arg === "--delay" && argv[i + 1]) {
      opts.delayMs = Math.max(0, Number(argv[++i]) || 1500);
    }
  }

  return opts;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function countCoreWords(supabase, level) {
  const { count, error } = await supabase
    .from("vocabulary_words")
    .select("id", { count: "exact", head: true })
    .eq("cefr_level", level)
    .or("word_source.eq.core,word_source.is.null")
    .is("student_id", null);

  if (error) throw error;
  return count ?? 0;
}

async function fetchExistingWords(supabase, level) {
  const { data, error } = await supabase
    .from("vocabulary_words")
    .select("word")
    .eq("cefr_level", level)
    .or("word_source.eq.core,word_source.is.null")
    .is("student_id", null);

  if (error) throw error;
  return (data ?? []).map((r) => r.word).filter(Boolean);
}

async function expandLevel(supabase, level, opts) {
  const target = VOCAB_CORE_TARGETS[level] ?? 400;
  let batches = 0;

  while (batches < opts.maxBatches) {
    const current = await countCoreWords(supabase, level);
    if (current >= target) {
      console.log(`[${level}] target reached (${current}/${target})`);
      return { level, inserted: 0, finalCount: current };
    }

    const need = target - current;
    const batchSize = Math.min(opts.batch, need);
    const excludeWords = await fetchExistingWords(supabase, level);

    console.log(`[${level}] generating ${batchSize} words (${current}/${target})...`);
    const result = await generateCoreVocabularyBatch({
      supabase,
      cefrLevel: level,
      batchSize,
      excludeWords,
    });

    batches += 1;
    const after = await countCoreWords(supabase, level);
    console.log(`[${level}] +${result.inserted} (now ${after}/${target})`);

    if (result.inserted === 0) {
      console.warn(`[${level}] no new words inserted; stopping.`);
      return { level, inserted: 0, finalCount: after };
    }

    if (opts.delayMs > 0) await sleep(opts.delayMs);
  }

  const finalCount = await countCoreWords(supabase, level);
  return { level, inserted: 0, finalCount };
}

async function main() {
  const opts = parseArgs(process.argv);
  const { generateCoreVocabularyBatch } = await import("../lib/vocabularyAiTopup.js");

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local");
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const levels = opts.level ? [opts.level] : SPEAKIFY_CEFR_LEVELS;
  const summary = [];

  for (const level of levels) {
    try {
      const result = await expandLevel(supabase, level, opts);
      summary.push(result);
    } catch (err) {
      console.error(`[${level}] failed:`, err.message || err);
      summary.push({ level, error: err.message || String(err) });
    }
  }

  console.log("\nSummary:");
  for (const row of summary) {
    if (row.error) {
      console.log(`  ${row.level}: ERROR — ${row.error}`);
    } else {
      console.log(`  ${row.level}: ${row.finalCount} core words`);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
