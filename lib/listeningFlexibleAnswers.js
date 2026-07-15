/**
 * Expand official IELTS Listening answer-key notation into matchable variants.
 * Supports: slashes, parentheses, affixes, currency, units, compound numbers,
 * multi-letter answers (either order).
 */

const ONES = {
  0: "zero",
  1: "one",
  2: "two",
  3: "three",
  4: "four",
  5: "five",
  6: "six",
  7: "seven",
  8: "eight",
  9: "nine",
  10: "ten",
  11: "eleven",
  12: "twelve",
  13: "thirteen",
  14: "fourteen",
  15: "fifteen",
  16: "sixteen",
  17: "seventeen",
  18: "eighteen",
  19: "nineteen",
};

const TENS = {
  20: "twenty",
  30: "thirty",
  40: "forty",
  50: "fifty",
  60: "sixty",
  70: "seventy",
  80: "eighty",
  90: "ninety",
};

const UNIT_ALIASES = [
  ["metres", "metre", "meters", "meter", "m"],
  ["centimetres", "centimetre", "centimeters", "centimeter", "cm"],
  ["kilometres", "kilometre", "kilometers", "kilometer", "km"],
  ["pounds", "pound", "£"],
  ["dollars", "dollar", "$"],
  ["hours", "hour", "hrs", "hr"],
  ["minutes", "minute", "mins", "min"],
  ["am", "a.m."],
  ["pm", "p.m."],
];

function numberToWords(n) {
  if (!Number.isFinite(n) || n < 0 || n > 999) return null;
  if (n < 20) return ONES[n];
  if (n < 100) {
    const ten = Math.floor(n / 10) * 10;
    const one = n % 10;
    return one ? `${TENS[ten]}-${ONES[one]}` : TENS[ten];
  }
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  const head = `${ONES[hundreds]} hundred`;
  if (!rest) return head;
  return `${head} ${numberToWords(rest)}`;
}

function wordsToNumber(text) {
  const t = String(text ?? "")
    .toLowerCase()
    .trim()
    .replace(/-/g, " ")
    .replace(/\s+/g, " ");
  if (!t) return null;
  if (/^\d+$/.test(t)) return Number(t);

  const compact = t.replace(/\s/g, "");
  for (let n = 0; n <= 100; n++) {
    const w = numberToWords(n);
    if (!w) continue;
    if (w.replace(/[-\s]/g, "") === compact) return n;
  }
  return null;
}

function splitTopLevelSlashes(text) {
  const parts = [];
  let current = "";
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "(") depth++;
    else if (c === ")") depth = Math.max(0, depth - 1);
    if (c === "/" && depth === 0) {
      if (current.trim()) parts.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts.length ? parts : [text.trim()];
}

