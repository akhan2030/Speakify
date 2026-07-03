/**
 * Seed placement_question_bank with valid MCQs (run after placement_question_bank_fix.sql).
 * Usage: node scripts/seedPlacementQuestions.js
 */
require("dotenv").config({ path: ".env.local", quiet: true });

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

const SEED_ROWS = [
  {
    id: "vocab-env-policy",
    section: "vocabulary",
    band: 5.0,
    type: "mcq",
    question:
      "The government announced a new _______ to reduce pollution in major cities.",
    options: { A: "policy", B: "polite", C: "police", D: "polish" },
    correct: "A",
    explanation:
      "Policy means a course of action adopted by a government or organization.",
    topic: "environment",
  },
  {
    id: "vocab-edu-submit",
    section: "vocabulary",
    band: 5.0,
    type: "mcq",
    question: "Students must _______ their assignments before the deadline.",
    options: { A: "submit", B: "summit", C: "support", D: "suggest" },
    correct: "A",
    explanation: "Submit means to hand in or present something for consideration.",
    topic: "education",
  },
  {
    id: "gram-past-went",
    section: "grammar",
    band: 5.0,
    type: "mcq",
    question: "She _______ to the library every day last semester.",
    options: { A: "goes", B: "went", C: "has gone", D: "is going" },
    correct: "B",
    explanation: "Past simple (went) is used for completed actions in the past.",
    topic: "daily life",
  },
  {
    id: "gram-plural-were",
    section: "grammar",
    band: 5.0,
    type: "mcq",
    question: "The results of the experiment _______ very surprising.",
    options: { A: "was", B: "is", C: "were", D: "are being" },
    correct: "C",
    explanation: "Results is plural so requires the plural verb form were.",
    topic: "science",
  },
  {
    id: "vocab-health-indicates",
    section: "vocabulary",
    band: 5.5,
    type: "mcq",
    question: "The report _______ that more funding is needed for healthcare.",
    options: { A: "indicates", B: "indicated", C: "indication", D: "indicative" },
    correct: "A",
    explanation:
      "Indicates is the correct verb form in present simple for a report stating a finding.",
    topic: "health",
  },
];

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

  const sqlPath = path.join(__dirname, "..", "supabase", "placement_question_bank_fix.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  console.log("Run supabase/placement_question_bank_fix.sql in SQL Editor for full delete + 15 inserts.");
  console.log("Upserting sample rows via API...");

  for (const row of SEED_ROWS) {
    const { error } = await supabase.from("placement_question_bank").upsert(row, {
      onConflict: "id",
    });
    if (error) {
      console.error(`Failed ${row.id}:`, error.message);
      process.exit(1);
    }
    console.log(`OK ${row.id}`);
  }

  const { count, error: countErr } = await supabase
    .from("placement_question_bank")
    .select("id", { count: "exact", head: true });

  if (countErr) {
    console.error("Count error:", countErr.message);
  } else {
    console.log(`placement_question_bank rows: ${count ?? 0}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
