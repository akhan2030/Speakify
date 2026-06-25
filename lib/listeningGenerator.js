import OpenAI from "openai";
import { prepareTranscriptForListening } from "./listeningSpeakerAlignment.js";
import { normalizeSpeakersFromPayload } from "./listeningSpeakerProfiles.js";
import {
  buildSectionQuestionTypeRules,
  getPrimaryQuestionType,
  getSecondaryQuestionType,
} from "./listeningSectionTypes.js";
import {
  normalizeSectionQuestions,
  validateSectionQuestions,
  QUESTIONS_PER_SECTION,
} from "./listeningSectionNormalize.js";
import {
  logListeningValidationFailure,
  validateListeningSectionPayload,
} from "./listeningUserFacingValidation.js";
import { pickSection1Topic, SECTION1_SCENARIOS } from "./listeningSection1Diversity.js";
import {
  buildSpeakerPromptForSection,
  pickSpeakersForSection,
} from "./listeningSpeakerAssignment.js";
import {
  applySpeakerIdentitiesToPayload,
  assertSpeakerIdentitiesValid,
  identitiesFromLegacySpeakers,
} from "./listeningSpeakerIdentity.js";

const MODEL = "gpt-4o-mini";
const TEMPERATURE = 0.7;
const MAX_RETRIES = 3;

const SYSTEM_MESSAGE = `You are an expert IELTS Listening test creator certified by Cambridge Assessment English.

Follow the official IELTS section format:
- Section 1: everyday conversation — form/note/table completion ONLY (no multiple-choice).
- Section 2: social monologue — notes, matching, map/diagram labelling.
- Section 3: academic discussion — multiple choice, matching, sentence completion.
- Section 4: academic lecture — note/summary/flow-chart/table completion.

Create authentic IELTS listening transcripts that:
- Use natural spoken English with contractions
- Include hesitations occasionally: er, um, well, actually
- Contain specific testable details: names numbers dates
- Have answers clearly audible in the transcript
- Include distractors — wrong answers mentioned first then corrected: "Actually, no, it is..."
- Follow real IELTS section formats exactly
- Never use the same topic twice

Return ONLY valid JSON. No markdown. No explanation.`;

const NUMBER_WORDS = {
  0: "zero",
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "eleven",
  12: "twelve",
  13: "thirteen",
  14: "fourteen",
  15: "fifteen",
  16: "sixteen",
  17: "seventeen",
  18: "eighteen",
  19: "nineteen",
  20: "twenty",
  30: "thirty",
  40: "forty",
  50: "fifty",
  60: "sixty",
  70: "seventy",
  80: "eighty",
  90: "ninety",
  100: "hundred",
  1000: "thousand",
};

