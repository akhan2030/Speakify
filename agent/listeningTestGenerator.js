/**
 * Daily agent — two independent content pools:
 * - section_practice: 5 variants × 4 sections (20 rows/day)
 * - full_mock: 3 complete tests × 4 sections (12 rows/day)
 * Cron: 3:00 AM. Manual: npm run agent:listening
 */

const path = require("path");
const cron = require("node-cron");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const CONTENT_TYPE_SECTION_PRACTICE = "section_practice";
const CONTENT_TYPE_FULL_MOCK = "full_mock";
const PRACTICE_SETS_PER_SECTION = 5;
const FULL_MOCK_TESTS_PER_DAY = 3;
const CRON_SCHEDULE = "0 3 * * *";

/** Rotate pair gender combos across daily practice/mock batches. */
const SECTION1_PAIR_TYPE_ORDER = [
  "male_female",
  "female_male",
  "male_male",
  "female_female",
];

/** Practice-only topics (never reused in full_mock batch). */
const PRACTICE_TOPICS_BY_SECTION = {
  1: [
    "Pharmacy prescription collection",
    "Car hire reservation",
    "Conference registration desk",
    "Childcare centre enrolment",
    "Furniture delivery scheduling",
    "Community services information line",
    "Theatre ticket reservation",
    "Driving lesson booking",
  ],
  2: [
    "Botanical garden tour",
    "Harbour ferry service announcement",
    "Public library reopening",
    "Farmers market weekly guide",
    "Historic house museum visit",
  ],
  3: [
    "Dissertation proposal meeting",
    "Engineering design review",
    "Marketing campaign planning",
    "Ethics committee application",
    "Internship placement discussion",
  ],
  4: [
    "Renewable energy storage",
    "Medieval trade routes",
    "Child language acquisition",
    "Volcanic hazard monitoring",
    "Microplastics in freshwater",
  ],
};

/** Full-mock-only topics (separate from practice pool). */
const MOCK_TEST_SPECS = [
  {
    testNumber: 1,
    sections: [
      { sectionNumber: 1, topic: "Medical clinic appointment" },
      { sectionNumber: 2, topic: "Museum audio tour" },
      { sectionNumber: 3, topic: "Research project discussion" },
      { sectionNumber: 4, topic: "Marine biology and ocean conservation" },
    ],
  },
  {
    testNumber: 2,
    sections: [
      { sectionNumber: 1, topic: "Train season ticket enquiry" },
      { sectionNumber: 2, topic: "City walking tour guide" },
      { sectionNumber: 3, topic: "University assignment review" },
      { sectionNumber: 4, topic: "Psychology of decision making" },
    ],
  },
  {
    testNumber: 3,
    sections: [
      { sectionNumber: 1, topic: "Volunteer programme signup" },
      { sectionNumber: 2, topic: "Community centre facilities" },
      { sectionNumber: 3, topic: "Field trip planning" },
      { sectionNumber: 4, topic: "Climate change and ecosystems" },
    ],
  },
];

let generateListeningSection = null;

