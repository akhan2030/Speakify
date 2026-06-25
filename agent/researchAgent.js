const path = require("path");
const cron = require("node-cron");
const axios = require("axios");
const cheerio = require("cheerio");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

// Run the full scrape → embed → store pipeline every 24 hours (midnight UTC)
cron.schedule("0 0 * * *", () => {
  console.log("[Cron] 24-hour schedule triggered — starting research agent...");
  runResearchAgent().catch((err) => {
    console.error("[Cron] Research agent failed:", err.message);
  });
});

const IELTS_URLS = [
  "https://www.ielts.org/about-ielts/what-is-ielts",
  "https://www.ielts.org/ielts-for-organisations/ielts-scoring-in-detail",
];

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const EMBEDDING_MODEL = "text-embedding-3-small";

const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
};

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function assertEnv() {
  const missing = [];
  if (!process.env.OPENAI_API_KEY) missing.push("OPENAI_API_KEY");
  if (!getSupabaseUrl()) missing.push("SUPABASE_URL");
  if (!process.env.SUPABASE_SERVICE_KEY) missing.push("SUPABASE_SERVICE_KEY");
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables in .env.local: ${missing.join(", ")}`
    );
  }
}

/**
 * Split text into chunks of at most `maxSize` characters with `overlap` between consecutive chunks.
 */
function chunkText(text, maxSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + maxSize, normalized.length);
    const slice = normalized.slice(start, end).trim();
    if (slice) chunks.push(slice);
    if (end >= normalized.length) break;
    start = Math.max(0, end - overlap);
  }

  return chunks;
}

async function scrapeParagraphs(url) {
  console.log(`[Scrape] Fetching ${url}`);
  const { data: html } = await axios.get(url, {
    headers: REQUEST_HEADERS,
    timeout: 30000,
  });

  const $ = cheerio.load(html);
  const paragraphs = [];

  $("p").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length > 0) paragraphs.push(text);
  });

  const combined = paragraphs.join("\n\n");
  console.log(
    `[Scrape] ${url} — found ${paragraphs.length} paragraphs (${combined.length} characters)`
  );

  return combined;
}

async function createEmbedding(openai, text) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

async function processUrl(openai, supabase, url) {
  const fullText = await scrapeParagraphs(url);
  const chunks = chunkText(fullText);
  console.log(`[Chunk] ${url} — ${chunks.length} chunk(s) to embed and store`);

  if (chunks.length === 0) {
    console.log(`[Skip] No content chunks for ${url}`);
    return { url, inserted: 0 };
  }

  console.log(`[Supabase] Removing previous rows for ${url}`);
  const { error: deleteError } = await supabase
    .from("ielts_knowledge")
    .delete()
    .eq("source_url", url);

  if (deleteError) {
    throw new Error(`Failed to clear old rows for ${url}: ${deleteError.message}`);
  }

  let inserted = 0;

  for (let i = 0; i < chunks.length; i++) {
    const content = chunks[i];
    console.log(
      `[Embed] ${url} — chunk ${i + 1}/${chunks.length} (${content.length} chars)`
    );

    const embedding = await createEmbedding(openai, content);

    const { error: insertError } = await supabase.from("ielts_knowledge").insert({
      content,
      embedding,
      source_url: url,
    });

    if (insertError) {
      throw new Error(
        `Failed to insert chunk ${i + 1} for ${url}: ${insertError.message}`
      );
    }

    inserted++;
    console.log(`[Store] Saved chunk ${i + 1}/${chunks.length} for ${url}`);
  }

  return { url, inserted };
}

async function runResearchAgent() {
  const startedAt = new Date().toISOString();
  console.log("========================================");
  console.log(`[Agent] IELTS research agent started at ${startedAt}`);
  console.log("========================================");

  assertEnv();

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const supabase = createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY);

  const results = [];

  for (const url of IELTS_URLS) {
    try {
      const result = await processUrl(openai, supabase, url);
      results.push(result);
    } catch (err) {
      console.error(`[Error] Failed processing ${url}:`, err.message);
      results.push({ url, inserted: 0, error: err.message });
    }
  }

  const totalInserted = results.reduce((sum, r) => sum + (r.inserted || 0), 0);
  console.log("========================================");
  console.log(`[Agent] Finished. Total chunks stored: ${totalInserted}`);
  results.forEach((r) => {
    if (r.error) {
      console.log(`  - ${r.url}: ERROR — ${r.error}`);
    } else {
      console.log(`  - ${r.url}: ${r.inserted} chunk(s)`);
    }
  });
  console.log("========================================");

  return results;
}

if (require.main === module) {
  console.log("[Agent] Running research agent (cron also scheduled every 24h)...");
  runResearchAgent()
    .then(() => {
      console.log("[Agent] Initial run complete. Process will stay alive for cron jobs.");
      console.log("[Agent] Press Ctrl+C to exit.");
    })
    .catch((err) => {
      console.error("[Agent] Fatal error:", err.message);
      process.exit(1);
    });
}

module.exports = { runResearchAgent, chunkText, scrapeParagraphs, IELTS_URLS };