/** @type {const} */
export const LISTENING_QUESTION_TYPES = [
  {
    id: "multiple-choice",
    name: "Multiple Choice",
    trackerName: "Multiple Choice",
    description: "Choose A B or C based on what you hear",
    difficulty: "medium",
    wordLimit: null,
    sections: [1, 2, 3, 4],
    tips: [
      "Read all options before audio starts",
      "Beware of distractors — wrong answers are mentioned",
      "Correct answer is often paraphrased not exact words",
      "Eliminate obviously wrong options first",
    ],
  },
  {
    id: "matching",
    name: "Matching",
    trackerName: "Matching",
    description: "Match items to categories from a list",
    difficulty: "medium",
    wordLimit: null,
    sections: [1, 2, 3, 4],
    tips: [
      "Read all categories before audio starts",
      "Categories can be used more than once",
      "Listen for synonyms not exact words",
      "Mark answers in order they appear in audio",
    ],
  },
  {
    id: "plan-map-diagram",
    name: "Plan / Map / Diagram Labelling",
    trackerName: "Plan / Map / Diagram Labelling",
    description: "Label a map building plan or diagram",
    difficulty: "hard",
    wordLimit: "NO MORE THAN TWO WORDS",
    sections: [2, 3],
    tips: [
      "Study the diagram carefully before audio",
      "Note compass directions on maps",
      "Listen for location words: next to opposite between",
      "Answers follow the route described in audio",
    ],
  },
  {
    id: "form-completion",
    name: "Form Completion",
    trackerName: "Form Completion",
    description: "Fill in a form with information from audio",
    difficulty: "easy",
    wordLimit: "NO MORE THAN TWO WORDS AND/OR A NUMBER",
    sections: [1, 2],
    tips: [
      "Questions follow order of audio",
      "Answers are often names numbers dates addresses",
      "Spelling must be correct — speaker often spells names",
      "Listen carefully — numbers may be corrected",
    ],
  },
  {
    id: "note-completion",
    name: "Note Completion",
    trackerName: "Note Completion",
    description: "Complete notes using words from the audio",
    difficulty: "medium",
    wordLimit: "NO MORE THAN TWO WORDS AND/OR A NUMBER",
    sections: [1, 2, 3, 4],
    tips: [
      "Answers follow audio order",
      "Use exact words from audio",
      "Word limit is strict — never exceed it",
      "Predict answer type: noun number adjective",
    ],
  },
  {
    id: "table-completion",
    name: "Table Completion",
    trackerName: "Table Completion",
    description: "Complete a table with missing information",
    difficulty: "medium",
    wordLimit: "NO MORE THAN TWO WORDS AND/OR A NUMBER",
    sections: [1, 2, 3, 4],
    tips: [
      "Read table headers before audio to understand structure",
      "Look at row and column context for clues",
      "Numbers and dates are common answers",
      "Answers may not follow strict audio order",
    ],
  },
  {
    id: "flowchart-completion",
    name: "Flow-chart Completion",
    trackerName: "Flow-chart Completion",
    description: "Complete a flowchart showing a process",
    difficulty: "hard",
    wordLimit: "NO MORE THAN TWO WORDS",
    sections: [3, 4],
    tips: [
      "Follow the arrows to understand the sequence",
      "Listen for sequence markers: first then next finally",
      "Answers follow process order in audio",
      "Look for cause and effect relationships",
    ],
  },
  {
    id: "summary-completion",
    name: "Summary Completion",
    trackerName: "Summary Completion",
    description: "Complete a summary paragraph from the audio",
    difficulty: "medium",
    wordLimit: "NO MORE THAN TWO WORDS AND/OR A NUMBER",
    sections: [3, 4],
    tips: [
      "Read full summary before audio starts",
      "Answers are paraphrased in summary but exact in audio",
      "Predict word type for each gap",
      "Answers follow audio order",
    ],
  },
  {
    id: "sentence-completion",
    name: "Sentence Completion",
    trackerName: "Sentence Completion",
    description: "Complete sentences using words from audio",
    difficulty: "medium",
    wordLimit: "NO MORE THAN TWO WORDS AND/OR A NUMBER",
    sections: [1, 2, 3, 4],
    tips: [
      "Answer must complete sentence grammatically",
      "Use exact words from audio",
      "Predict word type before audio plays",
      "Answers follow audio order",
    ],
  },
  {
    id: "short-answer",
    name: "Short Answer Questions",
    trackerName: "Short Answer Questions",
    description: "Answer questions with words from the audio",
    difficulty: "medium",
    wordLimit: "NO MORE THAN THREE WORDS AND/OR A NUMBER",
    sections: [1, 2, 3, 4],
    tips: [
      "Use exact words from audio — never paraphrase",
      "Keep within word limit",
      "Questions follow audio order",
      "Question word tells you answer type: who what where when",
    ],
  },
];

export const SECTION_CONFIG = {
  1: {
    name: "Conversation",
    type: "dialogue",
    speakers: 2,
    primaryQuestionType: "form-completion",
    topics: SECTION1_SCENARIOS,
  },
  2: {
    name: "Social Monologue",
    type: "monologue",
    speakers: 1,
    primaryQuestionType: "note-completion",
    topics: [
      "Museum audio tour",
      "City walking tour guide",
      "Community centre facilities",
      "Local park information",
      "Transport system overview",
      "Shopping centre announcement",
      "University campus tour",
      "Nature reserve guide",
      "Sports facility overview",
      "Cultural centre information",
    ],
  },
  3: {
    name: "Academic Discussion",
    type: "discussion",
    speakers: 3,
    primaryQuestionType: "multiple-choice",
    topics: [
      "Research project discussion",
      "University assignment review",
      "Field trip planning",
      "Seminar preparation",
      "Group project feedback",
      "Academic paper discussion",
      "Lab experiment planning",
      "Presentation preparation",
      "Study group session",
      "Tutor feedback meeting",
    ],
  },
  4: {
    name: "Academic Lecture",
    type: "lecture",
    speakers: 1,
    primaryQuestionType: "note-completion",
    topics: [
      "Marine biology and ocean conservation",
      "Psychology of decision making",
      "Urban architecture history",
      "Climate change and ecosystems",
      "History of ancient civilisations",
      "Technology and society",
      "Economics of developing nations",
      "Astronomy and space exploration",
      "Linguistics and language evolution",
      "Sociology of modern families",
    ],
  },
};

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
 * @param {number} sectionNumber
 */
