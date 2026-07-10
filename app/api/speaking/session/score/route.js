import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { buildTranscriptReview } from "@/lib/speaking/transcriptReview";
import {
  collectWordTimingsFromTranscript,
  computeFluencyMetrics,
} from "@/lib/speaking/fluencyMetrics";
import { assessPronunciation } from "@/lib/speaking/pronunciationAssessment";
import {
  structuredScoreToLegacyFeedback,
} from "@/lib/speaking/scoringSchema";
import {
  deriveVocabularyUpgrades,
  repairStructuredScoreEvidence,
} from "@/lib/speaking/scoreEvidence";
import {
  runStructuredScoring,
  structuredToCoachingFields,
} from "@/lib/speaking/structuredScoring";
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

function pickEvidence(preferred, studentTranscript) {
  const quote = String(preferred || "").trim();
  if (quote && !/^(my name is|i am|i'm)\b/i.test(quote)) {
    return quote.slice(0, 160);
  }
  const lines = String(studentTranscript || "")
    .split("\n")
    .map((line) => line.replace(/^\[Part \d+\]\s*/, "").trim())
    .filter(Boolean)
    .filter((line) => !/^(my name is|i am|i'm)\b/i.test(line) || line.split(/\s+/).length > 6);
  return (lines[0] || quote || "").slice(0, 160);
}

function buildCriterionFeedback(feedback, studentTranscript) {
  const criteria = feedback.criteria || {};
  const existing = feedback.criterionFeedback || {};

  const item = (key, band, fallbackNoteFor) => {
    const evidenceQuote = pickEvidence(existing[key]?.evidence, studentTranscript);
    const fallbackNote =
      typeof fallbackNoteFor === "function"
        ? fallbackNoteFor(evidenceQuote)
        : String(fallbackNoteFor || "");
    return {
      band: numberOrNull(existing[key]?.band) ?? numberOrNull(band) ?? 0,
      note: String(existing[key]?.note || fallbackNote),
      evidence: evidenceQuote,
      ...(existing[key]?.flaggedWords
        ? { flaggedWords: existing[key].flaggedWords }
        : {}),
      ...(existing[key]?.exampleError
        ? { exampleError: existing[key].exampleError }
        : {}),
    };
  };

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
      (evidenceQuote) =>
        `Your fluency score reflects the answer around "${evidenceQuote}". Build longer answers with linking phrases and fewer restarts.`
    ),
    lexical: item(
      "lexical",
      criteria.lexicalResource,
      (evidenceQuote) =>
        topLexical?.suggestion ||
        `Your vocabulary needs more precise topic words. Upgrade repeated basic words from "${evidenceQuote}".`
    ),
    grammar: item(
      "grammar",
      criteria.grammaticalRange,
      (evidenceQuote) =>
        topGrammar?.suggestion ||
        `Your grammar was understandable, but review tense and sentence control in phrases like "${evidenceQuote}".`
    ),
    pronunciation: item(
      "pronunciation",
      criteria.pronunciation,
      (evidenceQuote) =>
        `Pronunciation is estimated from the transcript and speaking flow. Practise sentence stress using a phrase like "${evidenceQuote}".`
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

async function upsertVocabularyBank(supabase, studentId, sessionId, feedback) {
  // Only persist personalized upgrades — never seed the bank with generic lists.
  const detailed = Array.isArray(feedback.vocabularyChallengeDetailed)
    ? feedback.vocabularyChallengeDetailed.filter((item) => item?.personalized !== false)
    : [];
  if (detailed.length === 0) return;

  const today = new Date().toISOString().split("T")[0];
  const rows = detailed.map((item) => ({
    student_id: studentId,
    word: cleanVocabularyWord(item.word),
    source: "speaking_scoring",
    source_session_id: sessionId,
    suggested_from: item.from || item.context || null,
    next_review_date: today,
    status: "due",
  })).filter((row) => row.word);

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

    const validEntries = transcript.filter(
      (t) => t.role === "student" && isLikelyRealStudentSpeech(String(t.text || "")).ok
    );
    const words = collectWordTimingsFromTranscript(validEntries);
    const speakingSecondsFromEntries = validEntries.reduce((sum, entry) => {
      const ms = Number(entry.speakingDurationMs);
      return sum + (Number.isFinite(ms) ? ms / 1000 : 0);
    }, 0);

    const fluencyMetrics = computeFluencyMetrics({
      text: extracted.text,
      words,
      speakingSeconds: speakingSecondsFromEntries || speechSeconds,
    });

    const pronunciationMetrics = await assessPronunciation({
      words,
      transcript: extracted.text,
      speakingSeconds: fluencyMetrics.speaking_seconds,
    });

    console.time("[speaking/session/score] structured grading");
    let structuredScore;
    try {
      structuredScore = await runStructuredScoring({
        openai,
        sessionId,
        studentTranscript,
        fluencyMetrics,
        pronunciationMetrics,
      });
    } finally {
      console.timeEnd("[speaking/session/score] structured grading");
    }

    structuredScore = repairStructuredScoreEvidence(
      structuredScore,
      studentTranscript
    );

    const legacyFromStructured = structuredScoreToLegacyFeedback(structuredScore);
    const coaching = structuredToCoachingFields(structuredScore);
    const criterionFeedback = buildCriterionFeedback(
      {
        ...legacyFromStructured,
        criterionFeedback: legacyFromStructured.criterionFeedback,
      },
      studentTranscript
    );

    // Transcript-derived upgrades only — never a static academic word bank.
    // Source: lexical deductions + basic/overused words actually spoken.
    const vocabularyChallengeDetailed = deriveVocabularyUpgrades(
      studentTranscript,
      structuredScore
    ).slice(0, 5);
    const vocabularyChallenge = vocabularyChallengeDetailed.map((item) => item.word);

    const feedback = {
      overallBand: structuredScore.overall_band,
      criteria: legacyFromStructured.criteria,
      criterionFeedback,
      structuredScore,
      fluencyMetrics,
      pronunciationMetrics,
      topImprovements: coaching.topImprovements,
      strengths: coaching.strengths,
      saudiSpecificErrors: coaching.saudiSpecificErrors,
      vocabularyChallenge,
      vocabularyChallengeDetailed,
      sessionScore: {
        overall_band: structuredScore.overall_band,
        fluency: criterionFeedback.fluency,
        lexical: criterionFeedback.lexical,
        grammar: criterionFeedback.grammar,
        pronunciation: criterionFeedback.pronunciation,
        transcript: studentTranscript,
      },
      sessionTranscript: transcript,
      transcriptReview: null,
    };
    feedback.transcriptReview = buildTranscriptReview(transcript, feedback);
    const sessionScore = feedback.sessionScore;

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

    // Also record a speaking_attempts row so profile/progress/teacher views —
    // which read speaking_attempts, not speaking_sessions — see this session.
    try {
      const { error: attemptError } = await supabase
        .from("speaking_attempts")
        .insert({
          student_id: studentId,
          part: "1-3",
          task_type: session.session_type || "practice",
          question_text: session.part2_cue_card?.title ?? null,
          transcript: studentTranscript,
          duration_seconds: Math.round(speechSeconds),
          topic: session.part2_cue_card?.title ?? null,
          band_fc: sessionScore.fluency.band,
          band_lr: sessionScore.lexical.band,
          band_gra: sessionScore.grammar.band,
          band_p: sessionScore.pronunciation.band,
          band_overall: sessionScore.overall_band,
          created_at: completedAt.toISOString(),
        });
      if (attemptError) {
        console.warn(
          "[speaking/session/score] speaking_attempts insert:",
          attemptError.message
        );
      }
    } catch (attemptErr) {
      console.warn(
        "[speaking/session/score] speaking_attempts threw:",
        attemptErr instanceof Error ? attemptErr.message : attemptErr
      );
    }

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

    try {
      const { extractSpeakingDeductions } = await import(
        "@/lib/growthRoadmap/extractDeductions"
      );
      const { syncRoadmapFromSessionScore } = await import("@/lib/growthRoadmap/syncRoadmap");
      const deductions = extractSpeakingDeductions(structuredScore);
      await syncRoadmapFromSessionScore({
        supabase,
        studentId,
        sourceSessionId: sessionId,
        skill: "speaking",
        deductions,
      });
    } catch (roadmapErr) {
      console.warn(
        "[speaking/session/score] roadmap sync:",
        roadmapErr instanceof Error ? roadmapErr.message : roadmapErr
      );
    }

    return NextResponse.json(feedback);
  } catch (err) {
    console.error("[speaking/session/score]", err);
    const raw = err instanceof Error ? err.message : "";
    const clean =
      !raw || /is not defined|cannot read|undefined|null|stack|at\s+\w+/i.test(raw)
        ? "Could not generate your speaking report. Please try again."
        : raw;
    return NextResponse.json({ error: clean }, { status: 500 });
  }
}
