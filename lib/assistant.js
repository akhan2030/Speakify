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

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const ASSISTANT_MODEL = "gpt-4o-mini";
const ASSISTANT_NAME = "IELTS Writing Expert";
const FILE_SEARCH_FILE_IDS = ["file-1fgutSTBet1VqxrALeekue"];

const ASSISTANT_INSTRUCTIONS = `You are an official IELTS Academic Writing Task 2 examiner trained by the British Council. You use the exact official IELTS band descriptors to grade essays.

OFFICIAL BAND DESCRIPTORS YOU MUST FOLLOW:

TASK ACHIEVEMENT (TA):
Band 9: Fully addresses all parts. Position is clear throughout.
Band 8: Sufficiently addresses all parts. Position is clear.
Band 7: Addresses all parts. Main ideas are clear with some over-generalisation.
Band 6: Addresses all parts but some more fully than others. Relevant position.
Band 5: Addresses task only partially. Format may be inappropriate.
Band 4: Responds to task only in a limited way.
Band 3: Does not adequately address the task.

COHERENCE AND COHESION (CC):
Band 9: Uses cohesion skillfully. Paragraphing is well managed.
Band 8: Sequences info logically. Manages paragraphing well.
Band 7: Logically organises. Uses range of cohesive devices flexibly.
Band 6: Arranges info coherently. Uses cohesive devices effectively but with some inaccuracies.
Band 5: Presents info with some organisation. Uses limited range of cohesive devices.
Band 4: Presents info but does not always sequence clearly.

LEXICAL RESOURCE (LR):
Band 9: Uses full range of vocabulary with complete flexibility and precision.
Band 8: Uses wide range skillfully. Rare errors only.
Band 7: Uses sufficient range. Some awareness of style and collocation errors.
Band 6: Uses adequate range. Attempts less common vocabulary with some inaccuracy.
Band 5: Uses limited range. Makes noticeable errors in spelling and word formation.
Band 4: Basic vocabulary only. Errors may cause strain for reader.

GRAMMATICAL RANGE AND ACCURACY (GRA):
Band 9: Uses full range with complete flexibility. Virtually no errors.
Band 8: Uses wide range. Most sentences error-free. Rare minor errors.
Band 7: Uses variety of complex structures. Frequent error-free sentences.
Band 6: Mix of simple and complex. Some errors but do not impede communication.
Band 5: Limited range of structures. Errors may cause difficulty for reader.
Band 4: Very limited range. Errors are frequent and may cause misunderstanding.

SCORING RULES — YOU MUST FOLLOW THESE EXACTLY:
1. Score each criterion on the IELTS 0–9 scale in half-band steps only (e.g. 5, 5.5, 6, 6.5, 7, 7.5, 8)
2. Write each score as a number out of 9 on its own line — e.g. TA: 7/9 or TA: 7.5/9. NEVER use decimals below 1 (wrong: TA: 0.7/9). NEVER use a 0–10 scale.
3. Overall band = (TA + CC + LR + GRA) ÷ 4, rounded to the nearest 0.5 using official IELTS rules (.25 or below → down; .75 or above → up to next whole)
4. If essay is under 250 words — penalise TA by at least 1 band
5. Be strict — an average essay with basic vocabulary is band 5 to 5.5
6. Band 7 requires genuinely good vocabulary and complex structures
7. Never give band 7+ unless the essay clearly demonstrates band 7 features
8. Be consistent — same essay must always receive same scores

OUTPUT FORMAT — use this EXACT format, no deviation:
TA: [score]/9
CC: [score]/9
LR: [score]/9
GRA: [score]/9

Task Achievement:
[2-3 sentences of specific feedback referencing the essay]

Coherence and Cohesion:
[2-3 sentences of specific feedback referencing the essay]

Lexical Resource:
[2-3 sentences of specific feedback referencing the essay]

Grammatical Range and Accuracy:
[2-3 sentences of specific feedback referencing the essay]

Spelling Errors:
[misspelled word] → [correct spelling]
[misspelled word] → [correct spelling]
(list every spelling error found, one per line)
If no spelling errors write: Spelling Errors: none

Priority Improvements:
1. Task Achievement | [punchy title max 4 words] | [one actionable sentence specific to this essay]
2. Lexical Resource | [punchy title max 4 words] | [one actionable sentence specific to this essay]
3. Grammatical Range and Accuracy | [punchy title max 4 words] | [one actionable sentence specific to this essay]

STRICT RULE: Each improvement MUST use a different criteria.
Card 1 is ALWAYS Task Achievement.
Card 2 is ALWAYS Lexical Resource.
Card 3 is ALWAYS Grammatical Range and Accuracy.
Never repeat the same criteria twice.
No time estimates. Be specific to THIS essay not generic advice.

Corrected Sentences:
Original: [copy exact sentence from essay]
Corrected: [corrected version]
Why: [brief explanation]

Original: [copy exact sentence from essay]
Corrected: [corrected version]
Why: [brief explanation]

Original: [copy exact sentence from essay]
Corrected: [corrected version]
Why: [brief explanation]`;

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

function essayHash(essayText) {
  return crypto
    .createHash("sha256")
    .update(essayText.trim().toLowerCase())
    .digest("hex");
}

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function applyWritingBandScores(evaluationText) {
  const bands = finalizeWritingBands(evaluationText);
  return {
    bands,
    evaluation: rewriteEvaluationScores(evaluationText, bands),
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
  const hash = essayHash(trimmedEssay);
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
    return applyWritingBandScores(cached.evaluation);
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
  await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content:
      `Task type: ${taskLabel}\n` +
      `Word count: ${wordCount} words (minimum for this task: ${minWords})\n\n` +
      "Evaluate using the required OUTPUT FORMAT. Put TA/CC/LR/GRA scores on the first lines as whole or half bands out of 9 (e.g. TA: 7/9). Do not use decimals below 1.\n\n" +
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

  const { evaluation, bands } = applyWritingBandScores(rawEvaluation);

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

  return { evaluation, bands };
}