function getSectionConfig(sectionNumber) {
  const config = SECTION_CONFIG[sectionNumber];
  if (!config) {
    throw new Error(`Invalid section number: ${sectionNumber}. Must be 1–4.`);
  }
  return config;
}

/**
 * @param {number} sectionNumber
 * @param {string} primaryQuestionType
 */
function buildTranscriptFormatInstructions(sectionNumber, assignedSpeakers) {
  const globalStart = (sectionNumber - 1) * 10 + 1;
  const globalEnd = sectionNumber * 10;
  const speakerNames = buildSpeakerPromptForSection(
    sectionNumber,
    assignedSpeakers ?? []
  );

  if (sectionNumber === 1) {
    return `For Section 1 dialogue — format EVERY line of dialogue with a speaker label.
Use EXACTLY this format on every line:
Speaker A: [text]
Speaker B: [text]
Never write dialogue without a speaker label.
${speakerNames}
Use [pause] for a brief pause (0.5s) and [long pause] for a longer pause (1s) where natural.
After the content for Questions ${globalStart}–${globalStart + 4}, insert a line containing only: [SECTION BREAK]
Then continue with Questions ${globalStart + 5}–${globalEnd}.`;
  }
  if (sectionNumber === 2) {
    return `For Section 2 social monologue — one main speaker only.
Use label "Guide:" at the start of each paragraph OR one continuous monologue without labels.
If using a label, use only: Guide: [text]
${speakerNames}
Use [pause] and [long pause] where a tour guide would pause for effect.
After the content for Questions ${globalStart}–${globalStart + 4}, insert a line containing only: [SECTION BREAK]
Then continue with Questions ${globalStart + 5}–${globalEnd}.`;
  }
  if (sectionNumber === 3) {
    return `For Section 3 academic discussion — format EVERY speaking turn with a speaker label.
Use EXACTLY:
Tutor: [text]
Student A: [text]
Student B: [text]
Never write without a speaker label.
${speakerNames}
Use [pause] when speakers hesitate or think.
After the content for Questions ${globalStart}–${globalStart + 4}, insert a line containing only: [SECTION BREAK]
Then continue with Questions ${globalStart + 5}–${globalEnd}.`;
  }
  return `For Section 4 academic lecture — single speaker only.
Do NOT use any speaker labels (no "Lecturer:" prefix).
Write as continuous flowing lecture text in paragraphs.
Use [pause] and [long pause] between major points for note-taking time.`;
}

/**
 * @param {object} params
 * @param {number} params.sectionNumber
 * @param {string} params.topic
 * @param {string} params.primaryQuestionType
 * @param {number} params.questionCount
 */
