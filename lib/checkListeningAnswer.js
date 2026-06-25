/**
 * Flexible matching for IELTS listening form-completion answers.
 */

function normalizeListeningAnswer(str) {
  return String(str ?? "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s@.]/g, "");
}

function checkListeningAnswer(studentAnswer, correctAnswer) {
  const student = normalizeListeningAnswer(studentAnswer);
  const correct = normalizeListeningAnswer(correctAnswer);

  if (!student && !correct) return true;
  if (!student || !correct) return false;

  if (student === correct) return true;

  if (student.replace(/\s/g, "") === correct.replace(/\s/g, "")) return true;

  if (student.includes(correct)) return true;

  if (correct.includes(student)) return true;

  return false;
}

module.exports = { checkListeningAnswer, normalizeListeningAnswer };
