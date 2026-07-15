/**
 * Central IELTS Listening answer validation & feedback engine.
 * Used by section practice, full mocks, mini-mocks, accelerator, and future activities.
 */

const {
  expandOfficialAnswerKey,
  matchesOfficialListeningAnswer,
  matchesEitherOrderLetters,
  scoreEitherOrderGroup,
  normalizeForMatch,
  numberToWords,
  wordsToNumber,
} = require("./listeningFlexibleAnswers.js");

/** @typedef {'blank'|'correct'|'word_limit'|'spelling'|'content'|'instruction'|'either_order'|'format'} FeedbackCategory */

/**
 * Parse official instruction / wordLimit string into a limit.
 * @param {string|number|null|undefined} wordLimitOrInstruction
 * @returns {{ maxWords: number|null, allowNumber: boolean, phrase: string|null }}
 */
function parseWordLimit(wordLimitOrInstruction) {
  if (wordLimitOrInstruction == null || wordLimitOrInstruction === "") {
    return { maxWords: null, allowNumber: true, phrase: null };
  }
  if (typeof wordLimitOrInstruction === "number" && wordLimitOrInstruction > 0) {
    return {
      maxWords: wordLimitOrInstruction,
      allowNumber: true,
      phrase: `NO MORE THAN ${wordLimitOrInstruction} WORD${wordLimitOrInstruction === 1 ? "" : "S"} AND/OR A NUMBER`,
    };
  }

  const raw = String(wordLimitOrInstruction).trim();
  const upper = raw.toUpperCase();
  const allowNumber = /AND\/OR\s+A\s+NUMBER|AND\/OR NUMBER/i.test(raw);

  if (/ONE\s+WORD\s+ONLY/i.test(raw) && !/AND\/OR/i.test(raw)) {
    return { maxWords: 1, allowNumber: false, phrase: "ONE WORD ONLY" };
  }
  if (/NO MORE THAN ONE WORD/i.test(upper) || /ONE WORD AND\/OR/i.test(upper)) {
    return {
      maxWords: 1,
      allowNumber: allowNumber || /AND\/OR/i.test(raw),
      phrase: raw || "NO MORE THAN ONE WORD AND/OR A NUMBER",
    };
  }
  if (/NO MORE THAN TWO WORDS/i.test(upper) || /TWO WORDS/i.test(upper)) {
    return {
      maxWords: 2,
      allowNumber: allowNumber || /AND\/OR/i.test(raw),
      phrase: raw || "NO MORE THAN TWO WORDS AND/OR A NUMBER",
    };
  }
  if (/NO MORE THAN THREE WORDS/i.test(upper) || /THREE WORDS/i.test(upper)) {
    return {
      maxWords: 3,
      allowNumber: allowNumber || /AND\/OR/i.test(raw),
      phrase: raw || "NO MORE THAN THREE WORDS AND/OR A NUMBER",
    };
  }

  const n = Number(raw);
  if (Number.isFinite(n) && n > 0) {
    return { maxWords: n, allowNumber: true, phrase: String(n) };
  }

  return { maxWords: null, allowNumber: true, phrase: raw || null };
}

/**
 * Count IELTS-style "words" in an answer (numbers count as one unit).
 * @param {string} text
 */
function countAnswerWords(text) {
  const t = String(text ?? "").trim();
  if (!t) return 0;
  // Currency symbols alone don't add a word; "£30" = one unit
  const cleaned = t
    .replace(/[£$€]/g, "")
    .replace(/,/g, "")
    .trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).filter(Boolean).length;
}

/**
 * @param {string} student
 * @param {{ maxWords: number|null, allowNumber: boolean }} limit
 */
function violatesWordLimit(student, limit) {
  if (!limit.maxWords) return false;
  const words = countAnswerWords(student);
  if (words > limit.maxWords) return true;
  // ONE WORD ONLY (no number allowance): digits are not permitted
  if (!limit.allowNumber && /\d/.test(String(student))) return true;
  return false;
}

/**
 * Prefer human-readable primary answer (first slash alt, strip optional parens lightly).
 * @param {string} key
 */
function displayCorrectAnswer(key) {
  const variants = expandOfficialAnswerKey(key);
  const primary = variants[0] || String(key ?? "").trim();
  return primary.replace(/\s+/g, " ").trim();
}

/**
 * Heuristic: close spelling of an accepted variant but wrong word.
 * @param {string} student
 * @param {string[]} accepted
 */
