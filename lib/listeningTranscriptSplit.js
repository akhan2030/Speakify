/**
 * Split transcripts for multi-part / multi-group IELTS listening playback.
 */

/**
 * @param {string} text
 */
function normalizeForMatch(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * @param {string} transcript
 * @param {string} answer
 */
export function findAnswerEndIndex(transcript, answer) {
  const raw = String(answer ?? "").trim();
  if (!raw || !transcript) return -1;

  const lowerTranscript = transcript.toLowerCase();
  const lowerAnswer = raw.toLowerCase();

  let idx = lowerTranscript.indexOf(lowerAnswer);
  if (idx < 0) {
    const normAnswer = normalizeForMatch(raw);
    if (normAnswer.length < 2) return -1;
    const words = normAnswer.split(" ").filter(Boolean);
    if (words.length === 0) return -1;
    const pattern = words
      .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("\\s+");
    const re = new RegExp(pattern, "i");
    const match = re.exec(transcript);
    if (!match) return -1;
    idx = match.index;
    const endIdx = idx + match[0].length;
    const after = transcript.slice(endIdx);
    const lineBreak = after.indexOf("\n");
    if (lineBreak >= 0 && lineBreak < 120) {
      return endIdx + lineBreak;
    }
    const sentenceEnd = after.search(/[.!?]\s/);
    if (sentenceEnd >= 0 && sentenceEnd < 80) {
      return endIdx + sentenceEnd + 1;
    }
    return endIdx;
  }

  const endIdx = idx + lowerAnswer.length;
  const after = transcript.slice(endIdx);
  const lineBreak = after.indexOf("\n");
  if (lineBreak >= 0 && lineBreak < 120) {
    return endIdx + lineBreak;
  }
  const sentenceEnd = after.search(/[.!?]\s/);
  if (sentenceEnd >= 0 && sentenceEnd < 80) {
    return endIdx + sentenceEnd + 1;
  }
  return endIdx;
}

/**
 * @param {string} transcript
 * @param {Array<{ answer?: string }>} questions — sorted by questionNumber
 * @param {number} splitAfterLocalIndex — 1-based index in questions array (5 = after 5th question)
 */
export function splitTranscriptAtQuestionIndex(
  transcript,
  questions,
  splitAfterLocalIndex = 5
) {
  const full = String(transcript ?? "").trim();
  if (!full) return { part1: "", part2: "" };

  const breakMarker = /\[SECTION BREAK\]/i;
  if (breakMarker.test(full)) {
    const parts = full.split(breakMarker).map((p) => p.trim());
    return {
      part1: parts[0] ?? "",
      part2: parts.slice(1).join("\n\n").trim(),
    };
  }

  const sorted = [...questions].sort(
    (a, b) => (a.questionNumber ?? 0) - (b.questionNumber ?? 0)
  );
  const anchor = sorted[splitAfterLocalIndex - 1];
  if (!anchor?.answer) {
    const mid = Math.floor(full.length * 0.52);
    const breakAt = full.indexOf("\n", mid);
    const split = breakAt > 0 ? breakAt : mid;
    return {
      part1: full.slice(0, split).trim(),
      part2: full.slice(split).trim(),
    };
  }

  const splitIndex = findAnswerEndIndex(full, anchor.answer);
  if (splitIndex < 0 || splitIndex >= full.length - 20) {
    const mid = Math.floor(full.length * 0.52);
    const breakAt = full.indexOf("\n", mid);
    const split = breakAt > 0 ? breakAt : mid;
    return {
      part1: full.slice(0, split).trim(),
      part2: full.slice(split).trim(),
    };
  }

  let part1 = full.slice(0, splitIndex).trim();
  let part2 = full.slice(splitIndex).trim();

  if (
    part2 &&
    !/^(Speaker|Tutor|Student|Guide|Lecturer|Question)/im.test(part2)
  ) {
    const lineStart = part2.indexOf("\n");
    if (lineStart > 0) {
      part1 = `${part1}\n${part2.slice(0, lineStart)}`.trim();
      part2 = part2.slice(lineStart).trim();
    }
  }

  return { part1, part2 };
}

/** @deprecated Use splitTranscriptAtQuestionIndex */
export function splitTranscriptAtQuestion(
  transcript,
  questions,
  splitAfterQuestion = 5
) {
  return splitTranscriptAtQuestionIndex(transcript, questions, splitAfterQuestion);
}

/**
 * Slice transcript for one question-type group (by last question in group).
 * @param {string} transcript
 * @param {Array<{ questions: Array<{ answer?: string }>, start: number, end: number }>} groups
 * @param {number} groupIndex
 */
export function getTranscriptForGroupIndex(transcript, groups, groupIndex) {
  const full = String(transcript ?? "").trim();
  if (!full || !groups?.length) return full;

  const idx = Math.max(0, Math.min(groupIndex, groups.length - 1));
  const group = groups[idx];
  if (!group?.questions?.length) return full;

  let startIdx = 0;
  if (idx > 0) {
    const prev = groups[idx - 1];
    const prevLast = prev.questions[prev.questions.length - 1];
    const prevEnd = findAnswerEndIndex(full, prevLast?.answer ?? "");
    if (prevEnd > 0) startIdx = prevEnd;
  }

  const lastQ = group.questions[group.questions.length - 1];
  let endIdx = full.length;
  if (idx < groups.length - 1 && lastQ?.answer) {
    const found = findAnswerEndIndex(full, lastQ.answer);
    if (found > startIdx) endIdx = found;
  }

  const slice = full.slice(startIdx, endIdx).trim();
  return slice || full;
}

/**
 * Legacy part1/part2 from first group boundary (5 questions) or [SECTION BREAK].
 * @param {string} transcript
 * @param {Array<{ answer?: string, questionNumber?: number }>} questions
 * @param {string} audioPart — part1 | part2 | g0 | g1 | full
 * @param {Array<object>} [groups]
 */
export function resolveTranscriptAudioSlice(
  transcript,
  questions,
  audioPart,
  groups = []
) {
  const part = String(audioPart ?? "full").toLowerCase();

  if (part === "full") {
    return String(transcript ?? "").trim();
  }

  const groupMatch = part.match(/^g(\d+)$/);
  if (groupMatch && groups.length > 0) {
    const groupIndex = Number(groupMatch[1]);
    return getTranscriptForGroupIndex(transcript, groups, groupIndex);
  }

  if (part === "part1" || part === "part2") {
    const sorted = [...questions].sort(
      (a, b) => (a.questionNumber ?? 0) - (b.questionNumber ?? 0)
    );
    const mid = Math.ceil(sorted.length / 2);
    const { part1, part2 } = splitTranscriptAtQuestionIndex(
      transcript,
      sorted,
      mid
    );
    return part === "part1" ? part1 : part2;
  }

  return String(transcript ?? "").trim();
}

export function sectionUsesMultiGroupAudio(sectionNumber) {
  return sectionNumber >= 1 && sectionNumber <= 3;
}
