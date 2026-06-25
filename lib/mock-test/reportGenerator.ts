import OpenAI from "openai";
import { bandToCefr } from "@/lib/placement/scoring";
import { scoreSpeaking, scoreWriting } from "@/lib/placement/aiScoring";
import { getStaticExamContent } from "./staticExamContent";
import type {
  ExaminerReportPayload,
  MockTestFullReport,
  SkillCardBase,
  SpeakingPartTranscript,
} from "./reportTypes";
import {
  computeBandPrediction,
  computeConfidenceFromSkills,
  computeOverallBand,
  computePredictedRange,
  scoreListening,
  scoreReading,
} from "./scoring";
import { SPEAKING_PARTS } from "./speakingContent";
import { WRITING_TASK1, WRITING_TASK2 } from "./writingContent";

const RESOURCE_MAP: Record<string, { label: string; href: string }[]> = {
  listening: [
    { label: "Listening practice hub", href: "/dashboard/student/listening" },
    { label: "Section drills", href: "/dashboard/student/listening/test" },
  ],
  reading: [
    { label: "Reading mock tests", href: "/dashboard/student/reading/test" },
    { label: "Question-type practice", href: "/dashboard/student/reading/practice" },
  ],
  writing: [
    { label: "Writing feedback lab", href: "/dashboard/student/writing" },
    { label: "Grammar for writing", href: "/dashboard/student/grammar" },
  ],
  speaking: [
    { label: "Speaking mock tests", href: "/dashboard/student/speaking/mock" },
    { label: "Part 2 cue cards", href: "/dashboard/student/speaking/part2" },
  ],
  vocabulary: [
    { label: "Vocabulary builder", href: "/dashboard/student/vocabulary" },
  ],
  grammar: [
    { label: "Grammar lessons", href: "/dashboard/student/grammar" },
  ],
};