function looksLikeSpellingError(student, accepted) {
  const s = normalizeForMatch(student).replace(/\s/g, "");
  if (!s || s.length < 3) return false;
  for (const a of accepted) {
    const t = normalizeForMatch(a).replace(/\s/g, "");
    if (!t || Math.abs(t.length - s.length) > 2) continue;
    let diff = 0;
    const len = Math.max(t.length, s.length);
    for (let i = 0; i < len; i++) {
      if (t[i] !== s[i]) diff += 1;
    }
    if (diff > 0 && diff <= 2 && s !== t) return true;
  }
  return false;
}

/**
 * Pull a short transcript excerpt around the answer if possible.
 * @param {string} transcript
 * @param {string} correctKey
 */
function findTranscriptEvidence(transcript, correctKey) {
  const text = String(transcript ?? "");
  if (!text) return null;
  const variants = expandOfficialAnswerKey(correctKey);
  const lower = text.toLowerCase();
  for (const v of variants) {
    const needle = String(v).toLowerCase().trim();
    if (needle.length < 2) continue;
    const idx = lower.indexOf(needle);
    if (idx >= 0) {
      const start = Math.max(0, idx - 60);
      const end = Math.min(text.length, idx + needle.length + 80);
      let excerpt = text.slice(start, end).replace(/\s+/g, " ").trim();
      if (start > 0) excerpt = "…" + excerpt;
      if (end < text.length) excerpt = excerpt + "…";
      return excerpt;
    }
  }
  return null;
}

/**
 * Build IELTS-style coaching feedback for an incorrect answer.
 * @param {object} ctx
 */
function buildIncorrectFeedback(ctx) {
  const {
    category,
    studentAnswer,
    correctAnswer,
    wordLimit,
    explanation,
    transcriptEvidence,
    skillHint,
  } = ctx;

  const display = displayCorrectAnswer(correctAnswer);
  const tips = [];

  if (category === "blank") {
    return {
      whyIncorrect: "You left this question blank.",
      correctAnswer: display,
      explanation:
        explanation ||
        "In IELTS Listening, always write something — a guess can still score a mark.",
      coachingNote:
        "Train yourself to keep writing while the audio continues; never leave blanks on the answer sheet.",
      lossReason: "blank",
      skillTested: skillHint || "Attention and completion under time pressure",
      commonTrap: "Skipping a question and never returning to it.",
      studyTip: "If you miss an answer, move on immediately and use check time to guess.",
      transcriptEvidence,
    };
  }

  if (category === "word_limit") {
    const phrase = wordLimit?.phrase || "the word limit";
    return {
      whyIncorrect: `Your answer does not follow the instruction (${phrase}). You wrote ${countAnswerWords(studentAnswer)} word(s): "${studentAnswer}".`,
      correctAnswer: display,
      explanation:
        explanation ||
        `IELTS only awards the mark if your answer stays within ${phrase}. Extra words make the answer wrong even if the idea is right.`,
      coachingNote: `The instructions require ${phrase}, so your answer contains too many words.`,
      lossReason: "instruction",
      skillTested: skillHint || "Following question instructions precisely",
      commonTrap: "Copying a longer phrase from the recording instead of the exact gap length.",
      studyTip: "Underline the word-limit line before the audio starts.",
      transcriptEvidence,
    };
  }

  if (category === "spelling") {
    return {
      whyIncorrect: `Your spelling is close but creates a different form. You wrote "${studentAnswer}".`,
      correctAnswer: display,
      explanation:
        explanation ||
        "IELTS Listening marks spelling carefully. A small change can produce a different word and lose the mark.",
      coachingNote:
        "Minor accepted variants (e.g. metres/meters) are OK; inventing a different word is not.",
      lossReason: "spelling",
      skillTested: skillHint || "Accurate spelling of heard words",
      commonTrap: "Writing what you think you heard without checking letter-by-letter spellings.",
      studyTip: "For names and unusual nouns, listen for letter spelling in Section 1.",
      transcriptEvidence,
    };
  }

  if (category === "either_order") {
    return {
      whyIncorrect: `For Choose TWO/THREE questions, both letters must be correct (order does not matter). You wrote "${studentAnswer}".`,
      correctAnswer: display,
      explanation:
        explanation ||
        "Official keys mark answers 'in either order'. You need the full correct set of letters.",
      coachingNote: "Check that you transferred both letters and did not repeat the same option.",
      lossReason: "content",
      skillTested: skillHint || "Multiple matching / choose-two accuracy",
      commonTrap: "Selecting one correct option and one distractor.",
      studyTip: "Eliminate options the speaker rules out before choosing.",
      transcriptEvidence,
    };
  }

  tips.push(
    "Be careful: speakers often mention a wrong detail first, then correct themselves."
  );

  return {
    whyIncorrect: `Your answer "${studentAnswer || "—"}" does not match the accepted answer(s).`,
    correctAnswer: display,
    explanation:
      explanation ||
      `The correct answer is "${display}". Listen for the exact detail the question asks for — not the first number or place you hear.`,
    coachingNote:
      "You may have selected a distractor, information from the wrong speaker, or an earlier detail that was later corrected.",
    lossReason: "misunderstanding",
    skillTested:
      skillHint ||
      "Detail recognition, synonym matching, and ignoring distractors",
    commonTrap:
      "Selecting the first number/date you hear when the speaker later corrects it.",
    studyTip:
      "When you hear 'sorry', 'actually', or 'I mean', expect the tested answer to follow.",
    transcriptEvidence,
  };
}

