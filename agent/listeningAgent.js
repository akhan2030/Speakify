/**
 * Daily listening agent — 5:00 AM
 * Generates 1 listening transcript × 10 CEFR levels → daily_ai_tasks (draft)
 * Manual: npm run agent:listening-bank
 */

const path = require("path");
const crypto = require("crypto");
const cron = require("node-cron");
const dotenv = require("dotenv");
const OpenAI = require("openai");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const MODEL = "gpt-4o";
const TEMPERATURE = 0.7;
const CRON_SCHEDULE = "0 5 * * *";
const TRANSCRIPTS_PER_LEVEL = 1;
const MIN_QUESTIONS = 8;
const MAX_QUESTIONS = 10;
const MAX_RETRIES = 3;
const AGENT_NAME = "listening_agent";

const CEFR_LEVELS = [
  "A1.1",
  "A1.2",
  "A2.1",
  "A2.2",
  "B1.1",
  "B1.2",
  "B2.1",
  "B2.2",
  "C1.1",
  "C1.2",
];

const SOCIAL_TOPICS = [
  "Pharmacy prescription collection",
  "Train season ticket enquiry",
  "Gym membership signup",
  "Doctor appointment booking",
  "Apartment viewing",
  "Library card registration",
  "Café catering order",
  "Car hire reservation",
  "Community centre enrolment",
  "Theatre ticket booking",
];

const DISCUSSION_TOPICS = [
  "Dissertation proposal meeting",
  "Internship placement discussion",
  "Group project feedback",
  "Research ethics application",
  "Seminar presentation prep",
  "Field trip planning",
  "Lab experiment review",
  "Marketing campaign planning",
  "Engineering design review",
  "Study abroad options",
];

const LECTURE_TOPICS = [
  "Renewable energy storage",
  "Child language acquisition",
  "Microplastics in freshwater",
  "Medieval trade routes",
  "Urban architecture history",
  "Psychology of decision making",
  "Volcanic hazard monitoring",
  "Linguistics and language evolution",
  "Marine biology and conservation",
  "Technology and society",
];

const MCQ_INDEX_TARGETS = [0, 1, 2, 3, 0, 1, 2, 3, 0, 1];

const SYSTEM_MESSAGE = `You are an expert IELTS Listening content creator for Saudi Arabian learners.
Write natural spoken English transcripts with gender-correct speaker labels and voices.
Every question MUST include correct_answer and explanation referencing the transcript.
Return ONLY valid JSON. No markdown. No commentary.`;

/** @type {Promise<Record<string, Function>> | null} */
let listeningModulesPromise = null;

function log(...args) {
  console.log("[ListeningAgent]", ...args);
}

function md5(value) {
  return crypto.createHash("md5").update(String(value)).digest("hex");
}

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getAppBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
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

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function loadListeningModules() {
  if (!listeningModulesPromise) {
    listeningModulesPromise = Promise.all([
      import("../lib/listeningSpeakerAssignment.js"),
      import("../lib/listeningSpeakerProfiles.js"),
      import("../lib/listeningSpeakerAlignment.js"),
      import("../lib/listeningTts.js"),
    ]).then(
      ([
        speakerAssignment,
        speakerProfiles,
        speakerAlignment,
        listeningTts,
      ]) => ({
        pickSpeakersForSection: speakerAssignment.pickSpeakersForSection,
        buildSpeakerPromptForSection:
          speakerAssignment.buildSpeakerPromptForSection,
        normalizeSpeakersFromPayload:
          speakerProfiles.normalizeSpeakersFromPayload,
        prepareTranscriptForListening:
          speakerAlignment.prepareTranscriptForListening,
        generateMultiVoiceAudio: listeningTts.generateMultiVoiceAudio,
      })
    );
  }
  return listeningModulesPromise;
}

function getTodayDateKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getTodayBounds(dateKey) {
  return {
    start: `${dateKey}T00:00:00.000Z`,
    end: `${dateKey}T23:59:59.999Z`,
  };
}

