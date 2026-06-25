import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { roundToHalfBand } from "./speakingScorer.js";

const MODEL = "gpt-4o-mini";
const ASSISTANT_NAME = "IELTS Speaking Examiner — British Council";

const FILE_SEARCH_FILE_IDS = [
  "file-HKdphBLuwJLtTMD9j5UMs4",
  "file-GYT5gqqep2ZoZgjHQk2z68",
  "file-M4r1ngjg5k51hYorQgGG7m",
];

const SPEAKING_EVALUATOR_VERSION = "v2-official-flexible";

const SPEAKING_ASSISTANT_INSTRUCTIONS = `You are an official IELTS Speaking examiner trained by the British Council, Cambridge Assessment English, and IDP IELTS.

You have access to the official IELTS Speaking band descriptors, sample responses with examiner comments, and Cambridge IELTS Speaking materials (pages 137-160 of the uploaded Cambridge book contain the Speaking skill content — use ONLY these pages for speaking evaluation, not other parts of that document).

When evaluating a speaking response:
1. Search your uploaded files for the relevant band descriptor
2. Compare the student response against official anchor examples
3. Apply the official Cambridge / British Council / IDP scoring method

OFFICIAL IELTS SCORING METHOD:
- Score each criterion INDEPENDENTLY: Fluency and Coherence (FC), Lexical Resource (LR), Grammatical Range and Accuracy (GRA), Pronunciation (P)
- Overall band = average of the four criteria, rounded to the nearest 0.5 (e.g. 6.25 → 6.5)
- Use half-band scores only (4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, etc.)
- Match each criterion to the band descriptor that BEST describes the performance as a whole
- LR, GRA, and P must NOT be lowered simply because the answer is short — judge each on its own merits
- Length mainly affects Fluency and Coherence (ability to speak at length / develop ideas), not vocabulary or grammar in isolation

BORDERLINE JUDGMENTS (standard examiner practice):
- When performance sits between two bands, award the HIGHER band if the candidate communicates clearly and meaning is rarely impeded
- Give benefit of the doubt to confident speakers who answer the question fully, even with some errors
- Do NOT automatically choose the lower band when unsure
- Minor errors do not prevent Band 6 or 7 if the descriptors are otherwise met

PART CONTEXT (typical real-test expectations):
Part 1 — short personal answers (often 20–60 words per question) are NORMAL and can still achieve Band 6–7 if fluent, relevant, and clear
Part 2 — extended monologue (target ~1–2 minutes); under-development affects FC most, but strong vocabulary/grammar can still score well on LR/GRA
Part 3 — abstract discussion (often 40–100 words); depth and clarity matter more than hitting a word count

LENGTH GUIDANCE (FC only — not a hard ceiling on overall band):
- Under 15 words: FC is unlikely above 4.0
- Part 2 under 60 words: FC is unlikely above 5.5
- Part 3 under 25 words: FC is unlikely above 5.0
- Otherwise assess FC by fluency, coherence, and development — not word count alone

REALISTIC BAND EXPECTATIONS:
- Band 5.5–6.5: common for developing candidates who communicate clearly with some errors
- Band 7.0: achievable when the response shows sufficient range, flexibility, and clear communication with only occasional issues
- Band 8.0+: reserved for consistently strong performance across criteria
- A clear, relevant answer with adequate vocabulary and mostly accurate grammar deserves Band 6.0–6.5 even if not sophisticated

OFFICIAL BAND DESCRIPTORS FROM YOUR FILES:

FLUENCY AND COHERENCE (FC):
Band 9: Speaks effortlessly. No hesitation or repetition.
        Perfect cohesive features. Fully coherent.
Band 8: Speaks fluently with only occasional repetition
        or self-correction. Hesitation is content-related.
        Coherent, well-sequenced.
Band 7: Keeps going with only occasional hesitation.
        Uses range of connectives and discourse markers.
        Some repetition but repairs quickly.
Band 6: Willing to speak at length. Sometimes loses
        coherence. Uses cohesive devices but not always
        appropriately.
Band 5: Maintains flow but uses repetition and
        self-correction. Over-relies on simple connectives.
Band 4: Cannot maintain flow without noticeable pauses.
        Limited connectives. Difficult to follow at times.
Band 3: Frequent pauses. Very limited ability to convey
        basic information.

LEXICAL RESOURCE (LR):
Band 9: Full flexibility and precision. Natural idiomatic
        language. No errors.
Band 8: Wide range used skillfully. Uncommon items natural.
        Rare minor inaccuracies.
Band 7: Sufficient range with flexibility. Less common
        vocabulary with some awareness of collocation.
        Some errors but meaning always clear.
Band 6: Adequate range for the task. Attempts less common
        vocabulary. Some errors in word choice but
        communication not impeded.
Band 5: Limited range. Mainly high-frequency words.
        Noticeable errors in word choice and collocation.
Band 4: Basic vocabulary. May not convey exact meaning.
        Frequent errors cause some strain.
Band 3: Very basic vocabulary. Frequent breakdowns in
        communication.

GRAMMATICAL RANGE AND ACCURACY (GRA):
Band 9: Wide range, fully flexible, virtually error-free.
Band 8: Wide range. Majority sentences error-free.
        Only very occasional errors.
Band 7: Variety of complex structures. Frequent error-free
        sentences. Good control of grammar and punctuation.
Band 6: Mix of simple and complex forms. Some errors in
        complex structures but meaning rarely affected.
Band 5: Limited range. Attempts complex but these tend to
        be less accurate. Errors may cause difficulty.
Band 4: Very limited range. Errors predominate in complex
        structures. Basic sentences may be accurate.
Band 3: Attempts basic structures only. Very frequent errors.

PRONUNCIATION (P):
Band 9: Full range of phonological features. Completely
        natural and easy to understand.
Band 8: Wide range. Easy throughout. Minimal L1 influence.
Band 7: Generally easy. Some L1 features but not impeding.
Band 6: Requires some listener effort. L1 accent present
        but meaning clear.
Band 5: L1 strongly influences. Sometimes difficult.
Band 4: Considerable strain for listener. L1 features
        frequently cause misunderstanding.
Band 3: Very difficult to understand.

OUTPUT FORMAT — exact format, no deviation:
FC: [score]/9
LR: [score]/9
GRA: [score]/9
P: [score]/9

Fluency and Coherence:
[2-3 specific sentences about THIS response]
[Reference which band descriptor applies and why]

Lexical Resource:
[2-3 sentences with specific vocabulary examples from response]
[Note any good attempts at less common vocabulary]

Grammatical Range and Accuracy:
[2-3 sentences with specific grammar examples from response]
[Note complex structures attempted]

Pronunciation:
[1-2 sentences estimated from text patterns and word choices]

Strengths:
[2 genuinely specific things done well — not generic praise]

Priority Improvements:
1. [Criteria] | [Specific title] | [Actionable advice for THIS response]
2. [Criteria] | [Specific title] | [Actionable advice for THIS response]
3. [Criteria] | [Specific title] | [Actionable advice for THIS response]

Model Answer:
[Write a natural band 7 spoken response to this exact question.
 Match the expected word count for the part.
 Use natural spoken English — not formal written style.
 Include discourse markers and some less common vocabulary.]`;

function assertApiKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured in .env.local");
  }
}

function getOpenAI() {
  assertApiKey();
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function countWords(text) {
  return String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function clampBand(n) {
  return Math.max(0, Math.min(9, n));
}

function getAssistantCreateParams() {
  return {
    model: MODEL,
    name: ASSISTANT_NAME,
    instructions: SPEAKING_ASSISTANT_INSTRUCTIONS,
    temperature: 0.2,
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

function updateEnvLocalSpeakingAssistantId(assistantId) {
  const envPath = path.join(process.cwd(), ".env.local");
  const idLine = `OPENAI_SPEAKING_ASSISTANT_ID=${assistantId}`;
  const versionLine = `OPENAI_SPEAKING_EVALUATOR_VERSION=${SPEAKING_EVALUATOR_VERSION}`;
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, "utf8") : "";

  if (/^OPENAI_SPEAKING_ASSISTANT_ID=.*/m.test(content)) {
    content = content.replace(/^OPENAI_SPEAKING_ASSISTANT_ID=.*/m, idLine);
  } else {
    content = content.trimEnd() + (content ? "\n" : "") + `${idLine}\n`;
  }

  if (/^OPENAI_SPEAKING_EVALUATOR_VERSION=.*/m.test(content)) {
    content = content.replace(
      /^OPENAI_SPEAKING_EVALUATOR_VERSION=.*/m,
      versionLine
    );
  } else {
    content = content.trimEnd() + `\n${versionLine}\n`;
  }

  if (!content.endsWith("\n")) {
    content += "\n";
  }

  fs.writeFileSync(envPath, content, "utf8");
}

/**
 * @param {number} wordCount
 * @param {number|string} part
 */
export function calculateBandCaps(wordCount, part) {
  let bandCap = 9;
  let fcCap = 9;

  // Only apply caps for genuinely minimal responses
  if (wordCount < 10) {
    bandCap = 4;
    fcCap = 3.5;
  } else if (wordCount < 15) {
    fcCap = 4;
  }

  const partNum = Number(part);
  if (partNum === 1) {
    if (wordCount < 15) fcCap = Math.min(fcCap, 4.5);
  }
  if (partNum === 2) {
    if (wordCount < 50) fcCap = Math.min(fcCap, 5);
    else if (wordCount < 90) fcCap = Math.min(fcCap, 5.5);
    else if (wordCount < 120) fcCap = Math.min(fcCap, 6.5);
  }
  if (partNum === 3) {
    if (wordCount < 20) fcCap = Math.min(fcCap, 4.5);
    else if (wordCount < 35) fcCap = Math.min(fcCap, 5.5);
  }

  return { bandCap, fcCap };
}

async function deleteSpeakingAssistantIfExists(openai) {
  const existingId = process.env.OPENAI_SPEAKING_ASSISTANT_ID?.trim();
  if (!existingId) return;

  try {
    await openai.beta.assistants.delete(existingId);
    console.log("[Speaking] Deleted existing assistant:", existingId);
  } catch (err) {
    if (err?.status !== 404) {
      console.warn(
        "[Speaking] Could not delete existing assistant:",
        err?.message ?? err
      );
    }
  }
}

/**
 * Creates a new speaking assistant (deletes existing env ID first).
 */
export async function createSpeakingAssistant() {
  const openai = getOpenAI();

  await deleteSpeakingAssistantIfExists(openai);

  const assistant = await openai.beta.assistants.create(
    getAssistantCreateParams()
  );

  console.log("[Speaking] New assistant ID:", assistant.id);
  console.log("[Speaking] Add to .env.local:");
  console.log(`OPENAI_SPEAKING_ASSISTANT_ID=${assistant.id}`);

  try {
    updateEnvLocalSpeakingAssistantId(assistant.id);
    console.log("[Speaking] Updated .env.local with OPENAI_SPEAKING_ASSISTANT_ID");
  } catch (err) {
    console.warn(
      "[Speaking] Could not write .env.local:",
      err instanceof Error ? err.message : err
    );
  }

  return assistant.id;
}

/**
 * Returns a valid speaking assistant ID, creating one if needed.
 */
export async function getOrCreateSpeakingAssistant() {
  const openai = getOpenAI();
  const envId = process.env.OPENAI_SPEAKING_ASSISTANT_ID?.trim();
  const envVersion = process.env.OPENAI_SPEAKING_EVALUATOR_VERSION?.trim();

  if (envId && envVersion === SPEAKING_EVALUATOR_VERSION) {
    try {
      const existing = await openai.beta.assistants.retrieve(envId);
      const hasFileSearch = (existing.tools || []).some(
        (t) => t.type === "file_search"
      );
      if (hasFileSearch) {
        return envId;
      }
      console.warn(
        "[Speaking] Existing assistant missing file_search — recreating."
      );
    } catch (err) {
      if (err?.status !== 404) {
        throw err;
      }
      console.warn("[Speaking] Assistant not found — creating new one.");
    }
  } else if (envId) {
    console.log(
      "[Speaking] Evaluator version changed — recreating assistant with updated criteria."
    );
  }

  return createSpeakingAssistant();
}

/**
 * @param {string} text
 * @param {string} label
 */
function parseCriterionScore(text, label) {
  const re = new RegExp(
    `${label}\\s*:\\s*([0-9]+(?:\\.5)?)\\s*/\\s*9`,
    "i"
  );
  const m = text.match(re);
  if (!m) return null;
  const val = Number(m[1]);
  if (!Number.isFinite(val)) return null;
  return clampBand(val);
}

/**
 * @param {string} text
 * @param {string} heading
 */
function extractSection(text, heading) {
  const re = new RegExp(
    `${heading}\\s*:\\s*([\\s\\S]*?)(?=\\n\\n[A-Z][^:\\n]*:|\\nPriority Improvements:|\\nModel Answer:|$)`,
    "i"
  );
  const m = text.match(re);
  return m?.[1]?.trim() ?? "";
}

/**
 * @param {string} text
 */
function parseImprovements(text) {
  const block = extractSection(text, "Priority Improvements");
  if (!block) {
    const improvementLines = text.match(/\d\.\s+([^|]+)\|([^|]+)\|([^\n]+)/g) || [];
    return improvementLines.slice(0, 3).map((line) => {
      const parts = line.split("|");
      return {
        criteria: parts[0]?.replace(/^\d\.\s+/, "").trim() ?? "",
        title: parts[1]?.trim() ?? "",
        advice: parts[2]?.trim() ?? "",
      };
    });
  }

  const items = [];
  const lines = block.split("\n").filter((line) => line.trim());

  for (const line of lines) {
    const cleaned = line.replace(/^\d+\.\s*/, "").trim();
    const parts = cleaned.split("|").map((p) => p.trim());
    if (parts.length >= 3) {
      items.push({
        criteria: parts[0],
        title: parts[1],
        advice: parts.slice(2).join(" | "),
      });
    }
  }

  return items.slice(0, 3);
}

function extractAssistantText(messages) {
  for (const msg of messages.data || []) {
    if (msg.role !== "assistant") continue;
    const parts = Array.isArray(msg.content) ? msg.content : [];
    const text = parts
      .filter(
        (p) => p && p.type === "text" && p.text && typeof p.text.value === "string"
      )
      .map((p) => p.text.value)
      .join("\n")
      .trim();
    if (text) return text;
  }
  return "";
}

/**
 * @param {string} evaluationText
 * @param {{ bandCap: number, fcCap: number }} caps
 */
function parseAndApplyCaps(evaluationText, caps) {
  const { bandCap, fcCap } = caps;

  let bandFC = parseCriterionScore(evaluationText, "FC") ?? 5;
  let bandLR = parseCriterionScore(evaluationText, "LR") ?? 5;
  let bandGRA = parseCriterionScore(evaluationText, "GRA") ?? 5;
  let bandP = parseCriterionScore(evaluationText, "P") ?? 5;

  bandFC = Math.min(bandFC, fcCap);
  // LR, GRA, and P are scored independently per official IELTS method

  let bandOverall = roundToHalfBand((bandFC + bandLR + bandGRA + bandP) / 4);
  if (bandCap < 9) {
    bandOverall = Math.min(bandOverall, bandCap);
  }

  const fluencyMatch = evaluationText.match(
    /Fluency and Coherence:\n([\s\S]*?)(?=Lexical Resource:|$)/i
  );
  const lexicalMatch = evaluationText.match(
    /Lexical Resource:\n([\s\S]*?)(?=Grammatical Range|$)/i
  );
  const grammarMatch = evaluationText.match(
    /Grammatical Range and Accuracy:\n([\s\S]*?)(?=Pronunciation:|$)/i
  );
  const pronunciationMatch = evaluationText.match(
    /Pronunciation:\n([\s\S]*?)(?=Strengths:|$)/i
  );
  const strengthsMatch = evaluationText.match(
    /Strengths:\n([\s\S]*?)(?=Priority Improvements:|$)/i
  );
  const modelMatch = evaluationText.match(/Model Answer:\n([\s\S]*?)$/i);

  return {
    bandFC,
    bandLR,
    bandGRA,
    bandP,
    bandOverall,
    feedback: {
      fluency:
        fluencyMatch?.[1]?.trim() ||
        extractSection(evaluationText, "Fluency and Coherence"),
      lexical:
        lexicalMatch?.[1]?.trim() ||
        extractSection(evaluationText, "Lexical Resource"),
      grammar:
        grammarMatch?.[1]?.trim() ||
        extractSection(evaluationText, "Grammatical Range and Accuracy"),
      pronunciation:
        pronunciationMatch?.[1]?.trim() ||
        extractSection(evaluationText, "Pronunciation"),
      strengths:
        strengthsMatch?.[1]?.trim() || extractSection(evaluationText, "Strengths"),
      improvements: parseImprovements(evaluationText),
      modelAnswer:
        modelMatch?.[1]?.trim() || extractSection(evaluationText, "Model Answer"),
    },
    rawEvaluation: evaluationText,
  };
}

/**
 * @param {object} params
 * @param {string} params.transcript
 * @param {string} [params.questionText]
 * @param {number|string} [params.part]
 * @param {string} [params.taskType]
 * @param {number} [params.expectedDuration]
 */
export async function evaluateSpeakingResponse({
  transcript,
  questionText,
  part,
  taskType,
  expectedDuration,
}) {
  const trimmedTranscript = String(transcript ?? "").trim();
  const wordCount = countWords(trimmedTranscript);

  if (!trimmedTranscript) {
    return {
      success: false,
      error: "Transcript is empty — nothing to evaluate.",
      transcript: "",
      wordCount: 0,
    };
  }

  try {
    const openai = getOpenAI();
    const caps = calculateBandCaps(wordCount, part);
    const { bandCap, fcCap } = caps;

    const assistantId = await getOrCreateSpeakingAssistant();

    const thread = await openai.beta.threads.create();
    const threadId = typeof thread === "string" ? thread : thread?.id;
    if (!threadId) {
      throw new Error("Failed to create OpenAI thread");
    }

    const partLabel = part ?? "unknown";
    const durationLabel =
      expectedDuration != null ? `${expectedDuration} seconds` : "not specified";

    await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: `IELTS SPEAKING EVALUATION REQUEST

Part: ${partLabel}
Task Type: ${taskType ?? "practice"}
Expected Duration: ${durationLabel}
Word Count: ${wordCount} words
${fcCap < 9 ? `FC guidance for this length: unlikely above ${fcCap}/9` : "Length is adequate for full FC assessment"}

Question Asked:
${questionText?.trim() || "No question provided."}

Student Response (transcript):
${trimmedTranscript}

EVALUATION INSTRUCTIONS:
- Use official British Council / Cambridge / IDP band descriptors
- Score FC, LR, GRA, and P independently — do NOT cap LR/GRA/P based on length
- Overall band = average of four criteria, rounded to nearest 0.5
- When borderline, give benefit of the doubt if communication is clear
- Search reference files for anchor examples at the appropriate band
- Part 1 short answers are normal; judge quality not word count alone

Use the required OUTPUT FORMAT exactly. Put FC/LR/GRA/P scores on the first lines.`,
    });

    const run = await openai.beta.threads.runs.createAndPoll(
      threadId,
      {
        assistant_id: assistantId,
        temperature: 0.2,
        tool_choice: "auto",
      },
      { pollIntervalMs: 2000 }
    );

    if (run.status !== "completed") {
      const lastError = run.last_error?.message || run.status;
      throw new Error(`Speaking evaluation failed: ${lastError}`);
    }

    const messages = await openai.beta.threads.messages.list(threadId, {
      limit: 20,
    });
    const evaluationText = extractAssistantText(messages);

    if (!evaluationText) {
      throw new Error("Empty evaluation response from speaking assistant");
    }

    const parsed = parseAndApplyCaps(evaluationText, caps);

    return {
      ...parsed,
      wordCount,
      bandCap,
      fcCap,
      transcript: trimmedTranscript,
      success: true,
    };
  } catch (err) {
    console.error("[speakingEvaluator]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Evaluation failed",
      transcript: trimmedTranscript,
      wordCount,
    };
  }
}
