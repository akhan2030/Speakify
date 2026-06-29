/**
 * Seed Business English Module 1 — Email & Professional Writing (B1, Weeks 1–2)
 * Run: npm run seed:business-english:module1
 *
 * Requires supabase/business_english_lms_setup.sql applied first.
 */
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");
const { randomUUID } = require("crypto");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const PROGRAMME = "business_english";
const MODULE_SLUG = "email-professional-writing";

const MODULE = {
  programme: PROGRAMME,
  title: "Email & Professional Writing",
  slug: MODULE_SLUG,
  cefr_level: "B1",
  module_number: 1,
  week_start: 1,
  week_end: 2,
  description:
    "Professional email skills for Gulf workplace contexts: tone, structure, requests, complaints, and business reporting at B1 level.",
};

const LESSONS = [
  {
    order_number: 1,
    title: "Formal vs Informal Tone",
    duration_minutes: 45,
    description: "Register, formality levels, Gulf professional context",
    status: "available",
  },
  {
    order_number: 2,
    title: "Email Structure & Subject Lines",
    duration_minutes: 50,
    description: "4-part structure, subject line writing",
    status: "locked",
  },
  {
    order_number: 3,
    title: "Making Requests Politely",
    duration_minutes: 45,
    description: "Modal verbs, politeness scale, follow-up emails",
    status: "locked",
  },
  {
    order_number: 4,
    title: "Complaint & Apology Emails",
    duration_minutes: 50,
    description: "Complaint structure, apology language",
    status: "locked",
  },
  {
    order_number: 5,
    title: "Meeting Summaries & Progress Reports",
    duration_minutes: 55,
    description: "STAR format, action points, minutes",
    status: "locked",
  },
];

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

async function ensureSchema() {
  const connectionString = getConnectionString();
  if (!connectionString) return false;

  const sqlPath = path.join(__dirname, "..", "supabase", "business_english_lms_setup.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  const { Client } = require("pg");
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query(sql);
    console.log("Applied supabase/business_english_lms_setup.sql");
    return true;
  } finally {
    await client.end();
  }
}

async function main() {
  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local");
    process.exit(1);
  }

  await ensureSchema();

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: existingModule, error: lookupError } = await supabase
    .from("business_english_modules")
    .select("id")
    .eq("programme", PROGRAMME)
    .eq("slug", MODULE_SLUG)
    .maybeSingle();

  if (lookupError?.message?.includes("does not exist") || lookupError?.message?.includes("schema cache")) {
    console.error(
      "Tables missing. Run supabase/business_english_module1_seed.sql in the Supabase SQL Editor (creates tables + seeds data), then re-run this script to verify."
    );
    process.exit(1);
  }
  if (lookupError) {
    console.error("Module lookup failed:", lookupError.message);
    process.exit(1);
  }

  let moduleId = existingModule?.id;
  const now = new Date().toISOString();

  if (moduleId) {
    const { error: updateError } = await supabase
      .from("business_english_modules")
      .update({ ...MODULE, updated_at: now })
      .eq("id", moduleId);

    if (updateError) {
      console.error("Module update failed:", updateError.message);
      process.exit(1);
    }
    console.log(`Updated module: ${MODULE.title}`);
  } else {
    moduleId = randomUUID();
    const { error: insertError } = await supabase.from("business_english_modules").insert({
      id: moduleId,
      ...MODULE,
      created_at: now,
      updated_at: now,
    });

    if (insertError) {
      console.error("Module insert failed:", insertError.message);
      process.exit(1);
    }
    console.log(`Created module: ${MODULE.title}`);
  }

  const { error: deleteLessonsError } = await supabase
    .from("business_english_lessons")
    .delete()
    .eq("module_id", moduleId);

  if (deleteLessonsError) {
    console.error("Lesson clear failed:", deleteLessonsError.message);
    process.exit(1);
  }

  const lessonRows = LESSONS.map((lesson) => ({
    id: randomUUID(),
    module_id: moduleId,
    title: lesson.title,
    description: lesson.description,
    duration_minutes: lesson.duration_minutes,
    order_number: lesson.order_number,
    status: lesson.status,
    created_at: now,
    updated_at: now,
  }));

  const { data: insertedLessons, error: lessonError } = await supabase
    .from("business_english_lessons")
    .insert(lessonRows)
    .select("id, title, order_number, status, duration_minutes");

  if (lessonError) {
    console.error("Lesson insert failed:", lessonError.message);
    process.exit(1);
  }

  console.log("\n=== Business English Module 1 seed summary ===");
  console.log(`  Programme:     ${PROGRAMME}`);
  console.log(`  Module:          ${MODULE.title}`);
  console.log(`  CEFR level:      ${MODULE.cefr_level}`);
  console.log(`  Weeks:           ${MODULE.week_start}–${MODULE.week_end}`);
  console.log(`  Module ID:       ${moduleId}`);
  console.log(`  Lessons seeded:  ${insertedLessons?.length ?? lessonRows.length}`);
  for (const lesson of insertedLessons ?? lessonRows) {
    console.log(
      `    ${lesson.order_number}. ${lesson.title} (${lesson.duration_minutes} min) — ${lesson.status}`
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