function getBandForLevel(level) {
  const map = {
    "A1.1": "3.0-3.5",
    "A1.2": "3.5-4.0",
    "A2.1": "4.0-4.5",
    "A2.2": "4.5-5.0",
    "B1.1": "5.0-5.5",
    "B1.2": "5.5-6.0",
    "B2.1": "6.0-6.5",
    "B2.2": "6.5-7.0",
    "C1.1": "7.0-7.5",
    "C1.2": "7.5-8.0",
  };
  return map[level] ?? "5.0-5.5";
}

function getDifficultyForLevel(level) {
  const band = level.charAt(0);
  if (band === "A") return level.endsWith(".1") ? "beginner" : "elementary";
  if (band === "B") return level.endsWith(".1") ? "intermediate" : "upper_intermediate";
  return "advanced";
}

function getLevelConfig(cefrLevel) {
  if (cefrLevel.startsWith("A")) {
    return {
      sectionNumber: 1,
      style: "everyday_social",
      styleLabel: "Everyday social conversation",
      wordRange: cefrLevel.startsWith("A1")
        ? { min: 160, max: 280 }
        : { min: 180, max: 350 },
      questionCount: 8,
    };
  }
  if (cefrLevel.startsWith("B")) {
    return {
      sectionNumber: 3,
      style: "academic_discussion",
      styleLabel: "Academic discussion",
      wordRange: cefrLevel.startsWith("B1")
        ? { min: 300, max: 500 }
        : { min: 280, max: 550 },
      questionCount: 9,
    };
  }
  return {
    sectionNumber: 4,
    style: "academic_lecture",
    styleLabel: "Academic lecture",
    wordRange: { min: 320, max: 650 },
    questionCount: 10,
  };
}

function pickTopic(cefrLevel) {
  const idx = CEFR_LEVELS.indexOf(cefrLevel);
  const slot = idx >= 0 ? idx : 0;
  if (cefrLevel.startsWith("A")) return SOCIAL_TOPICS[slot];
  if (cefrLevel.startsWith("B")) return DISCUSSION_TOPICS[slot];
  return LECTURE_TOPICS[slot];
}

function getEstimatedMinutes(level) {
  if (level.startsWith("A")) return 12;
  if (level.startsWith("B")) return 18;
  return 22;
}

