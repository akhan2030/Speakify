import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { bankPassageToPracticeContent } from "./passageContentAdapter.js";
import {
  getQuestionTypeName,
  normalizeQuestionType,
} from "./readingPassageTypes.js";
import { validateReadingPracticeContent } from "./readingQuestionContent.js";

const MODEL = "gpt-4o-mini";
const TEMPERATURE = 0;

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getSupabase() {
  if (!process.env.SUPABASE_SERVICE_KEY || !getSupabaseUrl()) return null;
  return createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * @param {string} questionType
 */
function buildGenerationPrompt(questionType, previousTopics) {
  const type = normalizeQuestionType(questionType);
  const topicList =
    previousTopics.length > 0
      ? previousTopics.join(", ")
      : "none yet";

  const questionRules = {
    "multiple-choice": "13 questions, 4 options each (A B C D)",
    "true-false-not-given": "13 True/False/Not Given statements",
    "matching-headings": "7 paragraph heading matches, provide 10 heading options (i–x)",
    "matching-information": "13 items to match to paragraphs A–G",
    "matching-features": "13 items to classify into categories",
    "matching-sentence-endings": "13 sentence starts to match with endings",
    "sentence-completion": "13 sentences to complete (max 3 words from passage)",
    "summary-completion": "13 gaps in a summary paragraph",
    "note-completion": "13 note-completion gaps",
    "short-answer": "13 short-answer questions (max 3 words)",
    "diagram-completion": "13 diagram labels to complete",
    classification: "13 items to classify into given categories",
  };

  return `Generate a unique IELTS Academic Reading passage with questions.
Topic must be academic, factual, and engaging. Question type: ${type}.
Do NOT use these topics the student has already seen: ${topicList}.

Return ONLY valid JSON (no markdown) in this exact shape:
{
  "title": "string",
  "topic": "string",
  "content": "string (600-800 words, academic style, paragraphs starting with A. B. C. etc. each on new line)",
  "questionType": "${type}",
  "headings": [],
  "questions": [
    {
      "id": 1,
      "text": "string",
      "type": "${type}",
      "options": [],
      "answer": "string",
      "explanation": "string"
    }
  ]
}

Rules for ${type}: ${questionRules[type] ?? "13 questions appropriate to the type"}.
For multiple-choice, options must be array of { "key": "A", "label": "text" }.
For true-false-not-given: answers must be TRUE, FALSE, or NOT GIVEN only — and the passage MUST use all three types across its questions (not only TRUE/FALSE).
For matching-headings you MUST include:
- "headings": array of 10 objects { "key": "i", "label": "heading text" } through "x" (more headings than paragraphs)
- One question per paragraph: { "id": 1, "text": "Paragraph A", "answer": "iii", "paragraphId": "pA" } — NOT a single generic "match headings" question
- Each per-paragraph question may repeat the same "headings" array or omit it (we copy from the first)
- CRITICAL: correct answers must NOT follow paragraph order (NOT A→i, B→ii, C→iii). Distribute answers across the list (e.g. A→vii, B→ii, C→ix). Include 2–3 distractor headings that match no paragraph.
Answers must be unambiguous from the passage only.`;
}

/**
 * @param {string} raw
 */
function parseJsonFromResponse(raw) {
  const text = String(raw ?? "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : text;
  return JSON.parse(candidate);
}

/**
 * @param {object} generated
 * @param {string} questionType
 */
function buildAnswersMap(generated) {
  /** @type {Record<string, string>} */
  const answers = {};
  const questions = Array.isArray(generated.questions) ? generated.questions : [];
  questions.forEach((q, index) => {
    const id = String(q.id ?? index + 1);
    answers[id] = String(q.answer ?? q.correct ?? "").trim();
  });
  return { questions, answers };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} studentId
 */
async function getSeenPassageIds(supabase, studentId) {
  const { data, error } = await supabase
    .from("student_passage_history")
    .select("passage_id")
    .eq("student_id", studentId);

  if (error) {
    console.warn("[passageGenerator] history read:", error.message);
    return new Set();
  }

  return new Set((data ?? []).map((row) => Number(row.passage_id)));
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} studentId
 */
async function getPreviousTopics(supabase, studentId) {
  const { data: history } = await supabase
    .from("student_passage_history")
    .select("passage_id")
    .eq("student_id", studentId);

  const ids = (history ?? []).map((h) => h.passage_id).filter(Boolean);
  if (ids.length === 0) return [];

  const { data: passages } = await supabase
    .from("passage_bank")
    .select("topic, title")
    .in("id", ids);

  const topics = new Set();
  for (const row of passages ?? []) {
    if (row.topic) topics.add(row.topic);
    if (row.title) topics.add(row.title);
  }
  return [...topics];
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {object} row
 * @param {string} studentId
 * @param {string} testType
 */
async function recordPassageHistory(supabase, studentId, row, testType) {
  await supabase.from("student_passage_history").insert({
    student_id: studentId,
    passage_id: row.id,
    test_type: testType,
  });

  const usedBy = Array.isArray(row.used_by) ? row.used_by : [];
  if (!usedBy.includes(studentId)) {
    usedBy.push(studentId);
    await supabase
      .from("passage_bank")
      .update({ used_by: usedBy })
      .eq("id", row.id);
  }
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} questionType
 * @param {Set<number>} seenIds
 */
async function findUnusedPassage(supabase, questionType, seenIds) {
  const { data, error } = await supabase
    .from("passage_bank")
    .select("*")
    .eq("question_type", questionType)
    .order("created_at", { ascending: true });

  if (error) {
    console.warn("[passageGenerator] bank read:", error.message);
    return null;
  }

  const slug = normalizeQuestionType(questionType);
  for (const row of data ?? []) {
    if (seenIds.has(Number(row.id))) continue;
    if (toValidatedPracticeContent(row, slug)) return row;
  }
  return null;
}

/**
 * @param {string} questionType
 * @param {string} studentId
 * @param {string[]} previousTopics
 */
async function generateWithOpenAI(questionType, studentId, previousTopics) {
  const openai = getOpenAI();
  if (!openai) {
    throw new Error("OpenAI is not configured");
  }

  const completion = await openai.chat.completions.create({
    model: MODEL,
    temperature: TEMPERATURE,
    messages: [
      {
        role: "system",
        content:
          "You are an expert IELTS Academic Reading test writer. Output only valid JSON.",
      },
      {
        role: "user",
        content: buildGenerationPrompt(questionType, previousTopics),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "";
  const parsed = parseJsonFromResponse(raw);
  const { questions, answers } = buildAnswersMap(parsed);

  const generated = {
    title: String(parsed.title ?? `${getQuestionTypeName(questionType)} Passage`),
    topic: String(parsed.topic ?? "General Academic"),
    content: String(parsed.content ?? ""),
    difficulty: "medium",
    question_type: normalizeQuestionType(questionType),
    headings: Array.isArray(parsed.headings) ? parsed.headings : undefined,
    questions,
    answers,
    student_id: studentId,
  };

  const content = bankPassageToPracticeContent(
    { ...generated, id: `validate-${Date.now()}` },
    normalizeQuestionType(questionType)
  );
  const validated = assertGeneratedContentValid(content, questionType);
  return syncGeneratedFromValidatedContent(generated, validated, questionType);
}

function syncGeneratedFromValidatedContent(raw, content, questionType) {
  const slug = normalizeQuestionType(questionType);
  if (slug !== "matching-headings") return raw;

  /** @type {Record<string, string>} */
  const answers = {};
  const sharedHeadings = content.headings ?? [];
  const questions = (content.questions ?? []).map((q) => {
    const id = String(q.id);
    answers[id] = String(q.correct ?? "");
    return {
      id: q.id,
      text: q.text,
      type: slug,
      answer: q.correct,
      paragraphId: q.paragraphId,
      headings: sharedHeadings,
    };
  });

  return {
    ...raw,
    headings: content.headings ?? raw.headings,
    questions,
    answers,
  };
}

const MAX_GENERATION_ATTEMPTS = 2;

async function generateWithOpenAIRetry(questionType, studentId, previousTopics) {
  let lastError = null;
  for (let attempt = 1; attempt <= MAX_GENERATION_ATTEMPTS; attempt += 1) {
    try {
      return await generateWithOpenAI(questionType, studentId, previousTopics);
    } catch (err) {
      lastError = err;
      console.warn(
        `[passageGenerator] attempt ${attempt}/${MAX_GENERATION_ATTEMPTS} failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Failed to generate reading passage");
}

function toValidatedPracticeContent(bankRow, slug) {
  const content = bankPassageToPracticeContent(bankRow, slug);
  const check = validateReadingPracticeContent(content);
  if (!check.valid) {
    console.warn(
      `[passageGenerator] invalid bank row ${bankRow.id} (${slug}):`,
      check.errors.join("; ")
    );
    return null;
  }
  return check.content ?? content;
}

function assertGeneratedContentValid(content, questionType) {
  const check = validateReadingPracticeContent(content);
  if (!check.valid) {
    throw new Error(
      `Generated ${questionType} passage failed validation: ${check.errors.join("; ")}`
    );
  }
  return check.content ?? content;
}

/**
 * @param {string} questionType
 * @param {string} studentId
 * @param {string} [testType]
 */
export async function generatePassage(
  questionType,
  studentId,
  testType = "practice"
) {
  const slug = normalizeQuestionType(questionType);
  const supabase = getSupabase();

  if (!supabase) {
    const generated = await generateWithOpenAIRetry(slug, studentId, []);
    const content = toValidatedPracticeContent(
      { ...generated, id: `temp-${Date.now()}` },
      slug
    );
    if (!content) {
      throw new Error("Generated passage failed validation");
    }
    return { content, bankId: null, generated: true };
  }

  const seenIds = await getSeenPassageIds(supabase, studentId);
  let bankRow = await findUnusedPassage(supabase, slug, seenIds);

  if (!bankRow) {
    const previousTopics = await getPreviousTopics(supabase, studentId);
    const generated = await generateWithOpenAIRetry(
      slug,
      studentId,
      previousTopics
    );

    const { data: inserted, error: insertError } = await supabase
      .from("passage_bank")
      .insert({
        title: generated.title,
        content: generated.content,
        topic: generated.topic,
        difficulty: generated.difficulty,
        question_type: slug,
        questions: generated.questions,
        answers: generated.answers,
        used_by: [studentId],
      })
      .select("*")
      .single();

    if (insertError) {
      console.warn("[passageGenerator] insert:", insertError.message);
      const content = toValidatedPracticeContent(
        { ...generated, id: `gen-${Date.now()}` },
        slug
      );
      if (!content) {
        throw new Error("Generated passage failed validation");
      }
      return { content, bankId: null, generated: true };
    }

    bankRow = inserted;
  }

  await recordPassageHistory(supabase, studentId, bankRow, testType);

  const content = toValidatedPracticeContent(bankRow, slug);
  if (!content) {
    throw new Error(
      "This reading passage is unavailable — question content is incomplete. Please try again."
    );
  }
  return {
    content,
    bankId: bankRow.id,
    generated: !seenIds.has(Number(bankRow.id)),
  };
}
