/**
 * Split transcripts for multi-part / multi-group IELTS listening playback.
 */

const AMBIGUOUS_SHORT_ANSWERS = new Set([
  "a",
  "an",
  "the",
  "yes",
  "no",
  "ok",
  "oh",
  "am",
  "pm",
  "to",
  "of",
  "in",
  "on",
  "at",
  "or",
  "and",
]);

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
 * Find where an answer ends in the transcript for audio slicing.
 * Prefers later matches after `afterIndex` so early false positives
 * (e.g. "room" in "waiting room") do not truncate the recording.
 *
 * @param {string} transcript
 * @param {string} answer
 * @param {{ afterIndex?: number, preferLast?: boolean }} [opts]
 */
export function findAnswerEndIndex(transcript, answer, opts = {}) {
  const raw = String(answer ?? "").trim();
  const full = String(transcript ?? "");
  if (!raw || !full) return -1;

  const afterIndex = Math.max(0, Number(opts.afterIndex ?? 0) || 0);
  const preferLast = opts.preferLast !== false;
  const searchIn = full.slice(afterIndex);
  if (!searchIn) return -1;

  // Slash / optional keys — try longest variants first
  const variants = raw
    .split("/")
    .map((v) =>
      v
        .replace(/\([^)]*\)/g, "")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  const candidates = variants.length ? variants : [raw];
  /** @type {number[]} */
  const ends = [];

  for (const candidate of candidates) {
    if (candidate.length < 2) continue;
    const normCand = normalizeForMatch(candidate);
    if (
      normCand.length <= 3 &&
      AMBIGUOUS_SHORT_ANSWERS.has(normCand.replace(/\s/g, ""))
    ) {
      continue;
    }

    const lowerSearch = searchIn.toLowerCase();
    const lowerAnswer = candidate.toLowerCase();
    let from = 0;
    while (from < searchIn.length) {
      let idx = lowerSearch.indexOf(lowerAnswer, from);
      let matchLen = candidate.length;

      if (idx < 0) {
        const words = normCand.split(" ").filter(Boolean);
        if (words.length === 0) break;
        const pattern = words
          .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
          .join("\\s+");
        const re = new RegExp(pattern, "gi");
        re.lastIndex = from;
        const match = re.exec(searchIn);
        if (!match) break;
        idx = match.index;
        matchLen = match[0].length;
      }

      const absStart = afterIndex + idx;
      const endIdx = absStart + matchLen;
      const after = full.slice(endIdx);
      const lineBreak = after.indexOf("\n");
      let end = endIdx;
      if (lineBreak >= 0 && lineBreak < 120) {
        end = endIdx + lineBreak;
      } else {
        const sentenceEnd = after.search(/[.!?]\s/);
        if (sentenceEnd >= 0 && sentenceEnd < 80) {
          end = endIdx + sentenceEnd + 1;
        }
      }
      ends.push(end);
      from = idx + Math.max(1, matchLen);
      if (!preferLast) break;
    }
  }

  if (!ends.length) return -1;
  return preferLast ? Math.max(...ends) : ends[0];
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

  const splitIndex = findAnswerEndIndex(full, anchor.answer, {
    preferLast: true,
  });
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
    !/^(Speaker|Tutor|Student|Guide|Lecturer|Question|Caller|Coordinator)/im.test(
      part2
    )
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
  return splitTranscriptAtQuestionIndex(
    transcript,
    questions,
    splitAfterQuestion
  );
}

/**
 * Slice transcript for one question-type group.
 * Prefers [SECTION BREAK] markers so group audio is never truncated mid-dialogue.
 *
 * @param {string} transcript
 * @param {Array<{ questions: Array<{ answer?: string }>, start: number, end: number }>} groups
 * @param {number} groupIndex
 */
export function getTranscriptForGroupIndex(transcript, groups, groupIndex) {
  const full = String(transcript ?? "").trim();
  if (!full || !groups?.length) return full;

  const idx = Math.max(0, Math.min(groupIndex, groups.length - 1));
  const breakParts = full
    .split(/\[SECTION BREAK\]/i)
    .map((p) => p.trim())
    .filter(Boolean);

  // Official multi-block scripts: one PART per group
  if (breakParts.length >= groups.length) {
    return breakParts[idx] || full;
  }
  if (breakParts.length > 1 && idx < breakParts.length) {
    // Fewer breaks than groups — use available parts, concatenate remainder into last
    if (idx === groups.length - 1 && breakParts.length < groups.length) {
      return breakParts.slice(idx).join("\n\n").trim() || full;
    }
    return breakParts[idx] || full;
  }

  const group = groups[idx];
  if (!group?.questions?.length) return full;

  let startIdx = 0;
  if (idx > 0) {
    const prev = groups[idx - 1];
    const prevLast = prev.questions[prev.questions.length - 1];
    const prevEnd = findAnswerEndIndex(full, prevLast?.answer ?? "", {
      preferLast: true,
    });
    if (prevEnd > 0) startIdx = prevEnd;
  }

  const lastQ = group.questions[group.questions.length - 1];
  let endIdx = full.length;
  if (idx < groups.length - 1) {
    const found = lastQ?.answer
      ? findAnswerEndIndex(full, lastQ.answer, {
          afterIndex: startIdx,
          preferLast: true,
        })
      : -1;
    const minEnd =
      startIdx + Math.max(80, Math.floor((full.length - startIdx) * 0.15));
    if (found > minEnd) {
      endIdx = found;
    } else {
      // Answer-anchor failed — hard-split so g0 never includes later-group dialogue
      const midCount =
        groups[0].questions?.length ||
        Math.ceil(questionsLength(groups) / groups.length);
      const allQuestions = groups.flatMap((g) => g.questions ?? []);
      const { part1, part2 } = splitTranscriptAtQuestionIndex(
        full,
        allQuestions,
        midCount
      );
      if (idx === 0) return part1 || full;
      return part2 || full.slice(startIdx).trim() || full;
    }
  }

  const slice = full.slice(startIdx, endIdx).trim();
  const wordCount = slice.split(/\s+/).filter(Boolean).length;

  if (wordCount < 40 && groups.length > 1 && idx < groups.length - 1) {
    const midCount =
      groups[0].questions?.length ||
      Math.ceil(questionsLength(groups) / groups.length);
    const allQuestions = groups.flatMap((g) => g.questions ?? []);
    const { part1, part2 } = splitTranscriptAtQuestionIndex(
      full,
      allQuestions,
      midCount
    );
    if (idx === 0) return part1 || full;
    return part2 || full.slice(startIdx).trim() || full;
  }

  return slice || full;
}

function questionsLength(groups) {
  return groups.reduce((n, g) => n + (g.questions?.length ?? 0), 0);
}

/**
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