function wordCount(text) {
  return String(text ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonFromResponse(raw) {
  const text = String(raw ?? "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : text;
  return JSON.parse(candidate);
}

function normalizeQuestionType(type) {
  const t = String(type ?? "").toLowerCase().replace(/\s+/g, "_");
  if (t.includes("multiple") || t === "mcq") return "multiple_choice";
  if (t.includes("gap") || t.includes("completion") || t.includes("form") || t.includes("note")) {
    return "gap_fill";
  }
  if (t.includes("short")) return "short_answer";
  return t;
}

function shuffleMcqOptions(question, targetIndex) {
  const options = Array.isArray(question.options)
    ? question.options.map(String)
    : [];
  if (options.length !== 4) {
    throw new Error("multiple_choice must have exactly 4 options");
  }

  const correctText = String(question.correct_answer ?? "").trim();
  let correctIdx = options.findIndex(
    (o) => o.trim().toLowerCase() === correctText.toLowerCase()
  );

  if (correctIdx < 0 && /^[a-d]$/i.test(correctText)) {
    correctIdx = correctText.toUpperCase().charCodeAt(0) - 65;
  }

  if (correctIdx < 0 && Number.isInteger(question.correct_index)) {
    correctIdx = question.correct_index;
  }

  if (correctIdx < 0 || correctIdx > 3) {
    throw new Error("multiple_choice missing valid correct_answer");
  }

  const correctOption = options[correctIdx];
  const distractors = options.filter((_, i) => i !== correctIdx);
  const newOptions = [...distractors];
  newOptions.splice(targetIndex, 0, correctOption);

  return {
    ...question,
    options: newOptions.slice(0, 4),
    correct_answer: correctOption,
    correct_index: targetIndex,
  };
}

function normalizeQuestions(questions) {
  let mcqSlot = 0;

  return questions.map((q, index) => {
    const type = normalizeQuestionType(q.type);
    let normalized = {
      id: q.id ?? index + 1,
      type,
      question: String(q.question ?? q.text ?? q.stem ?? "").trim(),
      correct_answer: String(q.correct_answer ?? q.answer ?? "").trim(),
      explanation: String(q.explanation ?? "").trim(),
    };

    if (!normalized.question || !normalized.correct_answer || !normalized.explanation) {
      throw new Error(
        `Question ${index + 1} missing question, correct_answer, or explanation`
      );
    }

    if (type === "multiple_choice") {
      normalized.options = Array.isArray(q.options)
        ? q.options.map(String).slice(0, 4)
        : [];
      while (normalized.options.length < 4) normalized.options.push("");
      normalized = shuffleMcqOptions(
        normalized,
        MCQ_INDEX_TARGETS[mcqSlot % MCQ_INDEX_TARGETS.length]
      );
      mcqSlot += 1;
    } else if (type === "gap_fill") {
      normalized.word_limit = String(
        q.word_limit ?? q.wordLimit ?? "NO MORE THAN TWO WORDS AND/OR A NUMBER"
      );
    }

    return normalized;
  });
}

function buildAnswerKey(questions) {
  return {
    questions: questions.map((q) => ({
      id: q.id,
      type: q.type,
      correct_answer: q.correct_answer,
      correct_index: q.correct_index ?? null,
    })),
  };
}

function buildTranscriptFormatInstructions(sectionNumber, speakerPrompt) {
  if (sectionNumber === 1) {
    return `Format EVERY dialogue line with speaker labels:
Speaker A: [text]
Speaker B: [text]
${speakerPrompt}
Use contractions and natural hesitations (well, actually, er).
Use [pause] for brief pauses where natural.`;
  }
  if (sectionNumber === 3) {
    return `Format EVERY speaking turn with labels:
Tutor: [text]
Student A: [text]
Student B: [text]
${speakerPrompt}
Use academic discussion language appropriate to the CEFR level.
Use [pause] when speakers hesitate.`;
  }
  return `Section 4 academic lecture — single speaker only.
Do NOT use speaker labels (no "Lecturer:" prefix).
Write continuous flowing lecture paragraphs.
Use [pause] and [long pause] between major points.`;
}

function buildUserMessage(cefrLevel, topic, config, assignedSpeakers, speakerPrompt, retryNote) {
  const retry = retryNote ? `\nIMPORTANT FIX: ${retryNote}\n` : "";
  const speakerJson = assignedSpeakers.map((s) => ({
    label: s.label,
    name: s.name,
    gender: s.gender,
    voice: s.voice,
  }));

  return `Create ONE listening practice transcript for CEFR level ${cefrLevel}.
${retry}
Style: ${config.styleLabel}
Topic: ${topic}
Section number (for TTS): ${config.sectionNumber}
Transcript length: YOU MUST write ${config.wordRange.min} to ${config.wordRange.max} words in the transcript field.
The transcript is the longest field — expand with natural dialogue, examples, and detail until you reach at least ${config.wordRange.min} words.
Shorter transcripts will be rejected.
Questions: EXACTLY ${config.questionCount} questions (must be between ${MIN_QUESTIONS} and ${MAX_QUESTIONS} — fewer than ${MIN_QUESTIONS} will be rejected)

${buildTranscriptFormatInstructions(config.sectionNumber, speakerPrompt)}

Assigned speakers (use these exact names — gender must match voice):
${JSON.stringify(speakerJson, null, 2)}

Include a MIX of question types:
1. multiple_choice — exactly 4 options, correct_answer is full text of correct option
2. gap_fill — fill in a missing word/phrase heard in the audio
3. short_answer — brief factual answer from the transcript

Return JSON:
{
  "title": "short descriptive title",
  "topic": "${topic}",
  "cefr_level": "${cefrLevel}",
  "section_number": ${config.sectionNumber},
  "style": "${config.style}",
  "transcript": "full spoken script — MINIMUM ${config.wordRange.min} words",
  "speakers": [{ "label": "string", "name": "string", "gender": "male|female", "voice": "onyx|nova|..." }],
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice" | "gap_fill" | "short_answer",
      "question": "string",
      "options": ["only for multiple_choice — 4 strings"],
      "correct_answer": "string",
      "explanation": "why this is correct based on the transcript"
    }
  ]
}

Rules:
- At least 2 question types in the set.
- Answers must be clearly audible in the transcript.
- Language complexity must match ${cefrLevel} only.
- Culturally appropriate for Saudi learners.
- Original content only — do not copy real IELTS papers.`;
}

function validateContent(content, config) {
  const count = wordCount(content.transcript);
  if (count < config.wordRange.min - 25 || count > config.wordRange.max + 50) {
    throw new Error(
      `Transcript word count ${count} outside ${config.wordRange.min}-${config.wordRange.max}`
    );
  }

  const questions = content.questions ?? [];
  if (questions.length < MIN_QUESTIONS || questions.length > MAX_QUESTIONS) {
    throw new Error(
      `Expected ${MIN_QUESTIONS}-${MAX_QUESTIONS} questions, got ${questions.length}`
    );
  }

  const types = new Set(questions.map((q) => q.type));
  if (types.size < 2) {
    throw new Error("Questions must include at least 2 different types");
  }
}

async function getTodayTaskCount(supabase, generationDate, cefrLevel) {
  const { start, end } = getTodayBounds(generationDate);
  const { count, error } = await supabase
    .from("daily_ai_tasks")
    .select("id", { count: "exact", head: true })
    .eq("skill", "listening")
    .eq("task_type", "listening_transcript")
    .eq("cefr_level", cefrLevel)
    .gte("generated_at", start)
    .lte("generated_at", end);

  if (error) throw error;
  return count ?? 0;
}

async function hashExists(supabase, contentHash) {
  const { data, error } = await supabase
    .from("daily_ai_tasks")
    .select("id")
    .eq("content_hash", contentHash)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data?.id);
}

async function generateTranscriptForLevel(openai, cefrLevel, topic) {
  const config = getLevelConfig(cefrLevel);
  const modules = await loadListeningModules();
  const genSeed = `listening-bank-${cefrLevel}-${Date.now()}`;
  const picked = modules.pickSpeakersForSection(config.sectionNumber, {
    testSeed: genSeed,
  });
  const assignedSpeakers = picked.speakers;
  const speakerPrompt = modules.buildSpeakerPromptForSection(
    config.sectionNumber,
    assignedSpeakers
  );

  const maxTokens = cefrLevel.startsWith("C") ? 12000 : 8000;
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const retryNote = lastError ? lastError.message : null;
      const completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: TEMPERATURE,
        max_tokens: maxTokens,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_MESSAGE },
          {
            role: "user",
            content: buildUserMessage(
              cefrLevel,
              topic,
              config,
              assignedSpeakers,
              speakerPrompt,
              retryNote
            ),
          },
        ],
      });

      const raw = completion.choices?.[0]?.message?.content ?? "";
      const parsed = parseJsonFromResponse(raw);

      const speakers = modules.normalizeSpeakersFromPayload(
        Array.isArray(parsed.speakers) ? parsed.speakers : assignedSpeakers,
        config.sectionNumber,
        { assignedSpeakers }
      );

      const transcript = modules.prepareTranscriptForListening(
        String(parsed.transcript ?? "").trim(),
        config.sectionNumber,
        speakers
      );

      if (!transcript) throw new Error("Missing transcript text");

      const questions = normalizeQuestions(
        Array.isArray(parsed.questions) ? parsed.questions : []
      );

      const content = {
        title: String(parsed.title ?? `Listening: ${topic}`).trim(),
        topic: String(parsed.topic ?? topic).trim(),
        cefr_level: cefrLevel,
        ielts_band_target: getBandForLevel(cefrLevel),
        section_number: config.sectionNumber,
        style: config.style,
        word_count: wordCount(transcript),
        transcript,
        speakers,
        questions,
      };

      validateContent(content, config);
      return content;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt < MAX_RETRIES) {
        log(`    Retry ${attempt}/${MAX_RETRIES} for ${cefrLevel}: ${lastError.message}`);
        await sleep(1500);
      }
    }
  }

  throw lastError ?? new Error(`Failed to generate ${cefrLevel}`);
}

