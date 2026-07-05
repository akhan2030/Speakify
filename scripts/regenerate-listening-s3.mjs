/**
 * Regenerate Section 3 section_practice bank rows (Q21–30, MCQ block Q21–25).
 * Run: node scripts/regenerate-listening-s3.mjs
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { generateListeningSection } from "../lib/listeningGenerator.js";
import {
  validateListeningQuestionContent,
  normalizeListeningMcqOptions,
} from "../lib/listeningQuestionContent.js";

dotenv.config({ path: ".env.local" });

const TARGET_ROWS = 5;
const TOPICS = [
  "Dissertation proposal meeting",
  "Engineering design review",
  "Marketing campaign planning",
  "Ethics committee application",
  "Internship placement discussion",
];

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function mcqBlockValid(questions) {
  const block = questions.filter(
    (q) => Number(q.questionNumber) >= 21 && Number(q.questionNumber) <= 25
  );
  if (block.length < 5) return false;
  const check = validateListeningQuestionContent(block, 3);
  return check.valid;
}

async function saveRow(supabase, testNumber, generated, generationDate, topic) {
  const { applySpeakerIdentitiesToPayload, assertSpeakerIdentitiesValid } =
    await import("../lib/listeningSpeakerIdentity.js");

  let payload = applySpeakerIdentitiesToPayload(generated, {
    testSeed: `bank-s3-regen-${testNumber}`,
    source: "agent_save",
  });
  assertSpeakerIdentitiesValid(payload, 3);

  const insertPayload = {
    generation_date: generationDate,
    content_type: "section_practice",
    test_number: testNumber,
    section_number: 3,
    transcript: payload.transcript,
    questions: payload.questions,
    used: false,
    topic,
    topics: [topic],
    is_available: true,
    total_questions: payload.questions.length,
    section_1: {},
    section_2: {},
    section_3: {},
    section_4: {},
  };

  const { error } = await supabase.from("generated_listening_tests").insert(insertPayload);
  if (error) throw new Error(error.message);
}

async function main() {
  if (!process.env.SUPABASE_SERVICE_KEY || !process.env.OPENAI_API_KEY) {
    console.error("SUPABASE_SERVICE_KEY and OPENAI_API_KEY required");
    process.exit(1);
  }

  const supabase = getSupabase();
  const generationDate = new Date().toISOString().slice(0, 10);
  let saved = 0;

  for (let i = 0; i < TARGET_ROWS; i += 1) {
    const testNumber = i + 1;
    const topic = TOPICS[i % TOPICS.length];
    console.log(`Generating S3 set ${testNumber}: ${topic}...`);

    let generated = null;
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      try {
        generated = await generateListeningSection({
          sectionNumber: 3,
          topic,
          questionCount: 10,
          diversityContext: { testSeed: `s3-regen-${generationDate}-${testNumber}-a${attempt}` },
        });
        if (!mcqBlockValid(generated.questions)) {
          throw new Error("Q21–25 MCQ block failed validation");
        }
        break;
      } catch (err) {
        console.warn(`  attempt ${attempt}/5:`, err instanceof Error ? err.message : err);
        generated = null;
      }
    }

    if (!generated) {
      console.error(`FAIL  could not generate valid S3 set ${testNumber}`);
      continue;
    }

    const mcq = generated.questions.filter((q) => q.questionNumber >= 21 && q.questionNumber <= 25);
    for (const q of mcq) {
      const opts = normalizeListeningMcqOptions(q.options);
      console.log(
        `  Q${q.questionNumber}: ${opts.map((o) => `${o.label}.${o.text.slice(0, 40)}`).join(" | ")}`
      );
    }

    await saveRow(supabase, testNumber, generated, generationDate, topic);
    saved += 1;
    console.log(`  Saved S3 set ${testNumber} ✓`);
  }

  console.log(`\nDone: ${saved}/${TARGET_ROWS} Section 3 rows saved for ${generationDate}`);
  process.exit(saved >= 1 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
