/**
 * STEP research agent — scrapes official Qiyas pages, chunks, embeds, stores in step_knowledge.
 * Manual: npm run agent:step-research
 * Cron: daily at 01:00 UTC
 */

const path = require("path");
const cron = require("node-cron");
const axios = require("axios");
const cheerio = require("cheerio");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

/** Official and reference URLs for STEP research */
const STEP_URLS = [
  {
    url: "https://qiyas.sa/%d8%b3%d8%aa%d9%8a%d8%a8",
    title: "STEP Overview — Qiyas",
    language: "ar",
    sectionHints: ["reading", "structure", "listening", "compositional_analysis"],
  },
  {
    url: "https://qiyas.sa/%D8%AA%D8%AC%D8%B1%D9%8A%D8%A8%D9%8A",
    title: "STEP Trial Test — Qiyas",
    language: "ar",
    sectionHints: ["reading", "structure", "listening", "compositional_analysis"],
  },
  {
    url: "https://qiyas.sa/en/",
    title: "Qiyas English Portal",
    language: "en",
    sectionHints: [],
  },
];

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const EMBEDDING_MODEL = "text-embedding-3-small";
const AGENT_NAME = "step_research_agent";
const CRON_SCHEDULE = "0 1 * * *";

const REQUEST_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml",
  "Accept-Language": "ar,en;q=0.9",
};

function log(...args) {
  console.log(`[${AGENT_NAME}]`, ...args);
}

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

/**
 * Extract readable text from Qiyas pages (headings + paragraphs + list items).
 */
async function scrapePageText(url) {
  log(`Fetching ${url}`);
  const { data: html } = await axios.get(url, {
    headers: REQUEST_HEADERS,
    timeout: 45000,
  });

  const $ = cheerio.load(html);
  $("script, style, noscript, svg").remove();

  const blocks = [];

  $("h1, h2, h3, h4, h5, h6, p, li").each((_, el) => {
    const text = $(el).text().replace(/\s+/g, " ").trim();
    if (text.length >= 20) blocks.push(text);
  });

  const combined = blocks.join("\n\n");
  log(`Scraped ${blocks.length} blocks (${combined.length} chars) from ${url}`);
  return combined;
}

async function createEmbedding(openai, text) {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return response.data[0].embedding;
}

async function processSource(openai, supabase, source) {
  const { url, title, language, sectionHints } = source;
  const fullText = await scrapePageText(url);
  const chunks = chunkText(fullText);

  if (chunks.length === 0) {
    log(`No content chunks for ${url}`);
    return { url, inserted: 0 };
  }

  log(`Removing previous rows for ${url}`);
  const { error: deleteError } = await supabase
    .from("step_knowledge")
    .delete()
    .eq("source_url", url);

  if (deleteError) {
    throw new Error(`Failed to clear old rows for ${url}: ${deleteError.message}`);
  }

  let inserted = 0;

  for (let i = 0; i < chunks.length; i++) {
    const content = chunks[i];
    log(`Embedding chunk ${i + 1}/${chunks.length} (${content.length} chars)`);

    const embedding = await createEmbedding(openai, content);

    const { error: insertError } = await supabase.from("step_knowledge").insert({
      content,
      embedding,
      source_url: url,
      source_title: title,
      language,
      section_hints: sectionHints,
      agent: AGENT_NAME,
    });

    if (insertError) {
      throw new Error(
        `Failed to insert chunk ${i + 1} for ${url}: ${insertError.message}`
      );
    }

    inserted++;
  }

  return { url, inserted };
}

async function runStepResearchAgent() {
  const startedAt = new Date().toISOString();
  log("========================================");
  log(`STEP research agent started at ${startedAt}`);
  log("========================================");

  assertEnv();

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const supabase = createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY);

  const results = [];

  for (const source of STEP_URLS) {
    try {
      const result = await processSource(openai, supabase, source);
      results.push(result);
    } catch (err) {
      log(`ERROR processing ${source.url}:`, err.message);
      results.push({ url: source.url, inserted: 0, error: err.message });
    }
  }

  const totalInserted = results.reduce((sum, r) => sum + (r.inserted || 0), 0);
  log("========================================");
  log(`Finished. Total chunks stored: ${totalInserted}`);
  results.forEach((r) => {
    if (r.error) log(`  - ${r.url}: ERROR — ${r.error}`);
    else log(`  - ${r.url}: ${r.inserted} chunk(s)`);
  });
  log("========================================");

  return results;
}

cron.schedule(CRON_SCHEDULE, () => {
  log("Cron triggered — starting STEP research agent...");
  runStepResearchAgent().catch((err) => {
    log("Cron run failed:", err.message);
  });
});

if (require.main === module) {
  log("Running STEP research agent (cron scheduled daily 01:00 UTC)...");
  runStepResearchAgent()
    .then(() => {
      log("Initial run complete. Process stays alive for cron. Ctrl+C to exit.");
    })
    .catch((err) => {
      log("Fatal error:", err.message);
      process.exit(1);
    });
}

module.exports = {
  runStepResearchAgent,
  STEP_URLS,
  chunkText,
  scrapePageText,
};
