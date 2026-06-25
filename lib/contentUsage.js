/**
 * Student-level content usage tracking.
 * Prevents the same audio, passage, or topic from being reassigned to a student.
 */

const { createClient } = require("@supabase/supabase-js");
const {
  extractContentItemsFromTest,
  buildUsedContentIndex,
  findUsedContentInTest,
  excludeUsedContentFromTests,
} = require("./accelerator/studentContentUsage.js");

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_KEY required");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

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

/** Mark content as used when a student starts or completes any activity */
async function markContentAsUsed(studentId, contentItems, attemptId) {
  if (!studentId || !contentItems?.length) return { inserted: 0 };

  const supabase = getSupabase();
  const rows = contentItems.map((item) => ({
    student_id: studentId,
    content_id: item.contentId ?? item.content_id,
    content_type: item.contentType ?? item.content_type,
    linked_parent_id: item.parentId ?? item.linked_parent_id ?? null,
    section: item.section ?? null,
    band_track: item.bandTrack ?? item.band_track ?? null,
    topic: item.topic ?? null,
    difficulty_band: item.difficultyBand ?? item.difficulty_band ?? null,
    source_activity_type: item.activityType ?? item.source_activity_type ?? null,
    attempt_id: attemptId ?? null,
    used_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from("student_content_usage").upsert(rows, {
    onConflict: "student_id,content_id",
  });

  if (error) {
    if (isMissingSchemaError(error)) {
      console.warn("[contentUsage] student_content_usage table missing — skipping");
      return { inserted: 0, skipped: true };
    }
    throw error;
  }

  return { inserted: rows.length };
}

/** Get all content IDs a student has already seen */
async function getUsedContentForStudent(studentId, section = null) {
  const supabase = getSupabase();
  let query = supabase
    .from("student_content_usage")
    .select("content_id, linked_parent_id, topic, section, content_type")
    .eq("student_id", studentId);

  if (section) query = query.eq("section", section);

  const { data, error } = await query;

  if (error) {
    if (isMissingSchemaError(error)) {
      console.warn("[contentUsage] student_content_usage table missing — returning []");
      return [];
    }
    throw new Error(`Failed to load used content: ${error.message}`);
  }

  return data || [];
}

/** Filter out content the student has already seen (simple candidate list) */
async function excludeUsedContent(studentId, candidateContent, section = null) {
  const used = await getUsedContentForStudent(studentId, section);
  const usedIds = new Set(used.map((u) => u.content_id));
  const usedTopics = new Set(used.map((u) => u.topic).filter(Boolean));
  const usedParents = new Set(
    used.map((u) => u.linked_parent_id).filter(Boolean)
  );

  return (candidateContent ?? []).filter((content) => {
    const id = content.id ?? content.contentId ?? content.content_id;
    if (id && usedIds.has(id)) return false;
    if (id && usedParents.has(id)) return false;
    if (content.topic && usedTopics.has(content.topic)) return false;
    return true;
  });
}

/** Filter accelerator mock test rows by granular content usage */
async function excludeUsedTests(studentId, tests, opts = {}) {
  const used = await getUsedContentForStudent(studentId, opts.section ?? null);
  const index = buildUsedContentIndex(
    used.map((u) => ({
      content_id: u.content_id,
      content_type: u.content_type ?? "unknown",
      linked_parent_id: u.linked_parent_id,
      topic: u.topic,
      section: u.section,
    }))
  );
  return excludeUsedContentFromTests(tests ?? [], index, opts);
}

/** Validate a mock test has no repeated content for this student */
async function validateFreshMockTest(studentId, mockTestPayload, opts = {}) {
  const onlySection = opts.section ?? null;
  const used = await getUsedContentForStudent(studentId, onlySection);
  const usedIds = new Set(used.map((u) => u.content_id));
  const usedTopics = new Set(used.map((u) => u.topic).filter(Boolean));

  const issues = [];
  const content = mockTestPayload.content ?? mockTestPayload;

  const topicChecks = [
    { section: "listening", topic: content.listening?.topic ?? mockTestPayload.topic },
    { section: "reading", topic: content.reading?.topic ?? mockTestPayload.topic },
    { section: "writing", topic: content.writing?.topic ?? mockTestPayload.topic },
    { section: "speaking", topic: content.speaking?.topic ?? mockTestPayload.topic },
  ];

  for (const { section, topic } of topicChecks) {
    if (onlySection && section !== onlySection) continue;
    if (topic && usedTopics.has(topic)) {
      issues.push(`${section} topic already used: ${topic}`);
    }
  }

  const index = buildUsedContentIndex(
    used.map((u) => ({
      content_id: u.content_id,
      content_type: u.content_type ?? "unknown",
      linked_parent_id: u.linked_parent_id,
      topic: u.topic,
      section: u.section,
    }))
  );

  const extractOpts = {
    section: onlySection,
    sourceActivityType: opts.sourceActivityType ?? mockTestPayload.test_type ?? "full_mock",
    bandTrack: opts.bandTrack ?? mockTestPayload.track ?? null,
  };

  const granular = findUsedContentInTest(
    mockTestPayload.id ? mockTestPayload : { content, id: mockTestPayload.id, topic: mockTestPayload.topic },
    index,
    extractOpts
  );

  if (granular.used) {
    for (const dup of granular.duplicates.slice(0, 5)) {
      issues.push(
        `Content already used: ${dup.item?.content_type} ${dup.item?.content_id} (${dup.reason})`
      );
    }
  }

  for (const id of usedIds) {
    if (mockTestPayload.id && id === `test:${mockTestPayload.id}`) {
      issues.push(`Test ID already used: ${mockTestPayload.id}`);
    }
  }

  return {
    isValid: issues.length === 0,
    valid: issues.length === 0,
    issues,
    requiresRegeneration: issues.length > 0,
  };
}

/** Mark all trackable pieces from an accelerator test row */
async function markTestContentAsUsed(studentId, test, opts = {}) {
  const attemptId =
    opts.attemptId ?? `${test.id ?? "test"}:${studentId}:${Date.now()}`;

  const items = extractContentItemsFromTest(test, {
    section: opts.section ?? null,
    sourceActivityType: opts.sourceActivityType ?? opts.activityType ?? "section_practice",
    attemptId,
    bandTrack: opts.bandTrack ?? test.track,
  }).map((item) => ({
    contentId: item.content_id,
    contentType: item.content_type,
    parentId: item.linked_parent_id,
    section: item.section,
    bandTrack: item.band_track,
    topic: item.topic,
    difficultyBand: item.difficulty_band,
    activityType: item.source_activity_type,
  }));

  return markContentAsUsed(studentId, items, attemptId);
}

module.exports = {
  markContentAsUsed,
  getUsedContentForStudent,
  excludeUsedContent,
  excludeUsedTests,
  validateFreshMockTest,
  markTestContentAsUsed,
  getSupabase,
};