function buildUserMessage({
  sectionNumber,
  topic,
  primaryQuestionType,
  questionCount,
  assignedSpeakers,
}) {
  const config = getSectionConfig(sectionNumber);
  const resolvedPrimary =
    primaryQuestionType?.trim() || getPrimaryQuestionType(sectionNumber);
  const qType = getQuestionTypeById(resolvedPrimary);
  const wordLimit = qType?.wordLimit ?? "NO MORE THAN TWO WORDS AND/OR A NUMBER";
  const formatBlock = buildTranscriptFormatInstructions(
    sectionNumber,
    assignedSpeakers
  );
  const globalStart = (sectionNumber - 1) * 10 + 1;
  const globalEnd = sectionNumber * 10;
  const questionTypeRules = buildSectionQuestionTypeRules(sectionNumber);
  const secondaryType = getSecondaryQuestionType(sectionNumber);

  const section1FormExample =
    sectionNumber === 1
      ? `
Example (Section 1 form-completion — do NOT use multiple-choice):
"text": "Preferred floor:"
"answer": "first"
"options": []

Use field labels like: Customer name:, Phone number:, Email:, Address:, Postcode:, Check-in date:, Room type:, Number of nights:, Total price:`
      : "";

  return `Create IELTS Listening Section ${sectionNumber}.

Section type: ${config.type} (${config.name})
Topic: ${topic}
Primary question type (block 1): ${resolvedPrimary}
Second block type: ${secondaryType}
Questions: ${questionCount}
Default word limit for gaps: ${wordLimit}

${formatBlock}

${questionTypeRules}
${section1FormExample}

Return this exact JSON structure:
{
  "title": "string",
  "section": ${sectionNumber},
  "topic": "string",
  "transcript": "string (full spoken script with speaker labels)",
  "speakers": [{ "label": "string", "name": "string" }],
  "questionType": "${resolvedPrimary}",
  "wordLimit": "string",
  "questions": [
    {
      "id": 1,
      "questionNumber": ${globalStart},
      "type": "${resolvedPrimary}",
      "text": "string",
      "options": [],
      "answer": "string",
      "wordLimit": "string",
      "explanation": "string"
    }
  ]
}

Example: Section ${sectionNumber} questions use questionNumber ${globalStart} through ${globalEnd} (NOT 1–10).

For multiple-choice questions, options must be:
[{ "label": "A", "text": "..." }, { "label": "B", "text": "..." }, { "label": "C", "text": "..." }]

Critical rules:
- Generate exactly ${questionCount} questions (REQUIRED: ${QUESTIONS_PER_SECTION} when questionCount is 10) with questionNumber from ${globalStart} to ${globalEnd} (global IELTS numbering — do NOT restart at 1)
- You MUST output exactly ${QUESTIONS_PER_SECTION} questions when questionCount is 10 — never 9 or 11
- Every answer must appear verbatim in the transcript
- Form completion answers: names, numbers, addresses
- MCQ: include 3 options; include distractors in the audio before the correct answer
- Word limit answers: maximum 2 words unless the question type specifies otherwise
- Questions MUST follow the order answers appear in the transcript
- Transcript length: Section 1 ~400-600 words, Section 2 ~500-700, Section 3 ~600-800, Section 4 ~700-900
- Include natural hesitations: er, um, well, actually — especially in Sections 1 and 3
- Section 4 must have NO speaker labels in the transcript text`;
}

/**
 * @param {object} parsed
 * @param {number} sectionNumber
 */
function normalizeSectionPayload(parsed, sectionNumber, options = {}) {
  const config = getSectionConfig(sectionNumber);
  const questions = Array.isArray(parsed.questions) ? parsed.questions : [];

  const mappedQuestions = normalizeSectionQuestions(questions, sectionNumber);

  const primaryType = getPrimaryQuestionType(sectionNumber);
  const assignedSpeakers = options.assignedSpeakers ?? null;
  const speakers = normalizeSpeakersFromPayload(parsed.speakers, sectionNumber, {
    assignedSpeakers,
  });

  return {
    title: String(parsed.title ?? `Section ${sectionNumber} — ${config.name}`),
    section: Number(parsed.section ?? sectionNumber),
    topic: String(parsed.topic ?? ""),
    transcript: prepareTranscriptForListening(
      String(parsed.transcript ?? "").trim(),
      sectionNumber,
      speakers
    ),
    speakers,
    speakerPairKey: options.speakerPairKey ?? null,
    questionType: primaryType,
    wordLimit: String(parsed.wordLimit ?? ""),
    questions: mappedQuestions,
  };
}

/**
 * @param {object} params
 * @param {number} params.sectionNumber
 * @param {string} [params.topic]
 * @param {string} [params.primaryQuestionType]
 * @param {number} [params.questionCount]
 */