function normalizeForMatch(text) {
  return String(text ?? "")
    .toLowerCase()
    .trim()
    .replace(/£/g, " pounds ")
    .replace(/\$/g, " dollars ")
    .replace(/\s+/g, " ")
    .replace(/[.,;:!?'"]/g, "");
}

function stripLeadingArticle(text) {
  return text.replace(/^(the|a|an)\s+/, "");
}

function addUnitVariants(set, text) {
  const norm = normalizeForMatch(text);
  if (!norm) return;
  set.add(norm);

  for (const group of UNIT_ALIASES) {
    for (const alias of group) {
      const re = new RegExp(`\\b${alias.replace(".", "\\.")}\\b`, "gi");
      if (!re.test(norm) && !norm.includes(alias)) continue;
      for (const other of group) {
        const swapped = norm
          .replace(new RegExp(`\\b${alias.replace(".", "\\.")}\\b`, "gi"), other)
          .replace(/\s+/g, " ")
          .trim();
        set.add(swapped);
        set.add(swapped.replace(/\s/g, ""));
      }
    }
  }
}

function addNumberWordVariants(set, text) {
  const norm = normalizeForMatch(text);
  if (!norm) return;
  set.add(norm);
  set.add(stripLeadingArticle(norm));

  const asNum = wordsToNumber(norm);
  if (asNum != null) {
    set.add(String(asNum));
    const w = numberToWords(asNum);
    if (w) {
      set.add(w);
      set.add(w.replace(/-/g, " "));
      set.add(w.replace(/[-\s]/g, ""));
    }
  }

  const numMatch = norm.match(/^(\d+)(?:\s*(.*))?$/);
  if (numMatch) {
    const n = Number(numMatch[1]);
    const rest = (numMatch[2] ?? "").trim();
    const w = numberToWords(n);
    if (w) {
      set.add(rest ? `${w} ${rest}` : w);
      set.add(rest ? `${w.replace(/-/g, " ")} ${rest}` : w.replace(/-/g, " "));
      set.add((rest ? `${w} ${rest}` : w).replace(/[-\s]/g, ""));
    }
  }

  const ordinal = norm.match(/^(\d+)(st|nd|rd|th)$/);
  if (ordinal) {
    const n = Number(ordinal[1]);
    const w = numberToWords(n);
    if (w) {
      set.add(`${w.replace(/[-\s]/g, "")}${ordinal[2]}`);
      set.add(`${n}${ordinal[2]}`);
    }
  }
}

function expandParentheticalGroups(text) {
  let variants = [text.trim()];
  let guard = 0;

  while (guard < 24) {
    guard += 1;
    let expanded = false;
    const next = [];

    for (const variant of variants) {
      const match = variant.match(/\(([^()]+)\)/);
      if (!match) {
        next.push(variant);
        continue;
      }

      expanded = true;
      const inner = match[1];
      const before = variant.slice(0, match.index);
      const after = variant.slice(match.index + match[0].length);

      const without = `${before}${after}`.replace(/\s+/g, " ").trim();
      next.push(without);

      for (const alt of inner.split("/")) {
        const part = alt.trim();
        if (!part) continue;

        const stemMatch = before.match(/(\w+)$/);
        if (stemMatch && !/\s/.test(part)) {
          const stem = stemMatch[1];
          next.push(`${before}${part}${after}`.replace(/\s+/g, " ").trim());
          next.push(
            `${before.slice(0, -stem.length)}${stem}${part}${after}`
              .replace(/\s+/g, " ")
              .trim()
          );
        } else {
          next.push(`${before}${part}${after}`.replace(/\s+/g, " ").trim());
        }
      }
    }

    variants = [...new Set(next)];
    if (!expanded) break;
    if (variants.length > 128) break;
  }

  return variants;
}

/**
 * @param {string} key
 * @returns {string[]}
 */
function expandOfficialAnswerKey(key) {
  const trimmed = String(key ?? "").trim();
  if (!trimmed) return [""];

  if (/^[A-J]$/i.test(trimmed)) {
    return [trimmed.toUpperCase()];
  }

  // Multi-letter either-order keys: "D,E" or "D/E" handled by set matcher
  if (/^[A-J](?:\s*[,/&]\s*[A-J])+$/i.test(trimmed)) {
    return [trimmed.toUpperCase().replace(/\s+/g, "")];
  }

  let variants = splitTopLevelSlashes(trimmed);
  const expanded = [];
  for (const segment of variants) {
    expanded.push(...expandParentheticalGroups(segment));
  }
  return [...new Set(expanded.length ? expanded : [trimmed])];
}

function addNormalizedVariants(set, text) {
  addNumberWordVariants(set, text);
  addUnitVariants(set, text);
  const norm = normalizeForMatch(text);
  if (!norm) return;

  set.add(norm.replace(/\s/g, ""));
  set.add(norm.replace(/\./g, ":"));
  set.add(norm.replace(/:/g, "."));
  set.add(stripLeadingArticle(norm));
  set.add(stripLeadingArticle(norm).replace(/\s/g, ""));

  // currency phrasing: "30 pounds" ↔ "pounds 30" ↔ "£30"
  const money = norm.match(/^(\d+(?:\.\d+)?)\s*(pounds?|dollars?)$/);
  if (money) {
    set.add(`${money[2]} ${money[1]}`);
    set.add(`${money[1]}${money[2]}`);
  }
  const money2 = norm.match(/^(pounds?|dollars?)\s*(\d+(?:\.\d+)?)$/);
  if (money2) {
    set.add(`${money2[2]} ${money2[1]}`);
  }
}

function parseLetterSet(value) {
  return new Set(
    String(value ?? "")
      .toUpperCase()
      .split(/[,;/&\s]+/)
      .map((p) => p.trim())
      .filter((p) => /^[A-J]$/.test(p))
  );
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

/**
 * Match multi-letter answers in either order (e.g. D,E ↔ E,D).
 * @param {string} studentAnswer
 * @param {string} correctKey
 */
function matchesEitherOrderLetters(studentAnswer, correctKey) {
  const studentSet = parseLetterSet(studentAnswer);
  const correctSet = parseLetterSet(correctKey);
  if (studentSet.size < 2 || correctSet.size < 2) return false;
  return setsEqual(studentSet, correctSet);
}

/**
 * Score an either-order pair/group of questions (official "in either order").
 * @param {string[]} studentAnswers
 * @param {string[]} correctLetters
 */
function scoreEitherOrderGroup(studentAnswers, correctLetters) {
  const studentSet = new Set();
  for (const a of studentAnswers) {
    const letter = String(a ?? "")
      .trim()
      .toUpperCase();
    if (/^[A-J]$/.test(letter)) studentSet.add(letter);
  }
  const correctSet = new Set(
    correctLetters.map((c) => String(c).trim().toUpperCase()).filter((c) => /^[A-J]$/.test(c))
  );
  if (!correctSet.size) return studentAnswers.map(() => false);

  // Full set match → all correct; otherwise mark individually if letter is in the set
  // and unique (official: both marks if set matches regardless of order)
  if (setsEqual(studentSet, correctSet) && studentSet.size === correctSet.size) {
    return studentAnswers.map(() => true);
  }

  const used = new Set();
  return studentAnswers.map((a) => {
    const letter = String(a ?? "")
      .trim()
      .toUpperCase();
    if (correctSet.has(letter) && !used.has(letter)) {
      used.add(letter);
      return true;
    }
    return false;
  });
}

/**
 * @param {string} studentAnswer
 * @param {string} correctKey
 * @returns {boolean}
 */
function matchesOfficialListeningAnswer(studentAnswer, correctKey) {
  const student = String(studentAnswer ?? "").trim();
  const key = String(correctKey ?? "").trim();

  if (!student && !key) return true;
  if (!student || !key) return false;

  if (/^[A-J]$/i.test(key) && /^[A-J]$/i.test(student)) {
    return key.toUpperCase() === student.toUpperCase();
  }

  if (matchesEitherOrderLetters(student, key)) return true;

  const acceptable = new Set();
  for (const variant of expandOfficialAnswerKey(key)) {
    addNormalizedVariants(acceptable, variant);
  }

  const studentVariants = new Set();
  addNormalizedVariants(studentVariants, student);

  for (const s of studentVariants) {
    if (acceptable.has(s)) return true;
  }

  for (const s of studentVariants) {
    for (const a of acceptable) {
      if (!s || !a) continue;
      if (s.length >= 2 && a.length >= 2 && (s.includes(a) || a.includes(s))) {
        return true;
      }
    }
  }

  return false;
}

module.exports = {
  expandOfficialAnswerKey,
  matchesOfficialListeningAnswer,
  matchesEitherOrderLetters,
  scoreEitherOrderGroup,
  normalizeForMatch,
  numberToWords,
  wordsToNumber,
};
