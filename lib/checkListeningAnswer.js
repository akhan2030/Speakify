/**
 * Flexible matching for IELTS listening answers — thin wrapper over the central engine.
 */

const {
  validateListeningAnswer,
  normalizeForMatch,
} = require("./listeningAnswerEngine.js");

function normalizeListeningAnswer(str) {
  return normalizeForMatch(str);
}

/**
 * Boolean matcher used across scoring paths.
 * Prefer validateListeningAnswer() when feedback is needed.
 */
function checkListeningAnswer(studentAnswer, correctAnswer, options = {}) {
  const result = validateListeningAnswer({
    studentAnswer,
    correctAnswer,
    wordLimit: options.wordLimit,
    explanation: options.explanation,
    transcript: options.transcript,
    questionType: options.questionType,
  });
  return result.correct;
}

module.exports = {
  checkListeningAnswer,
  normalizeListeningAnswer,
  validateListeningAnswer,
};
