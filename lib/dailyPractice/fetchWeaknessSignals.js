import { createClient } from "@supabase/supabase-js";
import { recommendFocusSkills } from "@/lib/course/recommendationEngine";
import { getQuestionTypeName, normalizeQuestionType } from "@/lib/readingPassageTypes";
import { LISTENING_QUESTION_TYPES } from "@/lib/listeningGenerator";
import { getGrammarCategory } from "@/lib/grammar";
import { gtAttemptSkill } from "@/lib/ielts-general/attemptRows";
import { parseDailyPracticeProgramme } from "@/lib/dailyPractice/programme";

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

function roundBand(value) {
  if (!Number.isFinite(value)) return null;
  return Math.round(value * 10) / 10;
}

function lowestBandRow(rows, bandKey = "estimated_band") {
  const scored = (rows ?? [])
    .map((row) => ({
      ...row,
      band: Number(row[bandKey]),
      accuracy: Number(row.accuracy),
    }))
    .filter((row) => Number.isFinite(row.band) || Number.isFinite(row.accuracy));

  if (!scored.length) return null;

  return scored.sort((a, b) => {
    const bandA = Number.isFinite(a.band) ? a.band : (a.accuracy ?? 100) / 12.5;
    const bandB = Number.isFinite(b.band) ? b.band : (b.accuracy ?? 100) / 12.5;
    return bandA - bandB;
  })[0];
}

function readingSlugFromTrackerName(name) {
  const raw = String(name ?? "").trim();
  if (!raw) return null;

  const normalized = raw.toLowerCase();
  const slugs = [
    "multiple-choice",
    "true-false-not-given",
    "matching-headings",
    "matching-information",
    "matching-features",
    "matching-sentence-endings",
    "sentence-completion",
    "summary-completion",
    "note-completion",
    "short-answer",
    "diagram-completion",
    "classification",
  ];

  for (const slug of slugs) {
    if (getQuestionTypeName(slug).toLowerCase() === normalized) return slug;
    if (slug === normalizeQuestionType(raw)) return slug;
  }

  return normalizeQuestionType(raw.replace(/\s+/g, "-"));
}

function listeningTypeFromTrackerName(name) {
  const raw = String(name ?? "").trim();
  const match = LISTENING_QUESTION_TYPES.find(
    (type) =>
      type.trackerName.toLowerCase() === raw.toLowerCase() ||
      type.id === normalizeQuestionType(raw)
  );
  return match ?? null;
}

function pickSpeakingFocus(feedback) {
  if (!feedback || typeof feedback !== "object") return null;

  const structured = feedback.structuredScore;
  if (!structured?.criteria) return null;

  let weakest = null;
  let lowestBand = Infinity;

  for (const [key, value] of Object.entries(structured.criteria)) {
    const band = Number(value?.band);
    if (!Number.isFinite(band) || band >= lowestBand) continue;
    lowestBand = band;
    const deductions = Array.isArray(value?.deductions) ? value.deductions : [];
    const topDeduction = deductions.sort(
      (a, b) => Number(b?.band_impact ?? 0) - Number(a?.band_impact ?? 0)
    )[0];
    weakest = {
      criterion: key,
      band,
      reason: topDeduction?.reason ?? value?.summary ?? `Improve ${key.replace(/_/g, " ")}`,
    };
  }

  if (weakest) return weakest;

  const improvements = Array.isArray(feedback.topImprovements) ? feedback.topImprovements : [];
  const top = improvements[0];
  if (top) {
    return {
      criterion: "general",
      band: null,
      reason: top.suggestion ?? top.issue ?? "Build fluency and clearer answers",
    };
  }

  return null;
}

function pickGtReadingSectionFocus(rows) {
  const sectionLabels = {
    a: "Section A — everyday texts",
    b: "Section B — workplace documents",
    c: "Section C — extended reading",
  };

  const scored = (rows ?? [])
    .map((row) => {
      const skill = gtAttemptSkill(row);
      const match = skill.match(/^reading_section_([abc])$/i);
      if (!match) return null;
      const key = match[1].toLowerCase();
      const band = Number(row.band_score);
      const accuracy = Number(row.accuracy);
      return {
        key,
        section: `section-${key}`,
        band: Number.isFinite(band) ? band : null,
        accuracy: Number.isFinite(accuracy) ? accuracy * 100 : null,
        label: sectionLabels[key] ?? `Section ${key.toUpperCase()}`,
      };
    })
    .filter(Boolean);

  if (!scored.length) return null;

  const weakest = scored.sort((a, b) => {
    const bandA = a.band ?? (a.accuracy ?? 100) / 12.5;
    const bandB = b.band ?? (b.accuracy ?? 100) / 12.5;
    return bandA - bandB;
  })[0];

  return {
    readingSection: weakest.section,
    label: weakest.label,
    band: weakest.band,
    reason: `Weakest GT reading: ${weakest.label}${
      weakest.band != null ? ` (Band ${weakest.band.toFixed(1)})` : ""
    }`,
  };
}

