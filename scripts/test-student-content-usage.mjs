/**
 * Student content usage tracking tests
 * Run: npm run test:content-usage
 */
import assert from "node:assert/strict";
import {
  buildUsedContentIndex,
  extractContentItemsFromTest,
  excludeUsedContentFromTests,
  findUsedContentInTest,
  hashContent,
  markContentAsUsed,
  validateFreshMockTest,
  CONTENT_TYPES,
} from "../lib/accelerator/studentContentUsage.js";

let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ok ${name}`);
  } catch (err) {
    failed += 1;
    console.error(`  FAIL ${name}:`, err instanceof Error ? err.message : err);
  }
}

const LISTENING_TRANSCRIPT =
  "Good morning. The library opens at nine on weekdays and closes at six.";

const sampleListeningTest = {
  id: "test-listening-a",
  track: "plus",
  test_type: "section_practice",
  section: "listening",
  topic: "Education Systems & Learning",
  target_band: "6.0-6.5",
  content: {
    parts: [
      {
        part: 1,
        transcript: LISTENING_TRANSCRIPT,
        questions: [
          {
            number: 1,
            question: "What time does the library open?",
            options: ["A) Eight", "B) Nine", "C) Ten", "D) Eleven"],
            correct_answer: "B",
          },
          {
            number: 2,
            question: "When does it close on weekdays?",
            options: ["A) Four", "B) Five", "C) Six", "D) Seven"],
            correct_answer: "C",
          },
        ],
      },
    ],
  },
};

const sampleReadingTest = {
  id: "test-reading-b",
  track: "plus",
  test_type: "section_practice",
  section: "reading",
  topic: "Technology & Digital Society",
  content: {
    passages: [
      {
        passage: 1,
        title: "Digital Learning",
        text: "Online education has transformed how students access knowledge worldwide.",
        questions: [
          {
            number: 1,
            question: "What has online education transformed?",
            type: "mcq",
            options: ["A) Transport", "B) Knowledge access", "C) Housing", "D) Food"],
          },
        ],
      },
    ],
  },
};

const sampleFullMock = {
  id: "test-full-mock",
  track: "foundation",
  test_type: "full_mock",
  topic: "Health & Medicine",
  content: {
    listening: sampleListeningTest.content,
    reading: sampleReadingTest.content,
    writing: {
      task1: { prompt: "Describe the chart showing hospital admissions." },
      task2: { prompt: "Discuss whether healthcare should be free." },
    },
    speaking: {
      part1: { questions: ["Do you exercise regularly?"] },
      part2: { cue_card: "Describe a time you visited a doctor." },
      part3: { questions: ["How is healthcare changing?"] },
    },
  },
};

console.log("Student content usage tests\n");

test("hashContent is stable", () => {
  assert.equal(hashContent("hello"), hashContent("hello"));
  assert.notEqual(hashContent("hello"), hashContent("world"));
});

test("extractContentItemsFromTest — listening includes audio, transcript, question_set", () => {
  const items = extractContentItemsFromTest(sampleListeningTest, {
    section: "listening",
    sourceActivityType: "section_practice",
  });
  const types = new Set(items.map((i) => i.content_type));
  assert.ok(types.has(CONTENT_TYPES.AUDIO));
  assert.ok(types.has(CONTENT_TYPES.TRANSCRIPT));
  assert.ok(types.has(CONTENT_TYPES.QUESTION_SET));
  assert.ok(types.has(CONTENT_TYPES.QUESTION));
});

test("Student completes Listening audio A — Full mock must not include audio A", () => {
  const listeningItems = extractContentItemsFromTest(sampleListeningTest, {
    section: "listening",
    sourceActivityType: "section_practice",
  });
  const audioItem = listeningItems.find((i) => i.content_type === CONTENT_TYPES.AUDIO);
  assert.ok(audioItem);

  const usedIndex = buildUsedContentIndex([
    {
      content_id: audioItem.content_id,
      content_type: CONTENT_TYPES.AUDIO,
      linked_parent_id: null,
    },
  ]);

  const fullMockCheck = findUsedContentInTest(sampleFullMock, usedIndex, {
    sourceActivityType: "full_mock",
  });
  assert.equal(fullMockCheck.used, true);
  assert.ok(
    fullMockCheck.duplicates.some(
      (d) =>
        d.item.content_type === CONTENT_TYPES.AUDIO ||
        d.item.content_type === CONTENT_TYPES.TRANSCRIPT ||
        d.item.content_type === CONTENT_TYPES.QUESTION_SET
    )
  );
});

test("Student completes Reading passage B — future mock excludes passage B", () => {
  const readingItems = extractContentItemsFromTest(sampleReadingTest, {
    section: "reading",
    sourceActivityType: "section_practice",
  });
  const passageItem = readingItems.find((i) => i.content_type === CONTENT_TYPES.PASSAGE);
  assert.ok(passageItem);

  const usedIndex = buildUsedContentIndex([
    {
      content_id: passageItem.content_id,
      content_type: CONTENT_TYPES.PASSAGE,
    },
  ]);

  const readingCheck = findUsedContentInTest(sampleReadingTest, usedIndex, {
    section: "reading",
  });
  assert.equal(readingCheck.used, true);

  const fullMockCheck = findUsedContentInTest(sampleFullMock, usedIndex, {
    sourceActivityType: "full_mock",
  });
  assert.equal(fullMockCheck.used, true);
});

test("Used content from Student 1 does not affect Student 2", () => {
  const student1Used = buildUsedContentIndex([
    {
      content_id: `audio:lis:${hashContent(LISTENING_TRANSCRIPT)}`,
      content_type: CONTENT_TYPES.AUDIO,
    },
  ]);

  const student2Index = buildUsedContentIndex([]);
  const s1Blocked = findUsedContentInTest(sampleListeningTest, student1Used, {
    section: "listening",
  });
  const s2Fresh = findUsedContentInTest(sampleListeningTest, student2Index, {
    section: "listening",
  });

  assert.equal(s1Blocked.used, true);
  assert.equal(s2Fresh.used, false);
});

test("excludeUsedContentFromTests filters candidate pool", () => {
  const audioId = `audio:lis:${hashContent(LISTENING_TRANSCRIPT)}`;
  const index = buildUsedContentIndex([
    { content_id: audioId, content_type: CONTENT_TYPES.AUDIO },
  ]);

  const { fresh, excluded } = excludeUsedContentFromTests(
    [sampleListeningTest],
    index,
    { section: "listening" }
  );

  assert.equal(fresh.length, 0);
  assert.equal(excluded.length, 1);
  assert.equal(excluded[0].test.id, "test-listening-a");
});

test("validateFreshMockTest blocks duplicate assignment", () => {
  const items = extractContentItemsFromTest(sampleListeningTest, {
    section: "listening",
  });
  const audio = items.find((i) => i.content_type === CONTENT_TYPES.AUDIO);

  const validation = validateFreshMockTest(
    "student-1",
    sampleListeningTest,
    [{ content_id: audio.content_id, content_type: CONTENT_TYPES.AUDIO }]
  );

  assert.equal(validation.valid, false);
  assert.ok(validation.duplicates.length > 0);
});

test("markContentAsUsed skips gracefully when table missing", async () => {
  const fakeSupabase = {
    from() {
      return {
        upsert: async () => ({
          error: {
            code: "PGRST205",
            message: "Could not find the table 'public.student_content_usage' in the schema cache",
          },
        }),
      };
    },
  };

  const result = await markContentAsUsed(
    fakeSupabase,
    "student-x",
    [{ content_id: "test:1", content_type: "topic" }],
    "attempt-1"
  );
  assert.equal(result.skipped, true);
});

console.log("");
if (failed > 0) {
  console.error(`${failed} test(s) failed`);
  process.exit(1);
}
console.log("All student content usage tests passed.");