async function generateAudioViaApi(transcript, sectionNumber, speakers, questions) {
  const baseUrl = getAppBaseUrl();
  const res = await fetch(`${baseUrl}/api/listening/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mockTest: true,
      transcript,
      sectionNumber,
      speakers,
      questions,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.error ?? `TTS API failed (${res.status})`);
  }

  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("audio")) {
    throw new Error("TTS API did not return audio");
  }

  return Buffer.from(await res.arrayBuffer());
}

async function generateAudioDirect(openai, transcript, sectionNumber, speakers) {
  const modules = await loadListeningModules();
  const result = await modules.generateMultiVoiceAudio(
    openai,
    transcript,
    sectionNumber,
    speakers
  );
  if (!result?.buffer?.length) {
    throw new Error("Direct TTS produced empty audio");
  }
  return result.buffer;
}

async function generateAudio(openai, content) {
  const { transcript, section_number: sectionNumber, speakers, questions } =
    content;

  try {
    log("    Generating audio via /api/listening/tts...");
    return await generateAudioViaApi(
      transcript,
      sectionNumber,
      speakers,
      questions
    );
  } catch (apiErr) {
    log(
      `    TTS API unavailable (${apiErr.message}) — falling back to direct generation`
    );
    return generateAudioDirect(openai, transcript, sectionNumber, speakers);
  }
}

function attachAudioToContent(content, audioBuffer) {
  if (!audioBuffer?.length) {
    throw new Error("Audio buffer is empty");
  }
  content.audio_base64 = audioBuffer.toString("base64");
  content.audio_type = "audio/mpeg";
  return content;
}

async function saveListeningTask(supabase, content, generationDate) {
  const contentHash = md5(
    `${content.title.toLowerCase()}${content.cefr_level}${generationDate}`
  );

  if (await hashExists(supabase, contentHash)) {
    log(`  Skip duplicate: ${content.title} (${content.cefr_level})`);
    return { saved: false, reason: "duplicate_hash" };
  }

  const answerKey = buildAnswerKey(content.questions);
  const total = content.questions.length;

  const enrichedContent = {
    ...content,
  };

  const payload = {
    skill: "listening",
    task_type: "listening_transcript",
    cefr_level: content.cefr_level,
    ielts_band_target: content.ielts_band_target,
    difficulty: getDifficultyForLevel(content.cefr_level),
    topic: content.topic,
    title: `Listening: ${content.title}`,
    content: enrichedContent,
    answer_key: answerKey,
    marking_rubric: {
      pass_score: Math.ceil(total * 0.7),
      total,
    },
    estimated_minutes: getEstimatedMinutes(content.cefr_level),
    status: "draft",
    content_hash: contentHash,
    tags: [
      content.cefr_level,
      "listening",
      "listening_transcript",
      content.style,
      content.topic,
    ],
  };

  const { error } = await supabase.from("daily_ai_tasks").insert(payload);
  if (error) {
    if (error.message?.includes("duplicate") || error.code === "23505") {
      return { saved: false, reason: "duplicate_db" };
    }
    throw new Error(`Insert daily_ai_tasks (${content.title}): ${error.message}`);
  }

  return { saved: true, contentHash };
}

async function logAgentRun(supabase, run) {
  const { error } = await supabase.from("agent_logs").insert({
    agent_name: AGENT_NAME,
    run_date: run.runDate,
    started_at: run.startedAt,
    completed_at: run.completedAt ?? new Date().toISOString(),
    status: run.status,
    tasks_generated: run.tasksGenerated ?? 0,
    tasks_failed: run.tasksFailed ?? 0,
    errors: run.errors?.length ? run.errors : null,
    notes: run.notes ?? null,
  });

  if (error) {
    console.error("[ListeningAgent] agent_logs insert failed:", error.message);
  }
}

async function runListeningGeneration() {
  assertEnv();

  const generationDate = getTodayDateKey();
  const startedAt = new Date().toISOString();
  const supabase = getSupabase();
  const openai = getOpenAI();

  let tasksGenerated = 0;
  let tasksFailed = 0;
  const errors = [];

  log("========================================");
  log("Speakify Listening Agent — AI Practice Bank");
  log(`Date: ${generationDate}`);
  log(`Target: ${CEFR_LEVELS.length} transcripts (1 per CEFR level)`);
  log("========================================");

  try {
    for (const cefrLevel of CEFR_LEVELS) {
      const existing = await getTodayTaskCount(
        supabase,
        generationDate,
        cefrLevel
      );

      if (existing >= TRANSCRIPTS_PER_LEVEL) {
        log(`  Skip ${cefrLevel} — transcript already generated today`);
        tasksGenerated += TRANSCRIPTS_PER_LEVEL;
        continue;
      }

      const topic = pickTopic(cefrLevel);
      log(`  Generating transcript for ${cefrLevel} (${topic})...`);

      try {
        const content = await generateTranscriptForLevel(
          openai,
          cefrLevel,
          topic
        );

        const audioBuffer = await generateAudio(openai, content);
        attachAudioToContent(content, audioBuffer);
        log(
          `    Audio encoded (${Math.round(audioBuffer.length / 1024)} KB base64 in content)`
        );

        const result = await saveListeningTask(
          supabase,
          content,
          generationDate
        );

        if (result.saved) {
          tasksGenerated += 1;
          log(
            `  Saved ${cefrLevel} ✓ — "${content.title}" (${content.word_count} words, ${content.questions.length} questions, audio ready)`
          );
        } else {
          tasksFailed += 1;
        }

        await sleep(2000);
      } catch (levelErr) {
        tasksFailed += 1;
        errors.push(`${cefrLevel}: ${levelErr.message}`);
        log(`  ✗ ${cefrLevel} failed: ${levelErr.message}`);
      }
    }

    log("========================================");
    log(`Done — ${tasksGenerated} drafts saved, ${tasksFailed} failed/skipped`);
    log("All content saved as status: draft (not published)");
    log("Next run: 5:00 AM tomorrow");
    log("========================================");

    await logAgentRun(supabase, {
      runDate: generationDate,
      startedAt,
      completedAt: new Date().toISOString(),
      status: errors.length ? "partial" : "success",
      tasksGenerated,
      tasksFailed,
      errors,
    });

    return { tasksGenerated, tasksFailed, errors };
  } catch (err) {
    await logAgentRun(supabase, {
      runDate: generationDate,
      startedAt,
      completedAt: new Date().toISOString(),
      status: "failed",
      tasksGenerated,
      tasksFailed,
      errors: [...errors, err.message],
    });
    throw err;
  }
}

let generationRunning = false;

async function runScheduledGeneration(trigger) {
  if (generationRunning) {
    log(`Skipping ${trigger} — already in progress`);
    return;
  }

  generationRunning = true;
  try {
    await runListeningGeneration();
  } catch (err) {
    console.error("[ListeningAgent] Fatal error:", err.message);
  } finally {
    generationRunning = false;
  }
}

if (require.main === module) {
  cron.schedule(CRON_SCHEDULE, () => {
    log("Cron triggered — 5:00 AM daily run");
    runScheduledGeneration("cron").catch((err) => {
      console.error("[ListeningAgent] Cron failed:", err.message);
    });
  });

  runScheduledGeneration("manual")
    .then(() => {
      if (process.env.LISTENING_AGENT_EXIT === "1") {
        process.exit(0);
      }
      log("Process alive — waiting for next cron run (5:00 AM)");
    })
    .catch((err) => {
      console.error("[ListeningAgent] Startup failed:", err.message);
      process.exit(1);
    });
}

module.exports = {
  runListeningGeneration,
  CEFR_LEVELS,
  getLevelConfig,
  getTodayDateKey,
  getBandForLevel,
  normalizeQuestions,
  attachAudioToContent,
  md5,
};
