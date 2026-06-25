import OpenAI from "openai";
import type { SpeakingScore, WritingScore } from "./types";
import { clampBand, roundToHalfBand } from "./scoring";

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function averageRounded(...scores: number[]): number {
  const valid = scores.filter((n) => Number.isFinite(n) && n >= 0);
  if (!valid.length) return 5.0;
  const avg = valid.reduce((s, n) => s + n, 0) / valid.length;
  return roundToHalfBand(clampBand(avg, 4, 9));
}

export async function scoreWriting(
  prompt: string,
  studentAnswer: string,
  targetBand: number
): Promise<WritingScore> {
  const fallback: WritingScore = {
    taskAchievement: targetBand,
    coherenceCohesion: targetBand,
    lexicalResource: targetBand,
    grammaticalRange: targetBand,
    overallBand: targetBand,
    feedback:
      "Thank you for your response. AI scoring is temporarily unavailable; your tutor will review this submission.",
    saudiSpecificErrors: [],
  };

  if (!process.env.OPENAI_API_KEY || !studentAnswer.trim()) {
    return fallback;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are an expert IELTS examiner with 15 years experience.
Score this writing response strictly on IELTS band descriptors.
Return ONLY valid JSON, no markdown, no explanation outside JSON.
Saudi Arabic speaker context: watch for article omission,
direct translation, tense consistency, pronoun errors.
Target band context: ${targetBand}.
Return JSON keys: taskAchievement, coherenceCohesion, lexicalResource, grammaticalRange, overallBand, feedback, saudiSpecificErrors, improvedSentence (optional string).`,
        },
        {
          role: "user",
          content: `Prompt:\n${prompt}\n\nStudent answer:\n${studentAnswer}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = parseJson<Partial<WritingScore>>(raw, {});

    const taskAchievement = Number(parsed.taskAchievement) || targetBand;
    const coherenceCohesion = Number(parsed.coherenceCohesion) || targetBand;
    const lexicalResource = Number(parsed.lexicalResource) || targetBand;
    const grammaticalRange = Number(parsed.grammaticalRange) || targetBand;

    return {
      taskAchievement: clampBand(taskAchievement, 4, 9),
      coherenceCohesion: clampBand(coherenceCohesion, 4, 9),
      lexicalResource: clampBand(lexicalResource, 4, 9),
      grammaticalRange: clampBand(grammaticalRange, 4, 9),
      overallBand:
        Number(parsed.overallBand) ||
        averageRounded(
          taskAchievement,
          coherenceCohesion,
          lexicalResource,
          grammaticalRange
        ),
      feedback: String(
        parsed.feedback ??
          "Good effort. Focus on clearer paragraphing and more precise academic vocabulary."
      ),
      saudiSpecificErrors: Array.isArray(parsed.saudiSpecificErrors)
        ? parsed.saudiSpecificErrors.map(String)
        : [],
      improvedSentence: parsed.improvedSentence
        ? String(parsed.improvedSentence)
        : undefined,
    };
  } catch (err) {
    console.error("[placement/scoreWriting] AI fallback", err);
    return {
      ...fallback,
      feedback:
        "Thank you for your response. AI scoring is temporarily unavailable (OpenAI quota); your tutor will review this submission.",
    };
  }
}

export async function scoreSpeaking(
  transcript: string,
  targetBand: number
): Promise<SpeakingScore> {
  const fallback: SpeakingScore = {
    fluency: targetBand,
    lexicalResource: targetBand,
    grammaticalRange: targetBand,
    pronunciation: targetBand,
    overallBand: targetBand,
    feedback:
      "Thank you for speaking. AI scoring is temporarily unavailable; your tutor will review your recording.",
    saudiSpecificErrors: [],
  };

  if (!process.env.OPENAI_API_KEY || !transcript.trim()) {
    return fallback;
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: `You are an official IELTS Speaking examiner trained by the British Council, Cambridge Assessment English, and IDP.

Score this transcript using the public IELTS Speaking band descriptors for Fluency and Coherence, Lexical Resource, Grammatical Range and Accuracy, and Pronunciation.

Scoring method:
- Score each criterion independently on half-band increments (4.0–9.0)
- Overall band = average of the four criteria, rounded to nearest 0.5
- Match each criterion to the descriptor that BEST describes the performance
- When borderline between bands, award the higher band if meaning is consistently clear
- Do NOT be overly harsh — clear communication with some errors can still achieve Band 6.0–7.0
- Short answers are acceptable for Part 1-style responses

Return ONLY valid JSON, no markdown.
Saudi Arabic speaker context: note article omission, calque expressions, or gender pronoun slips only if they affect clarity — do not penalize L1 features that do not impede understanding.
Placement context band: ${targetBand} (use as reference, not a ceiling).
Return JSON keys: fluency, lexicalResource, grammaticalRange, pronunciation, overallBand, feedback, saudiSpecificErrors, improvedSentence (optional).`,
        },
        {
          role: "user",
          content: `Transcript:\n${transcript}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = parseJson<Partial<SpeakingScore>>(raw, {});

    const fluency = Number(parsed.fluency) || targetBand;
    const lexicalResource = Number(parsed.lexicalResource) || targetBand;
    const grammaticalRange = Number(parsed.grammaticalRange) || targetBand;
    const pronunciation = Number(parsed.pronunciation) || targetBand;

    return {
      fluency: clampBand(fluency, 3, 9),
      lexicalResource: clampBand(lexicalResource, 3, 9),
      grammaticalRange: clampBand(grammaticalRange, 3, 9),
      pronunciation: clampBand(pronunciation, 3, 9),
      overallBand:
        Number(parsed.overallBand) ||
        averageRounded(fluency, lexicalResource, grammaticalRange, pronunciation),
      feedback: String(
        parsed.feedback ??
          "Keep practising extended answers with clear signposting and natural linking phrases."
      ),
      saudiSpecificErrors: Array.isArray(parsed.saudiSpecificErrors)
        ? parsed.saudiSpecificErrors.map(String)
        : [],
      improvedSentence: parsed.improvedSentence
        ? String(parsed.improvedSentence)
        : undefined,
    };
  } catch (err) {
    console.error("[placement/scoreSpeaking] AI fallback", err);
    return {
      ...fallback,
      feedback:
        "Thank you for speaking. AI scoring is temporarily unavailable (OpenAI quota); your tutor will review your recording.",
    };
  }
}
