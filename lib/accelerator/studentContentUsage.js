/**
 * Student-level content usage tracking for IELTS Accelerator.
 * Excludes previously used audio, passages, question sets, and prompts from future assignments.
 */

const crypto = require("crypto");

const CONTENT_TYPES = {
  AUDIO: "audio",
  TRANSCRIPT: "transcript",
  QUESTION_SET: "question_set",
  QUESTION: "question",
  PASSAGE: "passage",
  PROMPT: "prompt",
  TOPIC: "topic",
};

const SECTIONS = ["listening", "reading", "writing", "speaking"];

function isMissingSchemaError(error) {
  if (!error) return false;
  const msg = String(error.message ?? "").toLowerCase();
  const code = String(error.code ?? "");
  return (
    code === "PGRST205" ||
    code === "42P01" ||
    msg.includes("could not find the table") ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
}

function hashContent(text) {
  return crypto
    .createHash("sha256")
    .update(String(text ?? ""))
    .digest("hex")
    .slice(0, 20);
}

function questionText(q) {
  if (!q || typeof q !== "object") return "";
  return String(
    q.question_text ?? q.question ?? q.prompt ?? q.stem ?? q.text ?? ""
  ).trim();
}

function flattenQuestions(questionsRaw, depth = 0) {
  if (!Array.isArray(questionsRaw) || depth > 4) return [];
  const out = [];
  for (const item of questionsRaw) {
    if (!item || typeof item !== "object") continue;
    if (Array.isArray(item.questions)) {
      out.push(...flattenQuestions(item.questions, depth + 1));
      continue;
    }
    out.push(item);
  }
  return out;
}

function listeningParts(listeningContent) {
  if (!listeningContent || typeof listeningContent !== "object") return [];
  if (Array.isArray(listeningContent.sections)) return listeningContent.sections;
  if (Array.isArray(listeningContent.parts)) return listeningContent.parts;
  if (Array.isArray(listeningContent.questions)) {
    const first = listeningContent.questions[0];
    if (
      first &&
      typeof first === "object" &&
      (first.part != null ||
        first.section != null ||
        first.transcript ||
        Array.isArray(first.questions))
    ) {
      return listeningContent.questions;
    }
  }
  return [];
}

function readingPassages(readingContent) {
  if (!readingContent || typeof readingContent !== "object") return [];
  return Array.isArray(readingContent.passages) ? readingContent.passages : [];
}

function baseMeta(test, opts) {
  return {
    band_track: opts.bandTrack ?? test.track ?? null,
    topic: test.topic ?? null,
    difficulty_band: test.difficulty ?? test.target_band ?? null,
    source_activity_type: opts.sourceActivityType ?? "section_practice",
    attempt_id: opts.attemptId ?? null,
  };
}

function pushItem(items, fields) {
  items.push({
    linked_parent_id: null,
    section: null,
    topic: null,
    difficulty_band: null,
    metadata: null,
    ...fields,
  });
}

/**
 * Extract trackable content items from an accelerator test row or payload.
 * @param {object} test — accelerator_mock_tests row or { id, track, topic, content, ... }
 * @param {object} [opts]
 * @param {string} [opts.section] — limit to one section (listening|reading|...)
 * @param {string} [opts.sourceActivityType]
 * @param {string} [opts.attemptId]
 * @param {string} [opts.bandTrack]
 */
function extractContentItemsFromTest(test, opts = {}) {
  if (!test?.content) return [];

  const items = [];
  const meta = baseMeta(test, opts);
  const onlySection = opts.section ?? null;
  const content = test.content;
  const testId = test.id ?? "unknown";

  const isFullMock =
    test.test_type === "full_mock" ||
    Boolean(content.listening || content.reading || content.writing || content.speaking);

  function shouldInclude(section) {
    if (!onlySection) return true;
    return onlySection === section;
  }

  // —— Listening ——
  if (shouldInclude("listening")) {
    const listeningRoot = isFullMock ? content.listening : content;
    for (const [idx, part] of listeningParts(listeningRoot).entries()) {
      const sectionNum = Number(part.section ?? part.part ?? idx + 1);
      const transcript = String(
        part.transcript ?? part.audio_script ?? part.script ?? ""
      ).trim();
      const audioId = `audio:lis:${hashContent(transcript)}`;
      const transcriptId = `transcript:lis:${hashContent(transcript)}`;
      const questions = flattenQuestions(part.questions);
      const qsFingerprint = questions.map((q, i) => {
        const num = q.number ?? q.questionNumber ?? i + 1;
        return `${num}:${questionText(q)}`;
      });
      const questionSetId = `qset:lis:${hashContent(
        `${transcript}|${qsFingerprint.join("|")}`
      )}`;

      if (transcript) {
        pushItem(items, {
          content_id: audioId,
          content_type: CONTENT_TYPES.AUDIO,
          section: "listening",
          ...meta,
          metadata: {
            test_id: testId,
            section_number: sectionNum,
            audio_id: audioId,
            transcript_id: transcriptId,
            question_set_id: questionSetId,
          },
        });

        pushItem(items, {
          content_id: transcriptId,
          content_type: CONTENT_TYPES.TRANSCRIPT,
          linked_parent_id: audioId,
          section: "listening",
          ...meta,
          metadata: {
            test_id: testId,
            section_number: sectionNum,
            audio_id: audioId,
            transcript_id: transcriptId,
            question_set_id: questionSetId,
          },
        });
      }

      if (questions.length) {
        pushItem(items, {
          content_id: questionSetId,
          content_type: CONTENT_TYPES.QUESTION_SET,
          linked_parent_id: transcript ? audioId : null,
          section: "listening",
          ...meta,
          metadata: {
            test_id: testId,
            section_number: sectionNum,
            audio_id: audioId,
            transcript_id: transcriptId,
            question_set_id: questionSetId,
            question_count: questions.length,
          },
        });

        for (const [qi, q] of questions.entries()) {
          const num = q.number ?? q.questionNumber ?? qi + 1;
          const qText = questionText(q);
          const questionId = `question:lis:${hashContent(`${sectionNum}:${num}:${qText}`)}`;
          pushItem(items, {
            content_id: questionId,
            content_type: CONTENT_TYPES.QUESTION,
            linked_parent_id: questionSetId,
            section: "listening",
            ...meta,
            metadata: {
              test_id: testId,
              section_number: sectionNum,
              question_number: num,
              audio_id: audioId,
              question_set_id: questionSetId,
            },
          });
        }
      }
    }
  }

  // —— Reading ——
  if (shouldInclude("reading")) {
    const readingRoot = isFullMock ? content.reading : content;
    for (const [idx, passage] of readingPassages(readingRoot).entries()) {
      const passageNum = Number(
        passage.passage ?? passage.passage_number ?? idx + 1
      );
      const text = String(passage.text ?? passage.passage_text ?? "").trim();
      const passageId = `passage:read:${hashContent(text)}`;
      const questions = flattenQuestions(passage.questions);
      const qsFingerprint = questions.map((q, i) => {
        const num = q.number ?? q.questionNumber ?? i + 1;
        return `${num}:${questionText(q)}`;
      });
      const questionSetId = `qset:read:${hashContent(
        `${text}|${qsFingerprint.join("|")}`
      )}`;

      if (text) {
        pushItem(items, {
          content_id: passageId,
          content_type: CONTENT_TYPES.PASSAGE,
          section: "reading",
          ...meta,
          metadata: {
            test_id: testId,
            passage_number: passageNum,
            passage_id: passageId,
            question_set_id: questionSetId,
          },
        });
      }

      if (questions.length) {
        pushItem(items, {
          content_id: questionSetId,
          content_type: CONTENT_TYPES.QUESTION_SET,
          linked_parent_id: text ? passageId : null,
          section: "reading",
          ...meta,
          metadata: {
            test_id: testId,
            passage_number: passageNum,
            passage_id: passageId,
            question_set_id: questionSetId,
            question_count: questions.length,
          },
        });

        for (const [qi, q] of questions.entries()) {
          const num = q.number ?? q.questionNumber ?? qi + 1;
          const qText = questionText(q);
          const questionId = `question:read:${hashContent(`${passageNum}:${num}:${qText}`)}`;
          pushItem(items, {
            content_id: questionId,
            content_type: CONTENT_TYPES.QUESTION,
            linked_parent_id: questionSetId,
            section: "reading",
            ...meta,
            metadata: {
              test_id: testId,
              passage_number: passageNum,
              question_number: num,
              passage_id: passageId,
              question_set_id: questionSetId,
            },
          });
        }
      }
    }
  }

  // —— Writing ——
  if (shouldInclude("writing")) {
    const writingRoot = isFullMock ? content.writing : content;
    for (const taskKey of ["task1", "task2"]) {
      const task = writingRoot?.[taskKey];
      if (!task) continue;
      const prompt = String(task.prompt ?? task.question ?? "").trim();
      if (!prompt) continue;
      const promptId = `prompt:writing:${taskKey}:${hashContent(prompt)}`;
      pushItem(items, {
        content_id: promptId,
        content_type: CONTENT_TYPES.PROMPT,
        section: "writing",
        ...meta,
        metadata: {
          test_id: testId,
          task_type: taskKey,
          prompt_id: promptId,
        },
      });
    }
  }

  // —— Speaking ——
  if (shouldInclude("speaking")) {
    const speakingRoot = isFullMock ? content.speaking : content;
    for (const partKey of ["part1", "part2", "part3"]) {
      const part = speakingRoot?.[partKey];
      if (!part) continue;
      const prompt = String(
        part.cue_card ??
          part.topic ??
          (Array.isArray(part.questions) ? part.questions.join("|") : "")
      ).trim();
      if (!prompt) continue;
      const promptId = `prompt:speaking:${partKey}:${hashContent(prompt)}`;
      pushItem(items, {
        content_id: promptId,
        content_type: CONTENT_TYPES.PROMPT,
        section: "speaking",
        ...meta,
        metadata: {
          test_id: testId,
          task_type: partKey,
          prompt_id: promptId,
        },
      });
    }
  }

  // —— Topic (per section when scoped) ——
  if (test.topic) {
    const topicSections = onlySection ? [onlySection] : SECTIONS;
    for (const sec of topicSections) {
      pushItem(items, {
        content_id: `topic:${sec}:${hashContent(test.topic)}`,
        content_type: CONTENT_TYPES.TOPIC,
        section: sec,
        topic: test.topic,
        ...meta,
        metadata: { test_id: testId, topic: test.topic },
      });
    }
  }

  return items;
}

/**
 * @param {Array<object>} rows — DB rows from student_content_usage
 */
function buildUsedContentIndex(rows) {
  const index = {
    contentIds: new Set(),
    audioIds: new Set(),
    transcriptIds: new Set(),
    passageIds: new Set(),
    promptIds: new Set(),
    questionSetIds: new Set(),
    topicKeys: new Set(),
    /** parent content_id -> Set of child content_ids seen as used */
    usedParentIds: new Set(),
    rows: rows ?? [],
  };

  for (const row of rows ?? []) {
    const id = String(row.content_id);
    index.contentIds.add(id);
    index.usedParentIds.add(id);

    switch (row.content_type) {
      case CONTENT_TYPES.AUDIO:
        index.audioIds.add(id);
        break;
      case CONTENT_TYPES.TRANSCRIPT:
        index.transcriptIds.add(id);
        break;
      case CONTENT_TYPES.PASSAGE:
        index.passageIds.add(id);
        break;
      case CONTENT_TYPES.PROMPT:
        index.promptIds.add(id);
        break;
      case CONTENT_TYPES.QUESTION_SET:
        index.questionSetIds.add(id);
        break;
      case CONTENT_TYPES.TOPIC:
        index.topicKeys.add(id);
        break;
      default:
        break;
    }
  }

  return index;
}

/**
 * Check whether extracted test content overlaps student usage history.
 * @returns {{ used: boolean, duplicates: Array<object> }}
 */
function findUsedContentInTest(test, index, opts = {}) {
  const items = extractContentItemsFromTest(test, opts);
  const duplicates = [];

  for (const item of items) {
    if (index.contentIds.has(item.content_id)) {
      duplicates.push({ item, reason: "direct_match" });
      continue;
    }

    if (
      item.linked_parent_id &&
      index.usedParentIds.has(item.linked_parent_id)
    ) {
      duplicates.push({
        item,
        reason: "linked_parent_used",
        parent_id: item.linked_parent_id,
      });
      continue;
    }

    if (
      item.content_type === CONTENT_TYPES.QUESTION_SET &&
      item.linked_parent_id &&
      index.audioIds.has(item.linked_parent_id)
    ) {
      duplicates.push({
        item,
        reason: "audio_linked_question_set",
        parent_id: item.linked_parent_id,
      });
      continue;
    }

    if (
      item.content_type === CONTENT_TYPES.QUESTION_SET &&
      item.linked_parent_id &&
      index.passageIds.has(item.linked_parent_id)
    ) {
      duplicates.push({
        item,
        reason: "passage_linked_question_set",
        parent_id: item.linked_parent_id,
      });
    }
  }

  return { used: duplicates.length > 0, duplicates };
}

/**
 * @param {object} supabase
 * @param {string} studentId
 */
async function getUsedContentForStudent(supabase, studentId) {
  const { data, error } = await supabase
    .from("student_content_usage")
    .select("*")
    .eq("student_id", studentId)
    .order("used_at", { ascending: false });

  if (error) {
    if (isMissingSchemaError(error)) {
      console.warn(
        "[studentContentUsage] student_content_usage table missing — run: npm run setup:student-content-usage"
      );
      return [];
    }
    throw new Error(`Failed to load used content: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Filter candidate tests, excluding any with used content for this student.
 * @param {Array<object>} tests
 * @param {object} index — from buildUsedContentIndex
 * @param {object} [opts] — passed to extractContentItemsFromTest
 */
function excludeUsedContentFromTests(tests, index, opts = {}) {
  const fresh = [];
  const excluded = [];

  for (const test of tests ?? []) {
    const check = findUsedContentInTest(test, index, opts);
    if (check.used) {
      excluded.push({ test, duplicates: check.duplicates });
    } else {
      fresh.push(test);
    }
  }

  return { fresh, excluded };
}

/**
 * Validate a mock test payload before assigning to a student.
 * @returns {{ valid: boolean, duplicates: Array<object> }}
 */
function validateFreshMockTest(studentId, mockTestPayload, usedRowsOrIndex, opts = {}) {
  void studentId;
  const index = Array.isArray(usedRowsOrIndex)
    ? buildUsedContentIndex(usedRowsOrIndex)
    : usedRowsOrIndex ?? buildUsedContentIndex([]);

  const { used, duplicates } = findUsedContentInTest(mockTestPayload, index, opts);
  return { valid: !used, duplicates };
}

/**
 * @param {object} supabase
 * @param {string} studentId
 * @param {Array<object>} contentItems — from extractContentItemsFromTest
 * @param {string} [attemptId]
 */
async function markContentAsUsed(supabase, studentId, contentItems, attemptId) {
  if (!studentId || !contentItems?.length) return { inserted: 0, skipped: true };

  const now = new Date().toISOString();
  const rows = contentItems.map((item) => ({
    student_id: studentId,
    content_id: item.content_id,
    content_type: item.content_type,
    linked_parent_id: item.linked_parent_id ?? null,
    section: item.section ?? null,
    band_track: item.band_track ?? null,
    topic: item.topic ?? null,
    difficulty_band: item.difficulty_band ?? null,
    source_activity_type: item.source_activity_type ?? null,
    attempt_id: attemptId ?? item.attempt_id ?? null,
    used_at: now,
    metadata: item.metadata ?? null,
  }));

  const { error } = await supabase.from("student_content_usage").upsert(rows, {
    onConflict: "student_id,content_id",
    ignoreDuplicates: false,
  });

  if (error) {
    if (isMissingSchemaError(error)) {
      console.warn(
        "[studentContentUsage] student_content_usage missing — run: npm run setup:student-content-usage"
      );
      return { inserted: 0, skipped: true, reason: "table_missing" };
    }
    console.warn("[studentContentUsage] markContentAsUsed:", error.message);
    return { inserted: 0, error: error.message };
  }

  return { inserted: rows.length };
}

/**
 * Mark all content from a test as used for a student (start or complete).
 */
async function markTestContentAsUsed(supabase, studentId, test, opts = {}) {
  const attemptId =
    opts.attemptId ??
    `${test.id ?? "test"}:${studentId}:${Date.now()}`;

  const items = extractContentItemsFromTest(test, {
    section: opts.section ?? null,
    sourceActivityType: opts.sourceActivityType ?? "section_practice",
    attemptId,
    bandTrack: opts.bandTrack ?? test.track,
  });

  return markContentAsUsed(supabase, studentId, items, attemptId);
}

function logDuplicateAssignment(studentId, test, validation) {
  console.warn("[studentContentUsage] Blocked duplicate content assignment", {
    studentId,
    testId: test?.id,
    testType: test?.test_type,
    duplicateCount: validation.duplicates?.length ?? 0,
    samples: (validation.duplicates ?? []).slice(0, 3).map((d) => ({
      content_id: d.item?.content_id,
      type: d.item?.content_type,
      reason: d.reason,
    })),
  });
}

/**
 * Filter candidate tests for a student (loads usage history automatically).
 * @param {object} supabase
 * @param {string} studentId
 * @param {Array<object>|object} candidateContent — test row(s)
 * @param {object} [opts]
 */
async function excludeUsedContent(supabase, studentId, candidateContent, opts = {}) {
  const tests = Array.isArray(candidateContent)
    ? candidateContent
    : [candidateContent];
  const usedRows = await getUsedContentForStudent(supabase, studentId);
  const index = buildUsedContentIndex(usedRows);
  return excludeUsedContentFromTests(tests, index, opts);
}

module.exports = {
  CONTENT_TYPES,
  hashContent,
  extractContentItemsFromTest,
  buildUsedContentIndex,
  findUsedContentInTest,
  getUsedContentForStudent,
  excludeUsedContentFromTests,
  excludeUsedContent,
  validateFreshMockTest,
  markContentAsUsed,
  markTestContentAsUsed,
  logDuplicateAssignment,
};