function normalizeLetterType(value) {
  const v = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (v === "formal") return "formal";
  if (v === "semi_formal" || v === "semiformal") return "semiFormal";
  if (v === "informal") return "informal";
  return null;
}

function pickGtLetterFocus(rows) {
  const buckets = {
    formal: [],
    semiFormal: [],
    informal: [],
  };

  for (const row of rows ?? []) {
    const type = normalizeLetterType(row.letter_type ?? row.letterType);
    if (!type) continue;
    const score =
      row.accuracy != null
        ? Number(row.accuracy) * 100
        : row.band_score != null
          ? (Number(row.band_score) / 9) * 100
          : null;
    if (Number.isFinite(score)) buckets[type].push(score);
  }

  const averages = Object.entries(buckets)
    .map(([letterType, scores]) => ({
      letterType,
      avg:
        scores.length > 0
          ? scores.reduce((sum, value) => sum + value, 0) / scores.length
          : null,
    }))
    .filter((entry) => entry.avg != null);

  if (!averages.length) {
    return {
      taskType: "task1",
      letterType: "formal",
      reason: "Practice GT Task 1 letters — formal register",
    };
  }

  const weakest = averages.sort((a, b) => a.avg - b.avg)[0];
  const label =
    weakest.letterType === "formal"
      ? "formal letters"
      : weakest.letterType === "semiFormal"
        ? "semi-formal letters"
        : "informal letters";

  return {
    taskType: "task1",
    letterType: weakest.letterType,
    reason: `Letter weakness: ${label} (${Math.round(weakest.avg)}% accuracy)`,
  };
}

function overlayGeneralSkillBands(profile, gtBands) {
  const skillBands = { ...profile.skillBands };
  for (const skill of ["writing", "speaking", "reading", "listening", "vocabulary", "grammar"]) {
    if (gtBands[skill] != null && Number.isFinite(Number(gtBands[skill]))) {
      skillBands[skill] = Number(gtBands[skill]);
    }
  }

  const values = Object.values(skillBands).filter((band) => band != null);
  const currentBand =
    values.length > 0
      ? roundBand(values.reduce((sum, band) => sum + Number(band), 0) / values.length)
      : profile.currentBand;

  const baseline = currentBand ?? 5;
  const weakAreas = [];
  const strongAreas = [];

  for (const [skill, band] of Object.entries(skillBands)) {
    if (band == null) continue;
    if (band < baseline - 0.5) weakAreas.push(skill);
    if (band >= baseline + 0.5) strongAreas.push(skill);
  }

  return {
    ...profile,
    skillBands,
    currentBand,
    weakAreas: weakAreas.length ? weakAreas : profile.weakAreas,
    strongAreas: strongAreas.length ? strongAreas : profile.strongAreas,
  };
}

function pickWritingFocus(row, programme = "ielts") {
  if (!row) return null;

  const criteria = [
    { key: "task1", band: Number(row.band_task_achievement ?? row.band_ta), label: "Task 1 accuracy" },
    { key: "task2", band: Number(row.band_task_response ?? row.band_tr), label: "Task 2 task response" },
    { key: "coherence", band: Number(row.band_coherence ?? row.band_cc), label: "Coherence & cohesion" },
    { key: "lexical", band: Number(row.band_lexical ?? row.band_lr), label: "Lexical resource" },
    { key: "grammar", band: Number(row.band_grammar ?? row.band_gra), label: "Grammar range" },
  ].filter((item) => Number.isFinite(item.band));

  if (!criteria.length) {
    return {
      taskType: programme === "ielts_general" ? "task1" : "task2",
      reason:
        programme === "ielts_general"
          ? "Practice GT Task 1 letters and Task 2 essays"
          : "Practice structured Task 2 essays",
    };
  }

  const weakest = criteria.sort((a, b) => a.band - b.band)[0];
  const taskType =
    weakest.key === "task1" || (weakest.key === "coherence" && weakest.band < 6)
      ? "task1"
      : "task2";

  return {
    taskType,
    criterion: weakest.key,
    band: weakest.band,
    reason: `${weakest.label} at Band ${weakest.band.toFixed(1)} — targeted writing drill`,
  };
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient} supabase
 * @param {string} studentId
 * @param {import("@/lib/course/studentProfile").StudentProfile} profile
 * @param {{ programme?: string }} [options]
 */