function log(...args) {
  console.log("[ListeningGen]", ...args);
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

function getSupabase() {
  return createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getTodayDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildSectionPracticeBatch() {
  const batch = [];
  for (let sectionNumber = 1; sectionNumber <= 4; sectionNumber += 1) {
    const topics = PRACTICE_TOPICS_BY_SECTION[sectionNumber] ?? [];
    for (let testNumber = 1; testNumber <= PRACTICE_SETS_PER_SECTION; testNumber += 1) {
      batch.push({
        testNumber,
        sectionNumber,
        topic: topics[testNumber - 1] ?? `Section ${sectionNumber} practice ${testNumber}`,
      });
    }
  }
  return batch;
}

async function loadGenerator() {
  if (generateListeningSection) return generateListeningSection;
  const mod = await import("../lib/listeningGenerator.js");
  generateListeningSection = mod.generateListeningSection;
  return generateListeningSection;
}

function buildQuestionsJson(sectionPayload) {
  return {
    title: sectionPayload.title,
    topic: sectionPayload.topic,
    section: sectionPayload.section,
    speakers: sectionPayload.speakers,
    questionType: sectionPayload.questionType,
    wordLimit: sectionPayload.wordLimit,
    items: sectionPayload.questions,
  };
}

async function getTodayRows(supabase, generationDate, contentType) {
  const { data, error } = await supabase
    .from("generated_listening_tests")
    .select("test_number, section_number")
    .eq("generation_date", generationDate)
    .eq("content_type", contentType);

  if (error) {
    throw new Error(`Failed to check ${contentType} rows: ${error.message}`);
  }

  const existingKeys = new Set(
    (data ?? []).map(
      (row) => `${Number(row.test_number)}-${Number(row.section_number)}`
    )
  );

  return { rowCount: data?.length ?? 0, existingKeys };
}

async function saveSection(
  supabase,
  generationDate,
  contentType,
  testNumber,
  sectionNumber,
  generated
) {
  const topic = String(generated.topic ?? "").trim() || `Section ${sectionNumber}`;
  const questionsJson = buildQuestionsJson(generated);
  const emptySection = {};

  const payload = {
    generation_date: generationDate,
    content_type: contentType,
    test_number: testNumber,
    section_number: sectionNumber,
    transcript: generated.transcript,
    questions: questionsJson,
    used: false,
    topic,
    topics: [topic],
    is_available: true,
    total_questions: generated.questions?.length ?? 10,
    section_1: emptySection,
    section_2: emptySection,
    section_3: emptySection,
    section_4: emptySection,
  };

  const { error } = await supabase
    .from("generated_listening_tests")
    .insert(payload);

  if (error) {
    throw new Error(
      `Failed to save ${contentType} test ${testNumber} section ${sectionNumber}: ${error.message}`
    );
  }
}

async function generateAndSave(
  supabase,
  generationDate,
  contentType,
  testNumber,
  sectionNumber,
  topic,
  generateFn,
  diversityContext = {}
) {
  log(
    `  [${contentType}] S${sectionNumber} set ${testNumber} — ${topic}...`
  );

  const testSeed = `${contentType}:t${testNumber}:s${sectionNumber}:${generationDate}`;

  let generated = await generateFn({
    sectionNumber,
    topic,
    questionCount: 10,
    diversityContext: { ...diversityContext, testSeed },
  });

  const { applySpeakerIdentitiesToPayload, assertSpeakerIdentitiesValid } =
    await import("../lib/listeningSpeakerIdentity.js");

  generated = applySpeakerIdentitiesToPayload(generated, {
    testSeed: `bank-save-${contentType}-${testNumber}-s${sectionNumber}`,
    source: "agent_save",
  });
  assertSpeakerIdentitiesValid(generated, sectionNumber);

    const qCount = generated.questions?.length ?? 0;
    if (qCount !== 10) {
      throw new Error(`Expected 10 questions, got ${qCount}`);
    }
    const nums = generated.questions.map((q) => q.questionNumber).sort((a, b) => a - b);
    const expectedStart = (sectionNumber - 1) * 10 + 1;
    if (nums[0] !== expectedStart || nums[9] !== expectedStart + 9) {
      throw new Error(
        `Question numbers must be ${expectedStart}–${expectedStart + 9}, got ${nums.join(",")}`
      );
    }

  const {
    validateListeningSectionPayload,
    logListeningValidationFailure,
  } = await import("../lib/listeningUserFacingValidation.js");
  const payloadCheck = validateListeningSectionPayload(
    generated,
    sectionNumber,
    {
      logOnFailure: true,
      contentType,
      testNumber,
      source: "agent_save",
    }
  );
  if (!payloadCheck.valid) {
    logListeningValidationFailure({
      contentType,
      testNumber,
      sectionNumber,
      field: "agent_generated",
      source: "agent_save",
      errors: payloadCheck.errors,
    });
    throw new Error(
      `Listening validation failed: ${payloadCheck.errors.join("; ")}`
    );
  }

  await saveSection(
    supabase,
    generationDate,
    contentType,
    testNumber,
    sectionNumber,
    generated
  );

  log(`  Saved [${contentType}] test ${testNumber} section ${sectionNumber} ✓`);
  return generated;
}

async function runSectionPracticeGeneration(supabase, generationDate, generateFn) {
  const batch = buildSectionPracticeBatch();
  const target = batch.length;
  const { rowCount, existingKeys } = await getTodayRows(
    supabase,
    generationDate,
    CONTENT_TYPE_SECTION_PRACTICE
  );

  log(
    `Section practice pool: ${rowCount}/${target} rows for ${generationDate}`
  );

  let saved = 0;
  const section1Diversity = {
    excludeSpeakerPairKeys: [],
    excludeTopics: [],
    excludeSpeakerNames: [],
  };

  for (const item of batch) {
    const key = `${item.testNumber}-${item.sectionNumber}`;
    if (existingKeys.has(key)) continue;

    const diversityContext =
      item.sectionNumber === 1
        ? {
            excludeSpeakerPairKeys: section1Diversity.excludeSpeakerPairKeys,
            excludeTopics: section1Diversity.excludeTopics,
            excludeSpeakerNames: section1Diversity.excludeSpeakerNames,
            preferPairType:
              SECTION1_PAIR_TYPE_ORDER[
                (item.testNumber - 1) % SECTION1_PAIR_TYPE_ORDER.length
              ],
          }
        : {};

    try {
      const generated = await generateAndSave(
        supabase,
        generationDate,
        CONTENT_TYPE_SECTION_PRACTICE,
        item.testNumber,
        item.sectionNumber,
        item.topic,
        generateFn,
        diversityContext
      );

      if (item.sectionNumber === 1 && generated) {
        if (generated.speakerPairKey) {
          section1Diversity.excludeSpeakerPairKeys.push(
            generated.speakerPairKey
          );
        }
        section1Diversity.excludeTopics.push(generated.topic);
        for (const sp of generated.speakers ?? []) {
          if (sp?.name) section1Diversity.excludeSpeakerNames.push(sp.name);
        }
      }
      existingKeys.add(key);
      saved += 1;
      await sleep(1200);
    } catch (err) {
      log(`  Section practice ${key} failed — ${err.message}`);
    }
  }

  return saved;
}

async function runFullMockGeneration(supabase, generationDate, generateFn) {
  const target = FULL_MOCK_TESTS_PER_DAY * 4;
  const { rowCount, existingKeys } = await getTodayRows(
    supabase,
    generationDate,
    CONTENT_TYPE_FULL_MOCK
  );

  log(`Full mock pool: ${rowCount}/${target} rows for ${generationDate}`);

  let saved = 0;
  const section1Diversity = {
    excludeSpeakerPairKeys: [],
    excludeTopics: [],
    excludeSpeakerNames: [],
  };

  for (const spec of MOCK_TEST_SPECS) {
    for (const { sectionNumber, topic } of spec.sections) {
      const key = `${spec.testNumber}-${sectionNumber}`;
      if (existingKeys.has(key)) continue;

      const diversityContext =
        sectionNumber === 1
          ? {
              excludeSpeakerPairKeys: section1Diversity.excludeSpeakerPairKeys,
              excludeTopics: section1Diversity.excludeTopics,
              excludeSpeakerNames: section1Diversity.excludeSpeakerNames,
              preferPairType:
                SECTION1_PAIR_TYPE_ORDER[
                  (spec.testNumber - 1) % SECTION1_PAIR_TYPE_ORDER.length
                ],
            }
          : {};

      try {
        const generated = await generateAndSave(
          supabase,
          generationDate,
          CONTENT_TYPE_FULL_MOCK,
          spec.testNumber,
          sectionNumber,
          topic,
          generateFn,
          diversityContext
        );

        if (sectionNumber === 1 && generated) {
          if (generated.speakerPairKey) {
            section1Diversity.excludeSpeakerPairKeys.push(
              generated.speakerPairKey
            );
          }
          section1Diversity.excludeTopics.push(generated.topic);
          for (const sp of generated.speakers ?? []) {
            if (sp?.name) section1Diversity.excludeSpeakerNames.push(sp.name);
          }
        }
        existingKeys.add(key);
        saved += 1;
        await sleep(1500);
      } catch (err) {
        log(
          `  Full mock ${spec.testNumber} section ${sectionNumber} failed — ${err.message}`
        );
      }
    }
  }

  return saved;
}

async function runListeningTestGeneration() {
  assertEnv();

  const generationDate = getTodayDateKey();
  const supabase = getSupabase();
  const generateFn = await loadGenerator();

  log("========================================");
  log("IELTS Listening — dual pool generation");
  log(`Date: ${generationDate}`);
  log(
    `Targets: ${PRACTICE_SETS_PER_SECTION * 4} section_practice + ${FULL_MOCK_TESTS_PER_DAY * 4} full_mock rows`
  );
  log("========================================");

  const practiceSaved = await runSectionPracticeGeneration(
    supabase,
    generationDate,
    generateFn
  );

  log(`Section practice: ${practiceSaved} new row(s) saved`);

  await sleep(3000);

  const mockSaved = await runFullMockGeneration(
    supabase,
    generationDate,
    generateFn
  );

  log(`Full mock: ${mockSaved} new row(s) saved`);

  const practiceStatus = await getTodayRows(
    supabase,
    generationDate,
    CONTENT_TYPE_SECTION_PRACTICE
  );
  const mockStatus = await getTodayRows(
    supabase,
    generationDate,
    CONTENT_TYPE_FULL_MOCK
  );

  log("========================================");
  log(
    `Done — practice ${practiceStatus.rowCount}/${PRACTICE_SETS_PER_SECTION * 4}, mock ${mockStatus.rowCount}/${FULL_MOCK_TESTS_PER_DAY * 4}`
  );
  log("Next run: 3:00 AM tomorrow");
  log("========================================");

  return {
    practiceSaved,
    mockSaved,
    practiceRows: practiceStatus.rowCount,
    mockRows: mockStatus.rowCount,
  };
}

let generationRunning = false;

async function runScheduledGeneration(trigger) {
  if (generationRunning) {
    log(`Skipping ${trigger} — already in progress`);
    return;
  }

  generationRunning = true;
  try {
    await runListeningTestGeneration();
  } catch (err) {
    console.error("[ListeningGen] Fatal error:", err.message);
  } finally {
    generationRunning = false;
  }
}

cron.schedule(CRON_SCHEDULE, () => {
  log("Cron triggered — 3:00 AM daily run");
  runScheduledGeneration("cron").catch((err) => {
    console.error("[ListeningGen] Cron failed:", err.message);
  });
});

if (require.main === module) {
  runScheduledGeneration("startup")
    .then(() => {
      log("Process alive — waiting for next cron run (3:00 AM)");
    })
    .catch((err) => {
      console.error("[ListeningGen] Startup failed:", err.message);
      process.exit(1);
    });
}

module.exports = {
  runListeningTestGeneration,
  MOCK_TEST_SPECS,
  PRACTICE_TOPICS_BY_SECTION,
  getTodayDateKey,
};