function bandMeaning(band: number, skill: string): string {
  if (band >= 7.5)
    return `Strong ${skill} performance at an advanced level — close to exam-ready.`;
  if (band >= 6.5)
    return `Competent ${skill} — meets most university requirements with targeted polish.`;
  if (band >= 5.5)
    return `Moderate ${skill} — functional but inconsistent under exam pressure.`;
  if (band >= 4.5)
    return `Developing ${skill} — foundation present but significant gaps remain.`;
  return `Limited ${skill} — focused foundation work recommended before full IELTS prep.`;
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function buildSpeakingPartTranscripts(
  transcripts: Record<string, string>
): SpeakingPartTranscript[] {
  const parts: SpeakingPartTranscript[] = [];

  SPEAKING_PARTS.forEach((part) => {
    if (part.part === 2) {
      const text = transcripts["speaking-p2"] ?? "";
      if (text.trim()) {
        parts.push({
          part: "2",
          label: "Part 2 — Long turn",
          text,
        });
      }
      return;
    }
    part.questions.forEach((q, i) => {
      const key = `speaking-p${part.part}-q${i}`;
      const text = transcripts[key] ?? "";
      if (text.trim()) {
        parts.push({
          part: String(part.part),
          label: `Part ${part.part} — Q${i + 1}: ${q.slice(0, 50)}…`,
          text,
        });
      }
    });
  });

  if (!parts.length) {
    Object.entries(transcripts).forEach(([key, text]) => {
      if (text.trim()) {
        parts.push({ part: key, label: key, text });
      }
    });
  }

  return parts;
}

function combineSpeakingTranscript(transcripts: Record<string, string>): string {
  return buildSpeakingPartTranscripts(transcripts)
    .map((p) => p.text)
    .join("\n\n");
}

function formatQuestionType(type: string): string {
  return type
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type AiEnrichment = {
  listening: SkillCardBase;
  reading: SkillCardBase;
  writing: Omit<SkillCardBase, "band"> & {
    annotatedFeedback: string;
    task1Feedback: string;
    task2Feedback: string;
    writingHighlights: { phrase: string; type: "good" | "weak" }[];
  };
  speaking: Omit<SkillCardBase, "band"> & {
    strongPhrases: string[];
    weakPhrases: string[];
  };
  vocabulary: { strongWords: string[]; weakPatterns: string[] };
  grammar: { structuresUsedWell: string[]; errorPatterns: string[] };
  improvementPlan: MockTestFullReport["improvementPlan"];
};

async function enrichReportWithAi(payload: {
  listening: ReturnType<typeof scoreListening>;
  reading: ReturnType<typeof scoreReading>;
  task1Score: Awaited<ReturnType<typeof scoreWriting>>;
  task2Score: Awaited<ReturnType<typeof scoreWriting>>;
  speakingScore: Awaited<ReturnType<typeof scoreSpeaking>>;
  task1Text: string;
  task2Text: string;
  speakingTranscript: string;
  weakAreas: string[];
}): Promise<AiEnrichment | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.35,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `You are a senior British Council IELTS examiner writing premium mock-test reports for Saudi Arabic-speaking students.
Return ONLY valid JSON:
{
  "listening": { "meaning": "2 sentences", "strengths": [3 strings], "weaknesses": [3 strings], "priority": string, "examinerReport": "2-3 paragraphs" },
  "reading": { same shape },
  "writing": { "meaning", "strengths", "weaknesses", "priority", "examinerReport", "annotatedFeedback", "task1Feedback", "task2Feedback", "writingHighlights": [{"phrase": string, "type": "good"|"weak"}] },
  "speaking": { "meaning", "strengths", "weaknesses", "priority", "examinerReport", "strongPhrases": [strings], "weakPhrases": [strings] },
  "vocabulary": { "strongWords": [strings], "weakPatterns": [strings] },
  "grammar": { "structuresUsedWell": [strings], "errorPatterns": [strings] },
  "improvementPlan": [
    { "week": 1, "phase": string, "focus": string, "resources": [{"label": string, "href": string}] },
    { "week": 2, ... }, { "week": 3, ... }, { "week": 4, ... }
  ]
}
Week 1: weakest skill. Week 2: second weakest + vocabulary. Week 3: mock practice + writing. Week 4: speaking + full mock.
Use Speakify module paths like /dashboard/student/listening etc.
Be specific, professional, reference actual student performance.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          weakAreas: payload.weakAreas,
          listening: {
            band: payload.listening.band,
            correct: payload.listening.correct,
            sections: payload.listening.sectionBreakdown,
            strongest: payload.listening.strongestQuestionType,
            weakest: payload.listening.weakestQuestionType,
          },
          reading: {
            band: payload.reading.band,
            correct: payload.reading.correct,
            passages: payload.reading.passageBreakdown,
          },
          writing: {
            task1Band: payload.task1Score.overallBand,
            task2Band: payload.task2Score.overallBand,
            task1Criteria: payload.task1Score,
            task2Criteria: payload.task2Score,
            task1Text: payload.task1Text.slice(0, 900),
            task2Text: payload.task2Text.slice(0, 1400),
          },
          speaking: {
            band: payload.speakingScore.overallBand,
            criteria: payload.speakingScore,
            transcript: payload.speakingTranscript.slice(0, 2500),
          },
        }),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  const parsed = parseJson<Partial<AiEnrichment>>(raw, {});
  if (!parsed.listening || !parsed.reading || !parsed.writing || !parsed.speaking) {
    return null;
  }
  return parsed as AiEnrichment;
}

function defaultSkillCard(skill: string, band: number): SkillCardBase {
  return {
    band,
    meaning: bandMeaning(band, skill),
    strengths: [
      `Shows baseline ${skill} ability at band ${band.toFixed(1)} level`,
      "Completed the full mock test section under timed conditions",
      "Demonstrates willingness to engage with authentic IELTS task types",
    ],
    weaknesses: [
      "Inconsistent accuracy on higher-difficulty items",
      "Time management under pressure needs refinement",
      "Some question types show recurring error patterns",
    ],
    priority: `Focus on ${skill} question-type drills and timed practice this week`,
    examinerReport: `Your ${skill} performance suggests a band ${band.toFixed(1)} level. You show competence on familiar task types but lose marks on items requiring finer detail or inference. With structured practice targeting your weakest sub-skills, a half-band improvement within four weeks is realistic.`,
  };
}

function defaultImprovementPlan(
  weakAreas: string[]
): MockTestFullReport["improvementPlan"] {
  const w1 = weakAreas[0]?.toLowerCase() ?? "reading";
  const w2 = weakAreas[1]?.toLowerCase() ?? "writing";
  const skillHref = (s: string) =>
    RESOURCE_MAP[s.includes("listen") ? "listening" : s.includes("read") ? "reading" : s.includes("writ") ? "writing" : s.includes("speak") ? "speaking" : "reading"];

  return [
    {
      week: 1,
      phase: "Foundation",
      focus: `Focus on ${weakAreas[0] ?? "Reading"} — your weakest skill`,
      resources: skillHref(w1),
    },
    {
      week: 2,
      phase: "Build",
      focus: `${weakAreas[1] ?? "Writing"} + academic vocabulary`,
      resources: [...skillHref(w2), ...RESOURCE_MAP.vocabulary],
    },
    {
      week: 3,
      phase: "Practice",
      focus: "Timed mock test practice + Writing Task 2 structure",
      resources: [...RESOURCE_MAP.writing, { label: "Full mock test", href: "/mock-test/exam" }],
    },
    {
      week: 4,
      phase: "Confidence",
      focus: "Speaking fluency + full mock under exam conditions",
      resources: [...RESOURCE_MAP.speaking, { label: "Take another mock", href: "/mock-test/exam" }],
    },
  ];
}

export function extractExaminerReport(
  report: MockTestFullReport
): ExaminerReportPayload {
  return {
    listening: report.skills.listening.examinerReport,
    reading: report.skills.reading.examinerReport,
    writing: report.skills.writing.examinerReport,
    speaking: report.skills.speaking.examinerReport,
    vocabulary: report.vocabulary,
    grammar: report.grammar,
    improvementPlan: report.improvementPlan,
  };
}

export async function generateMockTestReport(
  answers: Record<string, string>,
  transcripts: Record<string, string>,
  options?: {
    examContent?: import("./types").MockExamContent | null;
    studentName?: string;
    completedAt?: string;
  }
): Promise<MockTestFullReport> {
  const examContent = options?.examContent ?? getStaticExamContent();
  const listening = scoreListening(answers);
  const reading = scoreReading(answers, examContent);

  const task1Text = answers[WRITING_TASK1.id] ?? "";
  const task2Text = answers[WRITING_TASK2.id] ?? "";
  const partTranscripts = buildSpeakingPartTranscripts(transcripts);
  const speakingTranscript = combineSpeakingTranscript(transcripts);

  const [task1Score, task2Score, speakingScore] = await Promise.all([
    scoreWriting(WRITING_TASK1.prompt, task1Text, listening.band),
    scoreWriting(WRITING_TASK2.prompt, task2Text, reading.band),
    scoreSpeaking(speakingTranscript, Math.min(listening.band, reading.band)),
  ]);

  const writingBand =
    computeOverallBand({
      writing: (task1Score.overallBand + task2Score.overallBand) / 2,
    }) ?? task2Score.overallBand;

  const overallBand =
    computeOverallBand({
      listening: listening.band,
      reading: reading.band,
      writing: writingBand,
      speaking: speakingScore.overallBand,
    }) ?? 5.5;

  const skillBands = [
    listening.band,
    reading.band,
    writingBand,
    speakingScore.overallBand,
  ];

  const weakAreas = [
      { skill: "Listening", band: listening.band },
      { skill: "Reading", band: reading.band },
      { skill: "Writing", band: writingBand },
      { skill: "Speaking", band: speakingScore.overallBand },
    ]
    .sort((a, b) => a.band - b.band)
    .slice(0, 2)
    .map((s) => s.skill);

  const ai = await enrichReportWithAi({
    listening,
    reading,
    task1Score,
    task2Score,
    speakingScore,
    task1Text,
    task2Text,
    speakingTranscript,
    weakAreas,
  });

  const cefr = bandToCefr(overallBand);
  const bandPrediction = computeBandPrediction(overallBand);

  const listeningMeaning =
    ai?.listening?.meaning ??
    `${bandMeaning(listening.band, "listening")} You answered ${listening.correct} of ${listening.total} correctly.`;

  const readingMeaning =
    ai?.reading?.meaning ??
    `${bandMeaning(reading.band, "reading")} Accuracy: ${Math.round(reading.accuracy * 100)}%.`;

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    studentName: options?.studentName ?? "Candidate",
    completedAt: options?.completedAt ?? new Date().toISOString(),
    overallBand,
    confidencePercent: computeConfidenceFromSkills(skillBands),
    predictedRange: computePredictedRange(overallBand),
    cefr: { level: cefr.cefr, label: cefr.label },
    bandPrediction,
    radar: [
      { skill: "Listening", score: listening.band },
      { skill: "Reading", score: reading.band },
      { skill: "Writing", score: writingBand },
      { skill: "Speaking", score: speakingScore.overallBand },
    ],
    skills: {
      listening: {
        ...(ai?.listening ?? defaultSkillCard("listening", listening.band)),
        band: listening.band,
        meaning: listeningMeaning,
        accuracy: Math.round(listening.accuracy * 100),
        correct: listening.correct,
        total: listening.total,
        sectionBreakdown: listening.sectionBreakdown,
        strongestQuestionType: formatQuestionType(listening.strongestQuestionType),
        weakestQuestionType: formatQuestionType(listening.weakestQuestionType),
      },
      reading: {
        ...(ai?.reading ?? defaultSkillCard("reading", reading.band)),
        band: reading.band,
        meaning: readingMeaning,
        accuracy: Math.round(reading.accuracy * 100),
        correct: reading.correct,
        total: reading.total,
        passageBreakdown: reading.passageBreakdown,
      },
      writing: {
        ...(ai?.writing ?? {
          ...defaultSkillCard("writing", writingBand),
          annotatedFeedback:
            task2Score.feedback ||
            "Detailed writing feedback will appear here after AI evaluation.",
          task1Feedback: task1Score.feedback,
          task2Feedback: task2Score.feedback,
          writingHighlights: [],
        }),
        band: writingBand,
        task1Band: task1Score.overallBand,
        task2Band: task2Score.overallBand,
        task1Criteria: {
          taskAchievement: task1Score.taskAchievement,
          coherenceCohesion: task1Score.coherenceCohesion,
          lexicalResource: task1Score.lexicalResource,
          grammaticalRange: task1Score.grammaticalRange,
        },
        task2Criteria: {
          taskAchievement: task2Score.taskAchievement,
          coherenceCohesion: task2Score.coherenceCohesion,
          lexicalResource: task2Score.lexicalResource,
          grammaticalRange: task2Score.grammaticalRange,
        },
        task1Text: task1Text || "No Task 1 response submitted.",
        task2Text: task2Text || "No Task 2 response submitted.",
      },
      speaking: {
        ...(ai?.speaking ?? {
          ...defaultSkillCard("speaking", speakingScore.overallBand),
          strongPhrases: [],
          weakPhrases: [],
        }),
        band: speakingScore.overallBand,
        fluency: speakingScore.fluency,
        lexicalResource: speakingScore.lexicalResource,
        grammaticalRange: speakingScore.grammaticalRange,
        pronunciation: speakingScore.pronunciation,
        transcript: speakingTranscript || "No speaking transcript captured.",
        partTranscripts,
        strongPhrases: ai?.speaking?.strongPhrases ?? [],
        weakPhrases: ai?.speaking?.weakPhrases ?? [],
      },
    },
    vocabulary: ai?.vocabulary ?? {
      strongWords: ["However", "Furthermore", "In contrast"],
      weakPatterns: ["Very good (overused intensifier)", "A lot of (informal)"],
    },
    grammar: ai?.grammar ?? {
      structuresUsedWell: ["Simple compound sentences", "Present perfect attempts"],
      errorPatterns: ["Article omission (a/the)", "Subject-verb agreement"],
    },
    improvementPlan: ai?.improvementPlan ?? defaultImprovementPlan(weakAreas),
    weakAreas,
    examinerReviewed: Boolean(ai),
  };
}

export function isFullReport(value: unknown): value is MockTestFullReport {
  return (
    typeof value === "object" &&
    value !== null &&
    (value as MockTestFullReport).version === 1 &&
    typeof (value as MockTestFullReport).overallBand === "number"
  );
}