export async function generateListeningSection({
  sectionNumber,
  topic,
  primaryQuestionType,
  questionCount = 10,
  diversityContext = {},
}) {
  const section = Number(sectionNumber);

  let assignedSpeakers = null;
  let speakerPairKey = null;

  let resolvedTopic = topic?.trim();
  if (section === 1) {
    resolvedTopic =
      resolvedTopic ||
      pickSection1Topic(diversityContext.excludeTopics ?? []);
  } else {
    resolvedTopic = resolvedTopic || getRandomTopic(section);
  }

  const genSeed =
    diversityContext.testSeed ?? `generate-s${section}-${Date.now()}`;
  const picked = pickSpeakersForSection(section, {
    excludePairKeys: diversityContext.excludeSpeakerPairKeys ?? [],
    excludeNames: diversityContext.excludeSpeakerNames ?? [],
    preferPairType: diversityContext.preferPairType,
    testSeed: genSeed,
  });
  assignedSpeakers = identitiesFromLegacySpeakers(picked.speakers).speakers;
  speakerPairKey = picked.pairKey;

  const resolvedType =
    primaryQuestionType?.trim() || getPrimaryQuestionType(section);
  const count = Math.max(1, Math.min(15, Number(questionCount) || 10));

  const openai = getOpenAI();
  const userMessage = buildUserMessage({
    sectionNumber: section,
    topic: resolvedTopic,
    primaryQuestionType: resolvedType,
    questionCount: count,
    assignedSpeakers,
  });

  let lastError = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await openai.chat.completions.create({
        model: MODEL,
        temperature: TEMPERATURE,
        messages: [
          { role: "system", content: SYSTEM_MESSAGE },
          { role: "user", content: userMessage },
        ],
      });

      const raw = completion.choices?.[0]?.message?.content ?? "";
      if (!raw.trim()) {
        throw new Error("Empty response from OpenAI");
      }

      const parsed = parseJsonFromResponse(raw);
      let normalized = normalizeSectionPayload(parsed, section, {
        assignedSpeakers,
        speakerPairKey,
      });

      normalized = applySpeakerIdentitiesToPayload(normalized, {
        testSeed: genSeed,
        source: "openai_generate",
      });
      normalized.transcript = prepareTranscriptForListening(
        normalized.transcript,
        section,
        normalized.speakers
      );
      assertSpeakerIdentitiesValid(normalized, section);

      if (!normalized.transcript) {
        throw new Error("Generated section missing transcript");
      }
      if (normalized.questions.length === 0) {
        throw new Error("Generated section missing questions");
      }

      const check = validateSectionQuestions(
        normalized.questions,
        section
      );
      if (!check.valid) {
        throw new Error(check.errors.join("; "));
      }

      const payloadCheck = validateListeningSectionPayload(normalized, section, {
        logOnFailure: true,
        contentType: "generator",
        testNumber: "live",
        source: "openai_generate",
      });
      if (!payloadCheck.valid) {
        logListeningValidationFailure({
          contentType: "generator",
          sectionNumber: section,
          field: "generated_section",
          source: "openai_generate",
          errors: payloadCheck.errors,
        });
        throw new Error(
          `Listening validation failed: ${payloadCheck.errors.join("; ")}`
        );
      }

      return normalized;
    } catch (err) {
      lastError = err;
      console.warn(
        `[listeningGenerator] attempt ${attempt}/${MAX_RETRIES} failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  throw new Error(
    lastError instanceof Error
      ? lastError.message
      : "Failed to generate listening section after retries"
  );
}

/**
 * @param {string} text
 */
function normalizeAnswerText(text) {
  return String(text ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?'"()]/g, "");
}

/**
 * @param {string} text
 */
function stripLeadingArticle(text) {
  return text.replace(/^(the|a|an)\s+/, "");
}

/**
 * @param {string} text
 */
function wordToNumberVariants(text) {
  const normalized = normalizeAnswerText(text);
  const variants = new Set([normalized, stripLeadingArticle(normalized)]);

  if (/^\d+$/.test(normalized)) {
    const num = Number(normalized);
    const word = NUMBER_WORDS[num];
    if (word) variants.add(word);
  } else {
    const entry = Object.entries(NUMBER_WORDS).find(
      ([, word]) => word === normalized
    );
    if (entry) variants.add(entry[0]);
  }

  return variants;
}

/**
 * @param {string} a
 * @param {string} b
 */
function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}

/**
 * @param {string} a
 * @param {string} b
 */
function characterSimilarity(a, b) {
  const x = stripLeadingArticle(normalizeAnswerText(a));
  const y = stripLeadingArticle(normalizeAnswerText(b));
  if (!x && !y) return 1;
  if (!x || !y) return 0;
  if (x === y) return 1;
  const dist = levenshtein(x, y);
  const maxLen = Math.max(x.length, y.length);
  return 1 - dist / maxLen;
}

/**
 * @param {string} student
 * @param {string} correct
 */
function answersMatch(student, correct) {
  const { checkListeningAnswer } = require("./checkListeningAnswer.js");
  if (checkListeningAnswer(student, correct)) return true;

  const studentNorm = normalizeAnswerText(student);
  const correctNorm = normalizeAnswerText(correct);

  if (!studentNorm && !correctNorm) return true;
  if (!studentNorm || !correctNorm) return false;

  if (studentNorm === correctNorm) return true;

  const studentVariants = wordToNumberVariants(student);
  const correctVariants = wordToNumberVariants(correct);

  for (const s of studentVariants) {
    for (const c of correctVariants) {
      if (s === c) return true;
      if (stripLeadingArticle(s) === stripLeadingArticle(c)) return true;
    }
  }

  if (characterSimilarity(student, correct) >= 0.8) return true;

  return false;
}

/**
 * @param {Record<string, string>|string[]} studentAnswers
 * @param {Record<string, string>|string[]} correctAnswers
 */
export function scoreListeningAnswers(studentAnswers, correctAnswers) {
  const studentList = Array.isArray(studentAnswers)
    ? studentAnswers
    : Object.values(studentAnswers ?? {});
  const correctList = Array.isArray(correctAnswers)
    ? correctAnswers
    : Object.values(correctAnswers ?? {});

  const total = correctList.length;
  const results = [];
  const wrongIndexes = [];
  let score = 0;

  for (let i = 0; i < total; i++) {
    const studentAnswer = String(studentList[i] ?? "").trim();
    const correctAnswer = String(correctList[i] ?? "").trim();
    const correct = answersMatch(studentAnswer, correctAnswer);

    if (correct) score += 1;
    else wrongIndexes.push(i);

    results.push({
      correct,
      studentAnswer,
      correctAnswer,
    });
  }

  const accuracy = total > 0 ? Math.round((score / total) * 1000) / 10 : 0;

  return {
    score,
    total,
    accuracy,
    wrongIndexes,
    results,
  };
}

/**
 * @param {number} rawScore
 * @param {number} [totalQuestions=40]
 */
export function calculateListeningBand(rawScore, totalQuestions = 40) {
  const total = Math.max(1, Number(totalQuestions) || 40);
  const score = Math.max(0, Number(rawScore) || 0);

  let scaledScore = score;
  if (total === 10) {
    scaledScore = score * 4;
  } else if (total !== 40) {
    scaledScore = Math.round((score / total) * 40);
  }

  scaledScore = Math.min(40, Math.max(0, scaledScore));

  if (scaledScore >= 39) return 9.0;
  if (scaledScore >= 37) return 8.5;
  if (scaledScore >= 35) return 8.0;
  if (scaledScore >= 33) return 7.5;
  if (scaledScore >= 30) return 7.0;
  if (scaledScore >= 27) return 6.5;
  if (scaledScore >= 23) return 6.0;
  if (scaledScore >= 20) return 5.5;
  if (scaledScore >= 16) return 5.0;
  if (scaledScore >= 13) return 4.5;
  if (scaledScore >= 10) return 4.0;
  return 3.5;
}

/**
 * @param {string} id
 */
export function getQuestionTypeById(id) {
  return LISTENING_QUESTION_TYPES.find((t) => t.id === id) ?? null;
}

/**
 * @param {number} sectionNumber
 * @param {string[]} [excludeTopics=[]]
 */
export function getRandomTopic(sectionNumber, excludeTopics = []) {
  if (Number(sectionNumber) === 1) {
    return pickSection1Topic(excludeTopics);
  }
  const config = getSectionConfig(sectionNumber);
  const excluded = new Set(
    (excludeTopics ?? []).map((t) => String(t).trim().toLowerCase())
  );
  const available = config.topics.filter(
    (t) => !excluded.has(t.trim().toLowerCase())
  );

  const pool = available.length > 0 ? available : config.topics;
  const index = Math.floor(Math.random() * pool.length);
  return pool[index];
}