/**
 * Validate one listening answer with official-style flexibility + feedback.
 *
 * @param {object} input
 * @param {string} input.studentAnswer
 * @param {string} input.correctAnswer — may use /, (), official notation
 * @param {string|number} [input.wordLimit]
 * @param {string} [input.explanation]
 * @param {string} [input.transcript]
 * @param {string} [input.questionText]
 * @param {string} [input.questionType]
 * @param {string} [input.skillHint]
 * @returns {object}
 */
function validateListeningAnswer(input) {
  const studentAnswer = String(input?.studentAnswer ?? "").trim();
  const correctAnswer = String(input?.correctAnswer ?? "").trim();
  const wordLimit = parseWordLimit(input?.wordLimit);
  const acceptedVariants = expandOfficialAnswerKey(correctAnswer);
  const transcriptEvidence = findTranscriptEvidence(
    input?.transcript,
    correctAnswer
  );

  const baseMeta = {
    studentAnswer,
    correctAnswer: displayCorrectAnswer(correctAnswer),
    acceptedVariants,
    wordLimit,
    transcriptEvidence,
    explanation: input?.explanation ? String(input.explanation) : null,
    questionType: input?.questionType ?? null,
  };

  if (!correctAnswer && !studentAnswer) {
    return {
      ...baseMeta,
      correct: true,
      category: /** @type {FeedbackCategory} */ ("correct"),
      feedback: null,
    };
  }

  if (!studentAnswer) {
    const feedback = buildIncorrectFeedback({
      category: "blank",
      studentAnswer,
      correctAnswer,
      wordLimit,
      explanation: input?.explanation,
      transcriptEvidence,
      skillHint: input?.skillHint,
    });
    return {
      ...baseMeta,
      correct: false,
      category: /** @type {FeedbackCategory} */ ("blank"),
      feedback,
    };
  }

  // Letter answers (map / MCQ / matching)
  if (/^[A-J](?:\s*[,/&]\s*[A-J])*$/i.test(correctAnswer)) {
    const ok =
      matchesOfficialListeningAnswer(studentAnswer, correctAnswer) ||
      matchesEitherOrderLetters(studentAnswer, correctAnswer);
    if (ok) {
      return {
        ...baseMeta,
        correct: true,
        category: /** @type {FeedbackCategory} */ ("correct"),
        feedback: null,
      };
    }
    const feedback = buildIncorrectFeedback({
      category: /[,/&]/.test(correctAnswer) ? "either_order" : "content",
      studentAnswer,
      correctAnswer,
      wordLimit,
      explanation: input?.explanation,
      transcriptEvidence,
      skillHint: input?.skillHint,
    });
    return {
      ...baseMeta,
      correct: false,
      category: feedback.lossReason === "content" && /[,/&]/.test(correctAnswer)
        ? "either_order"
        : "content",
      feedback,
    };
  }

  const contentMatches = matchesOfficialListeningAnswer(
    studentAnswer,
    correctAnswer
  );

  if (contentMatches && violatesWordLimit(studentAnswer, wordLimit)) {
    const feedback = buildIncorrectFeedback({
      category: "word_limit",
      studentAnswer,
      correctAnswer,
      wordLimit,
      explanation: input?.explanation,
      transcriptEvidence,
      skillHint: input?.skillHint,
    });
    return {
      ...baseMeta,
      correct: false,
      category: /** @type {FeedbackCategory} */ ("word_limit"),
      feedback,
    };
  }

  if (contentMatches) {
    return {
      ...baseMeta,
      correct: true,
      category: /** @type {FeedbackCategory} */ ("correct"),
      feedback: null,
    };
  }

  // Word limit fail even when content wrong — mention if obviously over limit
  if (violatesWordLimit(studentAnswer, wordLimit)) {
    const feedback = buildIncorrectFeedback({
      category: "word_limit",
      studentAnswer,
      correctAnswer,
      wordLimit,
      explanation: input?.explanation,
      transcriptEvidence,
      skillHint: input?.skillHint,
    });
    return {
      ...baseMeta,
      correct: false,
      category: /** @type {FeedbackCategory} */ ("word_limit"),
      feedback,
    };
  }

  if (looksLikeSpellingError(studentAnswer, acceptedVariants)) {
    const feedback = buildIncorrectFeedback({
      category: "spelling",
      studentAnswer,
      correctAnswer,
      wordLimit,
      explanation: input?.explanation,
      transcriptEvidence,
      skillHint: input?.skillHint,
    });
    return {
      ...baseMeta,
      correct: false,
      category: /** @type {FeedbackCategory} */ ("spelling"),
      feedback,
    };
  }

  const feedback = buildIncorrectFeedback({
    category: "content",
    studentAnswer,
    correctAnswer,
    wordLimit,
    explanation: input?.explanation,
    transcriptEvidence,
    skillHint: input?.skillHint,
  });

  return {
    ...baseMeta,
    correct: false,
    category: /** @type {FeedbackCategory} */ ("content"),
    feedback,
  };
}

