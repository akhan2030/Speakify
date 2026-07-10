import fs from "fs";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import {
  finalizeWritingBands,
  rewriteEvaluationScores,
} from "./ielts/writingBandScore.js";
import {
  TASK1_EVAL_RUBRIC,
  TASK2_EVAL_RUBRIC,
} from "./ielts/writingEvalPrompts.js";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const ASSISTANT_MODEL = "gpt-4o-mini";
const ASSISTANT_NAME = "IELTS Writing Expert";
const FILE_SEARCH_FILE_IDS = ["file-1fgutSTBet1VqxrALeekue"];

/** Shared assistant shell — task-specific rubric is sent in each user message. */
const ASSISTANT_INSTRUCTIONS = `You are an official IELTS Writing examiner trained by the British Council, Cambridge Assessment English, and IDP.

For every submission, follow the task-specific rubric and OUTPUT FORMAT in the user message exactly.

IELTS uses different names for the first criterion by task:
- Task 1 (report or letter): TA = Task Achievement
- Task 2 (essay): TR = Task Response

Never use TA for Task 2 or TR for Task 1. CC, LR, and GRA apply to both tasks.

Score in half-band steps on 0–9. Be consistent and strict.`;

function getAssistantCreateParams() {
  return {
    model: ASSISTANT_MODEL,
    name: ASSISTANT_NAME,
    instructions: ASSISTANT_INSTRUCTIONS,
    temperature: 0,
    tools: [{ type: "file_search" }],
    tool_resources: {
      file_search: {
        vector_stores: [
          {
            file_ids: FILE_SEARCH_FILE_IDS,
          },
        ],
      },
    },
  };
}

