/**
 * Build per-question metadata for the central listening answer engine.
 * Keys must align with correctAnswers / answers maps used at submit time.
 */

/**
 * @param {Array<object>} questions
 * @param {{
 *   transcript?: string;
 *   sectionWordLimit?: string;
 *   answerKey?: 'id' | 'questionNumber';
 * }} [options]
 */
function buildListeningQuestionMeta(questions, options = {}) {
  const list = Array.isArray(questions) ? questions : [];
  const answerKey = options.answerKey ?? "questionNumber";

  return list.map((q) => {
    const questionNumber = Number(q.questionNumber ?? q.id ?? 0);
    const id = q.id ?? questionNumber;
    return {
      // Both keys help submit route align meta with sorted answer maps
      questionNumber,
      id,
      // Primary lookup key mirror (submit uses correctAnswers keys)
      ...(answerKey === "id" ? { id } : { questionNumber }),
      wordLimit: q.wordLimit || options.sectionWordLimit || undefined,
      explanation: q.explanation ? String(q.explanation) : undefined,
      transcript: options.transcript ? String(options.transcript) : undefined,
      questionText: q.text ? String(q.text) : undefined,
      questionType: q.type ? String(q.type) : undefined,
      eitherOrderGroup: q.eitherOrderGroup
        ? String(q.eitherOrderGroup)
        : undefined,
      skillHint: q.skillHint ? String(q.skillHint) : undefined,
    };
  });
}

/**
 * Build meta for a full mock (multiple sections with separate transcripts).
 * @param {Array<{ section: number, transcript?: string, wordLimit?: string, questions: object[] }>} sections
 */
function buildMockListeningQuestionMeta(sections) {
  const meta = [];
  for (const section of sections) {
    const qs = Array.isArray(section?.questions) ? section.questions : [];
    for (const row of buildListeningQuestionMeta(qs, {
      transcript: section.transcript,
      sectionWordLimit: section.wordLimit,
      answerKey: "questionNumber",
    })) {
      meta.push(row);
    }
  }
  return meta;
}

module.exports = {
  buildListeningQuestionMeta,
  buildMockListeningQuestionMeta,
};
