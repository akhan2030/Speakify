import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { SCORING_PROMPT } from "@/lib/speaking/examinerPrompt";
import { buildTranscriptReview } from "@/lib/speaking/transcriptReview";
import {
  extractStudentSpeech,
  hasValidSpeechInput,
  isLikelyRealStudentSpeech,
} from "@/lib/speaking/validateSpeechInput";

export const runtime = "nodejs";

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function getSupabase() {
  return createClient(getSupabaseUrl(), process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function fallbackEvidence(studentTranscript) {
  const firstLine = String(studentTranscript || "")
    .split("\n")
    .map((line) => line.replace(/^\[Part \d+\]\s*/, "").trim())
    .find(Boolean);
  return firstLine ? firstLine.slice(0, 140) : "";
}

function buildCriterionFeedback(feedback, studentTranscript) {
  const criteria = feedback.criteria || {};
  const existing = feedback.criterionFeedback || {};
  const evidence = fallbackEvidence(studentTranscript);

  const item = (key, band, fallbackNote) => ({
    band: numberOrNull(existing[key]?.band) ?? numberOrNull(band) ?? 0,
    note: String(existing[key]?.note || fallbackNote),
    evidence: String(existing[key]?.evidence || evidence),
    ...(existing[key]?.flaggedWords
      ? { flaggedWords: existing[key].flaggedWords }
      : {}),
    ...(existing[key]?.exampleError
      ? { exampleError: existing[key].exampleError }
      : {}),
  });

  const topLexical = (feedback.topImprovements || []).find((entry) =>
    String(entry.category || "").toLowerCase().includes("lex")
  );
  const topGrammar = (feedback.topImprovements || []).find((entry) =>
    String(entry.category || "").toLowerCase().includes("gram")
  );

  return {
    fluency: item(
      "fluency",
      criteria.fluencyCoherence,
      `Your fluency score reflects the answer around "${evidence}". Build longer answers with linking phrases and fewer restarts.`
    ),
    lexical: item(
      "lexical",
      criteria.lexicalResource,
      topLexical?.suggestion ||
        `Your vocabulary needs more precise topic words. Upgrade repeated basic words from "${evidence}".`
    ),
    grammar: item(
      "grammar",
      criteria.grammaticalRange,
      topGrammar?.suggestion ||
        `Your grammar was understandable, but review tense and sentence control in phrases like "${evidence}".`
    ),
    pronunciation: item(
      "pronunciation",
      criteria.pronunciation,
      `Pronunciation is estimated from the transcript and speaking flow. Practise sentence stress using a phrase like "${evidence}".`
    ),
  };
}

function buildSessionScore(feedback, studentTranscript) {
  const criterionFeedback = buildCriterionFeedback(feedback, studentTranscript);
  return {
    overall_band: numberOrNull(feedback.overallBand) ?? 0,
    fluency: criterionFeedback.fluency,
    lexical: criterionFeedback.lexical,
    grammar: criterionFeedback.grammar,
    pronunciation: criterionFeedback.pronunciation,
    transcript: studentTranscript,
  };
}

function cleanVocabularyWord(raw) {
  const word = String(raw || "")
    .trim()
    .replace(/^["'“”‘’]+|["'“”‘’.,;:!?]+$/g, "")
    .replace(/\s+/g, " ");
  if (!word || word.length < 3 || word.length > 40) return null;
  if (/^\d+$/.test(word)) return null;
  return word.toLowerCase();
}

function wordsFromReplacementText(text) {
  const value = String(text || "");
  const matches = [
    ...value.matchAll(
      /(?:replace with|try|use|upgrade to|such as|including)\s*:?\s*([^.;\n]+)/gi
    ),
  ];
  const candidates = [];
  for (const match of matches) {
    candidates.push(
      ...String(match[1] || "")
        .split(/,|\bor\b|\band\b|\//i)
        .map(cleanVocabularyWord)
        .filter(Boolean)
    );
  }
  return candidates;
}

function extractVocabularyBankWords(feedback) {
  const words = new Set();

  for (const word of feedback.vocabularyChallenge || []) {
    const cleaned = cleanVocabularyWord(word);
    if (cleaned) words.add(cleaned);
  }

  const lexical = feedback.criterionFeedback?.lexical || feedback.sessionScore?.lexical;
  for (const word of lexical?.flaggedWords || []) {
    const cleaned = cleanVocabularyWord(word);
    if (cleaned) words.add(cleaned);
  }

  for (const improvement of feedback.topImprovements || []) {
    const category = String(improvement.category || "").toLowerCase();
    if (!category.includes("lex") && !category.includes("vocab")) continue;
    for (const field of ["suggestion", "improvedVersion", "example"]) {
      for (const word of wordsFromReplacementText(improvement[field])) {
        if (word) words.add(word);
      }
    }
  }

  return [...words].slice(0, 12);
}

async function upsertVocabularyBank(supabase, studentId, sessionId, feedback) {
  const words = extractVocabularyBankWords(feedback);
  if (words.length === 0) return;

  const today = new Date().toISOString().split("T")[0];
  const rows = words.map((word) => ({
    student_id: studentId,
    word,
    source: "speaking_scoring",
    source_session_id: sessionId,
    next_review_date: today,
    status: "due",
  }));

  const { error } = await supabase.from("vocabulary_bank").upsert(rows, {
    onConflict: "student_id,word",
    ignoreDuplicates: true,
  });

  if (error) {
    console.warn("[speaking/session/score] vocabulary_bank:", error.message);
  }
}

export async function POST(req) {
  try {
    const { sessionId, studentId, speakingTimeSeconds } = await req.json();

    if (!sessionId || !studentId) {
      return NextResponse.json(
        { error: "sessionId and studentId are required" },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OpenAI not configured" }, { status: 503 });
    }

    const supabase = getSupabase();

    const { data: session, error: sessionError } = await supabase
      .from("speaking_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.student_id !== studentId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const transcript = Array.isArray(session.transcript) ? session.transcript : [];
    const speechSeconds = Number(speakingTimeSeconds) || Number(session.speaking_time_seconds) || 0;

    const validation = hasValidSpeechInput({
      transcript,
      speakingTimeSeconds: speechSeconds,
      practiceMode: session.session_type === "practice",
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.reason || "Insufficient speech data. Please complete the speaking session.",
          insufficientSpeech: true,
        },
        { status: 400 }
      );
    }

    const extracted = extractStudentSpeech(transcript);
    const studentTranscript = transcript
      .filter((t) => t.role === "student")
      .filter((t) => isLikelyRealStudentSpeech(String(t.text || "")).ok)
      .map((t) => `[Part ${t.part}] ${t.text}`)
      .join("\n");

    if (!studentTranscript || extracted.wordCount < 30 || extracted.substantiveAnswers < 2) {
      return NextResponse.json(
        {
          error:
            validation.reason ||
            "Not enough valid student speech detected. Background media and examiner echo do not count toward your score.",
          insufficientSpeech: true,
        },
        { status: 400 }
      );
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.time("[speaking/session/score] LLM grading");
    let response;
    try {
      response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SCORING_PROMPT },
          {
            role: "user",
            content: `Full student transcript:\n\n${studentTranscript}\n\nProvide band scores, criterionFeedback, and detailed feedback.`,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 2600,
      });
    } finally {
      console.timeEnd("[speaking/session/score] LLM grading");
    }

    const raw = response.choices[0]?.message?.content || "{}";
    const feedback = JSON.parse(raw);
    const criterionFeedback = buildCriterionFeedback(feedback, studentTranscript);
    const sessionScore = buildSessionScore(
      { ...feedback, criterionFeedback },
      studentTranscript
    );
    feedback.criterionFeedback = criterionFeedback;
    feedback.sessionScore = sessionScore;
    feedback.sessionTranscript = transcript;
    feedback.transcriptReview = buildTranscriptReview(transcript, feedback);

    const completedAt = new Date();
    const startedAt = session.started_at ? new Date(session.started_at) : completedAt;
    const durationMinutes = Math.max(
      1,
      Math.round((completedAt.getTime() - startedAt.getTime()) / 60000)
    );

    await supabase
      .from("speaking_sessions")
      .update({
        overall_band: sessionScore.overall_band,
        fluency_band: sessionScore.fluency.band,
        lexical_band: sessionScore.lexical.band,
        grammar_band: sessionScore.grammar.band,
        pronunciation_band: sessionScore.pronunciation.band,
        feedback,
        duration_minutes: durationMinutes,
        speaking_time_seconds: speechSeconds,
        completed_at: completedAt.toISOString(),
      })
      .eq("id", sessionId);

    const { data: existing } = await supabase
      .from("speaking_progress")
      .select("*")
      .eq("student_id", studentId)
      .maybeSingle();

    const bandHistory = Array.isArray(existing?.band_history)
      ? [...existing.band_history]
      : [];
    bandHistory.push({
      sessionNumber: session.session_number,
      band: sessionScore.overall_band,
      date: new Date().toISOString(),
      criteria: {
        fluencyCoherence: sessionScore.fluency.band,
        lexicalResource: sessionScore.lexical.band,
        grammaticalRange: sessionScore.grammar.band,
        pronunciation: sessionScore.pronunciation.band,
      },
    });

    await supabase.from("speaking_progress").upsert(
      {
        student_id: studentId,
        total_sessions: (existing?.total_sessions || 0) + 1,
        current_band: sessionScore.overall_band,
        best_band: Math.max(existing?.best_band || 0, sessionScore.overall_band || 0),
        band_history: bandHistory.slice(-20),
        last_session_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "student_id" }
    );

    if (feedback.vocabularyChallenge?.length > 0) {
      const rows = feedback.vocabularyChallenge.map((word) => ({
        student_id: studentId,
        word,
        assigned_date: new Date().toISOString().split("T")[0],
      }));
      await supabase.from("speaking_vocabulary_progress").upsert(rows, {
        onConflict: "student_id,word,assigned_date",
        ignoreDuplicates: true,
      });
    }

    await upsertVocabularyBank(supabase, studentId, sessionId, feedback);

    return NextResponse.json(feedback);
  } catch (err) {
    console.error("[speaking/session/score]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Scoring failed" },
      { status: 500 }
    );
  }
}