function updateEnvLocalAssistantId(assistantId) {
  const envPath = path.join(process.cwd(), ".env.local");
  const line = `OPENAI_ASSISTANT_ID=${assistantId}`;
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

  if (/^OPENAI_ASSISTANT_ID=.*/m.test(content)) {
    content = content.replace(/^OPENAI_ASSISTANT_ID=.*/m, line);
  } else {
    content = content.trimEnd() + (content ? "\n" : "") + `${line}\n`;
  }

  if (!content.endsWith("\n")) {
    content += "\n";
  }

  fs.writeFileSync(envPath, content, "utf8");
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
  if (missing.length) {
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

/**
 * Task 2's first criterion was corrected from Task Achievement (TA) to Task
 * Response (TR). Any evaluation cached before that fix used the wrong rubric.
 * Version-tagging the Task 2 hash means those pre-fix rows (hashed without a
 * version prefix) can never be read again — stale Task 2 evals self-invalidate
 * without any DB migration. Bump this string if the Task 2 rubric changes again.
 */
const TASK2_RUBRIC_VERSION = "tr-rubric-v2";

function essayHash(essayText, taskType = "task2") {
  const base = essayText.trim().toLowerCase();
  const keyed = taskType === "task2" ? `${TASK2_RUBRIC_VERSION}|${base}` : base;
  return crypto.createHash("sha256").update(keyed).digest("hex");
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function applyWritingBandScores(evaluationText, taskType = "task2") {
  const bands = finalizeWritingBands(evaluationText, taskType);
  return {
    bands,
    evaluation: rewriteEvaluationScores(evaluationText, bands, taskType),
  };
}

function extractTextFromMessages(messages) {
  for (const msg of messages.data || []) {
    if (msg.role !== "assistant") continue;
    const parts = Array.isArray(msg.content) ? msg.content : [];
    const text = parts
      .filter((p) => p && p.type === "text" && p.text && typeof p.text.value === "string")
      .map((p) => p.text.value)
      .join("\n")
      .trim();
    if (text) return text;
  }
  return "";
}

export async function getOrCreateAssistant() {
  assertEnv();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  if (process.env.OPENAI_ASSISTANT_ID) {
    try {
      const existing = await openai.beta.assistants.retrieve(
        process.env.OPENAI_ASSISTANT_ID
      );
      const hasFileSearch = (existing.tools || []).some(
        (t) => t.type === "file_search"
      );
      if (hasFileSearch) {
        return process.env.OPENAI_ASSISTANT_ID;
      }
    } catch (err) {
      if (err?.status !== 404) {
        throw err;
      }
    }

    await openai.beta.assistants.delete(process.env.OPENAI_ASSISTANT_ID);
    console.log(
      `[Assistant] Deleted existing assistant: ${process.env.OPENAI_ASSISTANT_ID}`
    );
  }

  const assistant = await openai.beta.assistants.create(
    getAssistantCreateParams()
  );

  updateEnvLocalAssistantId(assistant.id);

  console.log("[Assistant] Created new assistant.");
  console.log("OPENAI_ASSISTANT_ID (full, untruncated):");
  console.log(assistant.id);
  console.log("[Assistant] Updated .env.local with OPENAI_ASSISTANT_ID");

  return assistant.id;
}

export async function evaluateEssay(userEssay, taskType) {
  assertEnv();
  if (taskType !== "task1" && taskType !== "task2") {
    throw new Error('taskType must be "task1" or "task2"');
  }
  if (!userEssay || typeof userEssay !== "string" || !userEssay.trim()) {
    throw new Error("userEssay must be a non-empty string");
  }

  const trimmedEssay = userEssay.trim();
  const { validateWritingSubmission } = await import("@/lib/ielts/writingCriteria");
  const wordCheck = validateWritingSubmission(trimmedEssay, taskType);
  if (!wordCheck.ok) {
    throw new Error(wordCheck.error);
  }

  const hash = essayHash(trimmedEssay, taskType);
  const supabase = getSupabase();

  // Cache lookup BEFORE any OpenAI call
  const { data: cached, error: cacheReadError } = await supabase
    .from("essay_cache")
    .select("evaluation")
    .eq("essay_hash", hash)
    .eq("task_type", taskType)
    .maybeSingle();

  if (cacheReadError) {
    console.warn("[Assistant] Cache read failed:", cacheReadError.message);
  } else if (cached?.evaluation) {
    console.log("[Assistant] Cache hit — skipping OpenAI");
    const cachedResult = applyWritingBandScores(cached.evaluation, taskType);
    return { ...cachedResult, structuredScore: null };
  }

  const wordCount = countWords(trimmedEssay);
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const assistantId = await getOrCreateAssistant();

  const thread = await openai.beta.threads.create();
  const threadId = typeof thread === "string" ? thread : thread?.id;
  if (!threadId) {
    throw new Error("Failed to create OpenAI thread");
  }

  const minWords = taskType === "task1" ? 150 : 250;
  const taskLabel = taskType === "task1" ? "Writing Task 1 (report)" : "Writing Task 2 (essay)";
  const rubric = taskType === "task1" ? TASK1_EVAL_RUBRIC : TASK2_EVAL_RUBRIC;
  const firstAbbrev = taskType === "task1" ? "TA" : "TR";
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content:
      `${rubric}\n\n---\n\nTask type: ${taskLabel}\n` +
      `Word count: ${wordCount} words (minimum for this task: ${minWords})\n\n` +
      `Evaluate using the OUTPUT FORMAT above. Put ${firstAbbrev}/CC/LR/GRA scores on the first lines as whole or half bands out of 9 (e.g. ${firstAbbrev}: 7/9). Do not use decimals below 1.\n\n` +
      trimmedEssay,
  });

  const completedRun = await openai.beta.threads.runs.createAndPoll(
    threadId,
    {
      assistant_id: assistantId,
      temperature: 0,
      tool_choice: "auto",
    },
    { pollIntervalMs: 2000 }
  );

  if (completedRun.status !== "completed") {
    const lastError = completedRun.last_error?.message || "Unknown error";
    throw new Error(`Assistant run ${completedRun.status}: ${lastError}`);
  }

  const messages = await openai.beta.threads.messages.list(threadId, { limit: 20 });
  const rawEvaluation = extractTextFromMessages(messages);

  if (!rawEvaluation) {
    return {
      evaluation: "No evaluation text returned by assistant.",
      bands: { ta: null, cc: null, lr: null, gra: null, overall: null },
    };
  }

  const { evaluation, bands } = applyWritingBandScores(rawEvaluation, taskType);

  let structuredScore = null;
  try {
    const { runStructuredWritingScoring } = await import(
      "@/lib/ielts/structuredWritingScoring"
    );
    const { structuredWritingToFlatBands } = await import(
      "@/lib/ielts/writingScoringSchema"
    );
    structuredScore = await runStructuredWritingScoring({
      openai,
      essay: trimmedEssay,
      taskType,
    });
    if (structuredScore) {
      const structuredBands = structuredWritingToFlatBands(structuredScore);
      Object.assign(bands, structuredBands);
    }
  } catch (structuredErr) {
    console.warn(
      "[Assistant] structured writing scoring:",
      structuredErr instanceof Error ? structuredErr.message : structuredErr
    );
  }

  const { error: cacheWriteError } = await supabase.from("essay_cache").insert({
    essay_hash: hash,
    task_type: taskType,
    evaluation,
    band_ta: bands.ta,
    band_cc: bands.cc,
    band_lr: bands.lr,
    band_gra: bands.gra,
    band_overall: bands.overall,
  });

  if (cacheWriteError) {
    console.warn("[Assistant] Cache write failed:", cacheWriteError.message);
  } else {
    console.log("[Assistant] Cached evaluation for essay hash", {
      taskType,
      bands,
    });
  }

  return { evaluation, bands, structuredScore };
}
