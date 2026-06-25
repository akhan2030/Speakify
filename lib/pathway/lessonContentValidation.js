/**
 * Detect template/placeholder lesson JSON that must not be shown or cached.
 */
export function isPlaceholderLessonContent(content, dayType) {
  if (!content || typeof content !== "object") return true;

  const vocab = content.vocabulary;
  if (Array.isArray(vocab) && vocab.length > 0) {
    const placeholderWords = vocab.filter(
      (v) =>
        /^word\d+$/i.test(String(v?.word ?? "")) ||
        /Definition for academic item/i.test(String(v?.definition ?? "")) ||
        /^term\d+$/i.test(String(v?.word ?? ""))
    );
    if (placeholderWords.length >= Math.min(3, vocab.length)) return true;
  }

  const passage = String(content.passage ?? "");
  if (/This [A-Z0-9.]+ reading passage demonstrates/i.test(passage)) {
    return true;
  }

  if (dayType === "practice") {
    const ge = content.grammarExercises;
    if (
      Array.isArray(ge) &&
      ge.some((ex) => /The student ___ completed the task/i.test(String(ex?.prompt ?? "")))
    ) {
      return true;
    }
  }

  if (dayType === "assessment") {
    const quiz = content.quiz;
    if (
      Array.isArray(quiz) &&
      quiz.some((q) => /weekly quiz question \d+/i.test(String(q?.question ?? "")))
    ) {
      return true;
    }
  }

  return false;
}