export async function fetchWeaknessSignals(supabase, studentId, profile, options = {}) {
  const programme = parseDailyPracticeProgramme(options.programme);
  const isGeneral = programme === "ielts_general";

  let profileForFocus = profile;
  let gtReadingFocus = null;
  let gtWritingFocus = null;

  if (isGeneral) {
    const { data: gtAttempts } = await supabase
      .from("ielts_general_attempts")
      .select("skill, task_type, band_score, accuracy, letter_type, completed_at")
      .eq("student_id", studentId)
      .order("completed_at", { ascending: false })
      .limit(60);

    const attempts = gtAttempts ?? [];
    const gtBands = {};
    for (const row of attempts) {
      const skill = gtAttemptSkill(row);
      if (!skill || gtBands[skill] != null) continue;
      if (Number.isFinite(Number(row.band_score))) {
        gtBands[skill] = Number(row.band_score);
      }
    }

    profileForFocus = overlayGeneralSkillBands(profile, gtBands);
    gtReadingFocus = pickGtReadingSectionFocus(attempts);
    gtWritingFocus = pickGtLetterFocus(
      attempts.filter((row) => row.letter_type != null)
    );
  }

  const focusSkills = recommendFocusSkills(profileForFocus, 3).map((item) => item.skill);

  const speakingSessionQuery = supabase
    .from("speaking_sessions")
    .select("feedback, fluency_band, lexical_band, grammar_band, pronunciation_band, programme")
    .eq("student_id", studentId)
    .not("completed_at", "is", null)
    .not("feedback", "is", null)
    .order("completed_at", { ascending: false })
    .limit(isGeneral ? 5 : 1);

  const [
    readingTrackerRes,
    listeningTrackerRes,
    grammarProgressRes,
    speakingSessionRes,
    writingAttemptRes,
    vocabProgressRes,
    placementRes,
  ] = await Promise.all([
    supabase
      .from("reading_tracker")
      .select("question_type, attempts, accuracy, estimated_band")
      .eq("student_id", studentId)
      .gt("attempts", 0),
    supabase
      .from("listening_tracker")
      .select("question_type, attempts, accuracy, estimated_band")
      .eq("student_id", studentId)
      .gt("attempts", 0),
    supabase
      .from("grammar_progress")
      .select("category, practice_score, lessons_completed")
      .eq("student_id", studentId),
    speakingSessionQuery,
    isGeneral
      ? Promise.resolve({ data: null })
      : supabase
          .from("writing_attempts")
          .select(
            "band_overall, band_task_achievement, band_task_response, band_coherence, band_lexical, band_grammar, band_ta, band_tr, band_cc, band_lr, band_gra, task_type"
          )
          .eq("student_id", studentId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
    supabase
      .from("student_vocab_progress")
      .select("topic, mastery_score, last_rating")
      .eq("student_id", studentId)
      .order("mastery_score", { ascending: true })
      .limit(5),
    supabase
      .from("placement_attempts")
      .select("weak_areas, skill_bands")
      .eq("student_id", studentId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const speakingRows = Array.isArray(speakingSessionRes.data)
    ? speakingSessionRes.data
    : speakingSessionRes.data
      ? [speakingSessionRes.data]
      : [];
  const speakingRow = isGeneral
    ? speakingRows.find((row) => row.programme === "ielts_general") ?? speakingRows[0]
    : speakingRows[0];

  const readingWeak = lowestBandRow(readingTrackerRes.data ?? []);
  const listeningWeak = lowestBandRow(listeningTrackerRes.data ?? []);

  const grammarRows = (grammarProgressRes.data ?? [])
    .map((row) => ({
      category: String(row.category ?? ""),
      score: Number(row.practice_score),
      lessons: Number(row.lessons_completed ?? 0),
    }))
    .filter((row) => row.category);

  const grammarWeak =
    grammarRows.length > 0
      ? grammarRows.sort((a, b) => {
          const scoreA = Number.isFinite(a.score) ? a.score : 0;
          const scoreB = Number.isFinite(b.score) ? b.score : 0;
          if (scoreA !== scoreB) return scoreA - scoreB;
          return a.lessons - b.lessons;
        })[0]
      : null;

  const speakingFocus = pickSpeakingFocus(speakingRow?.feedback);
  const writingFocus = isGeneral
    ? gtWritingFocus ?? pickWritingFocus(null, programme)
    : pickWritingFocus(writingAttemptRes.data, programme);

  const weakVocab = (vocabProgressRes.data ?? []).find(
    (row) => Number(row.mastery_score) < 60 || Number(row.last_rating) <= 2
  );

  const gtVocabTopic =
    isGeneral && !weakVocab?.topic
      ? { topic: "work", reason: "GT vocabulary — workplace & everyday English" }
      : null;

  const placementWeak = Array.isArray(placementRes.data?.weak_areas)
    ? placementRes.data.weak_areas.filter(
        (area) => area && area !== "balanced practice across all skills"
      )
    : [];

  const readingSlug = readingWeak
    ? readingSlugFromTrackerName(readingWeak.question_type)
    : null;
  const listeningType = listeningWeak
    ? listeningTypeFromTrackerName(listeningWeak.question_type)
    : null;
  const grammarCategory = grammarWeak?.category ?? null;
  const grammarMeta = grammarCategory ? getGrammarCategory(grammarCategory) : null;

  return {
    programme,
    focusSkills,
    weakSkills: profileForFocus.weakAreas.filter(
      (area) => area && area !== "balanced practice across all skills"
    ),
    placementWeak,
    bySkill: {
      reading: isGeneral
        ? gtReadingFocus ??
          (readingWeak
            ? {
                questionType: readingSlug,
                readingSection: "section-b",
                label: readingWeak.question_type,
                band: roundBand(Number(readingWeak.estimated_band)),
                reason: `GT reading practice — ${readingWeak.question_type}`,
              }
            : {
                readingSection: "section-a",
                label: "Section A — everyday texts",
                reason: "Start with GT Section A — notices and everyday English",
              })
        : readingWeak
          ? {
              questionType: readingSlug,
              label: readingWeak.question_type,
              band: roundBand(Number(readingWeak.estimated_band)),
              accuracy: roundBand(Number(readingWeak.accuracy)),
              reason: `Lowest reading type: ${readingWeak.question_type}${
                readingWeak.estimated_band != null
                  ? ` (Band ${Number(readingWeak.estimated_band).toFixed(1)})`
                  : ""
              }`,
            }
          : null,
      listening: listeningWeak
        ? {
            questionTypeId: listeningType?.id ?? normalizeQuestionType(listeningWeak.question_type),
            label: listeningType?.name ?? listeningWeak.question_type,
            band: roundBand(Number(listeningWeak.estimated_band)),
            accuracy: roundBand(Number(listeningWeak.accuracy)),
            reason: `Lowest listening type: ${
              listeningType?.name ?? listeningWeak.question_type
            }`,
          }
        : null,
      grammar: grammarWeak
        ? {
            category: grammarCategory,
            label: grammarMeta?.name ?? grammarCategory,
            score: grammarWeak.score,
            reason: `${isGeneral ? "GT grammar" : "Grammar"} focus: ${
              grammarMeta?.name ?? grammarCategory
            }${
              Number.isFinite(grammarWeak.score) ? ` (${grammarWeak.score}% practice score)` : ""
            }`,
          }
        : isGeneral
          ? {
              category: "tenses",
              label: "Tenses",
              reason: "GT grammar — letter & essay tense control",
            }
          : null,
      speaking: speakingFocus
        ? {
            criterion: speakingFocus.criterion,
            band: speakingFocus.band,
            reason: isGeneral
              ? `GT speaking: ${speakingFocus.reason}`
              : speakingFocus.reason,
          }
        : null,
      writing: writingFocus,
      vocabulary: weakVocab?.topic
        ? {
            topic: String(weakVocab.topic),
            reason: `Vocabulary topic needs review: ${String(weakVocab.topic).replace(/_/g, " ")}`,
          }
        : gtVocabTopic,
    },
  };
}