/**
 * Score a list of answers with optional per-question metadata.
 *
 * @param {string[]} studentList
 * @param {string[]} correctList
 * @param {Array<object>} [metaList]
 */
function scoreListeningAnswersWithFeedback(
  studentList,
  correctList,
  metaList = []
) {
  const total = correctList.length;
  const results = [];
  const wrongIndexes = [];
  let score = 0;

  // Either-order groups: meta.eitherOrderGroup
  const groupMap = new Map();
  for (let i = 0; i < total; i++) {
    const g = metaList[i]?.eitherOrderGroup;
    if (!g) continue;
    const list = groupMap.get(g) ?? [];
    list.push(i);
    groupMap.set(g, list);
  }

  const handled = new Set();

  for (const [, indexes] of groupMap) {
    const flags = scoreEitherOrderGroup(
      indexes.map((i) => String(studentList[i] ?? "")),
      indexes.map((i) => String(correctList[i] ?? ""))
    );
    indexes.forEach((i, j) => {
      handled.add(i);
      const meta = metaList[i] ?? {};
      const studentAnswer = String(studentList[i] ?? "").trim();
      const correctAnswer = String(correctList[i] ?? "").trim();
      const ok = Boolean(flags[j]);
      if (ok) score += 1;
      else wrongIndexes.push(i);

      if (ok) {
        results[i] = {
          correct: true,
          studentAnswer,
          correctAnswer: displayCorrectAnswer(correctAnswer),
          category: "correct",
          acceptedVariants: expandOfficialAnswerKey(correctAnswer),
          feedback: null,
        };
      } else {
        const validated = validateListeningAnswer({
          studentAnswer,
          correctAnswer: indexes.map((idx) => correctList[idx]).join(","),
          wordLimit: meta.wordLimit,
          explanation: meta.explanation,
          transcript: meta.transcript,
          questionType: meta.questionType,
          skillHint: meta.skillHint,
        });
        // Force either-order messaging for group failures
        const fb =
          validated.feedback ||
          buildIncorrectFeedback({
            category: "either_order",
            studentAnswer,
            correctAnswer,
            wordLimit: parseWordLimit(meta.wordLimit),
            explanation: meta.explanation,
            transcriptEvidence: findTranscriptEvidence(
              meta.transcript,
              correctAnswer
            ),
            skillHint: meta.skillHint,
          });
        results[i] = {
          correct: false,
          studentAnswer,
          correctAnswer: displayCorrectAnswer(correctAnswer),
          category: "either_order",
          acceptedVariants: expandOfficialAnswerKey(correctAnswer),
          feedback: { ...fb, correctAnswer: displayCorrectAnswer(correctAnswer) },
        };
      }
    });
  }

  for (let i = 0; i < total; i++) {
    if (handled.has(i)) continue;
    const meta = metaList[i] ?? {};
    const validated = validateListeningAnswer({
      studentAnswer: studentList[i],
      correctAnswer: correctList[i],
      wordLimit: meta.wordLimit,
      explanation: meta.explanation,
      transcript: meta.transcript,
      questionText: meta.questionText,
      questionType: meta.questionType,
      skillHint: meta.skillHint,
    });

    if (validated.correct) score += 1;
    else wrongIndexes.push(i);

    results[i] = {
      correct: validated.correct,
      studentAnswer: validated.studentAnswer,
      correctAnswer: validated.correctAnswer,
      category: validated.category,
      acceptedVariants: validated.acceptedVariants,
      feedback: validated.feedback,
    };
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

module.exports = {
  parseWordLimit,
  countAnswerWords,
  displayCorrectAnswer,
  validateListeningAnswer,
  scoreListeningAnswersWithFeedback,
  findTranscriptEvidence,
  // re-export helpers for callers
  expandOfficialAnswerKey,
  matchesOfficialListeningAnswer,
  scoreEitherOrderGroup,
  normalizeForMatch,
  numberToWords,
  wordsToNumber,
};
