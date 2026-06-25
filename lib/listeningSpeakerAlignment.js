/**
 * Align transcript speaker labels with gendered voices and canonical names.
 */

import {
  normalizeSpeakerKey,
  parseTranscriptIntoSegments,
} from "./listeningTranscriptParse.js";
import {
  getDefaultSpeakersForSection,
  inferGenderFromName,
} from "./listeningSpeakerProfiles.js";

const SPEAKER_LINE_RE =
  /^((?:Speaker\s+[A-Z]|Tutor|Student\s+[A-Z]|Student|Narrator|Guide|Lecturer|Question(?:er)?)):\s*(.*)$/i;

const INTRO_NAME_RE =
  /\b(?:i'?m|i am|my name is|my name's|this is|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi;

/**
 * @param {string} text
 * @returns {string[]}
 */
export function extractIntroducedNames(text) {
  const names = [];
  let match;
  const re = new RegExp(INTRO_NAME_RE.source, "gi");
  while ((match = re.exec(text)) !== null) {
    names.push(match[1].trim());
  }
  return names;
}

/**
 * Infer likely gender from what this speaker says (self-intro, honorifics).
 * @param {string} text
 * @returns {'male'|'female'|null}
 */
export function inferGenderFromSpeakerText(text) {
  const names = extractIntroducedNames(text);
  const genders = names.map((n) => inferGenderFromName(n)).filter(Boolean);

  if (genders.length > 0) {
    const female = genders.filter((g) => g === "female").length;
    const male = genders.filter((g) => g === "male").length;
    if (female > male) return "female";
    if (male > female) return "male";
    if (genders[0]) return genders[0];
  }

  if (/\b(sir|mr\.?|mister)\b/i.test(text)) return "male";
  if (/\b(madam|ms\.?|mrs\.?|miss)\b/i.test(text)) return "female";
  return null;
}

/**
 * @param {string} transcript
 * @param {string} labelA
 * @param {string} labelB
 */
function swapLabelsInTranscript(transcript, labelA, labelB) {
  const placeholder = "__SPEAKER_SWAP_TMP__";
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const aRe = new RegExp(`^(${esc(labelA)}):`, "gim");
  const bRe = new RegExp(`^(${esc(labelB)}):`, "gim");
  const tmpRe = new RegExp(`^${esc(placeholder)}:`, "gim");

  return String(transcript ?? "")
    .replace(aRe, `${placeholder}:`)
    .replace(bRe, `${labelA}:`)
    .replace(tmpRe, `${labelB}:`);
}

/**
 * When the model swaps labels (e.g. male dialogue under "Speaker B" with a female name),
 * swap labels so voice + display name match the spoken role.
 * @param {string} transcript
 * @param {number} sectionNumber
 */
export function alignTranscriptSpeakerLabels(
  transcript,
  sectionNumber,
  speakers
) {
  const section = Number(sectionNumber);
  const profiles =
    speakers?.length > 0
      ? speakers
      : getDefaultSpeakersForSection(section);
  if (profiles.length < 2 || !String(transcript ?? "").trim()) {
    return transcript;
  }

  const segments = parseTranscriptIntoSegments(transcript, section);
  /** @type {Map<string, string>} */
  const textByLabel = new Map();

  for (const seg of segments) {
    if (seg.type !== "speech" || !seg.speaker) continue;
    const key = normalizeSpeakerKey(seg.speaker);
    textByLabel.set(key, `${textByLabel.get(key) ?? ""} ${seg.text ?? ""}`);
  }

  const inferences = profiles.map((p) => {
    const blob = textByLabel.get(p.label) ?? "";
    return {
      label: p.label,
      expected: p.gender,
      inferred: inferGenderFromSpeakerText(blob) ?? p.gender,
    };
  });

  if (section === 1) {
    const a = inferences.find((i) => i.label === "Speaker A");
    const b = inferences.find((i) => i.label === "Speaker B");
    if (
      a &&
      b &&
      a.inferred &&
      b.inferred &&
      a.inferred !== a.expected &&
      b.inferred !== b.expected &&
      a.inferred === b.expected &&
      b.inferred === a.expected
    ) {
      return swapLabelsInTranscript(transcript, "Speaker A", "Speaker B");
    }
  }

  if (section === 3) {
    const studentA = inferences.find((i) => i.label === "Student A");
    const studentB = inferences.find((i) => i.label === "Student B");
    if (
      studentA &&
      studentB &&
      studentA.inferred === "male" &&
      studentB.inferred === "female" &&
      studentA.expected === "female" &&
      studentB.expected === "male"
    ) {
      return swapLabelsInTranscript(transcript, "Student A", "Student B");
    }
  }

  return transcript;
}

/**
 * Replace self-introductions and mismatched personal names so each label uses its canonical name.
 * @param {string} transcript
 * @param {number} sectionNumber
 */
export function sanitizeTranscriptCharacterNames(
  transcript,
  sectionNumber,
  speakers
) {
  const section = Number(sectionNumber);
  const profiles =
    speakers?.length > 0
      ? speakers
      : getDefaultSpeakersForSection(section);
  if (!String(transcript ?? "").trim() || profiles.length === 0) {
    return transcript;
  }

  const profileByLabel = new Map(
    profiles.map((p) => [p.label.toLowerCase(), p])
  );

  const lines = String(transcript).split(/\r?\n/);
  const out = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      out.push(line);
      continue;
    }

    const match = trimmed.match(SPEAKER_LINE_RE);
    if (!match) {
      out.push(line);
      continue;
    }

    const label = normalizeSpeakerKey(match[1]);
    const profile = profileByLabel.get(label.toLowerCase());
    if (!profile) {
      out.push(line);
      continue;
    }

    let text = match[2] ?? "";
    const introRe = new RegExp(INTRO_NAME_RE.source, "gi");
    text = text.replace(introRe, (full, name) => {
      const inferred = inferGenderFromName(name);
      if (!inferred || inferred !== profile.gender) {
        return full.replace(name, profile.name);
      }
      return full.replace(name, profile.name);
    });

    const femaleFirst =
      /\b(?:Sarah|Emma|Lisa|Sophie|Olivia|Emily|Maria|Anna|Jane|Helen|Amy|Kate|Lucy|Rachel|Laura|Nicole|Michelle|Jennifer|Jessica|Ashley|Amanda|Melissa|Rebecca|Caroline|Natalie|Zoe|Leah|Samantha|Chloe|Grace|Victoria|Diana|Abigail|Hannah|Julia|Marie|Julie|Karen|Sharon|Cynthia|Kathleen|Brenda|Pamela|Deborah|Shirley|Betty|Dorothy|Sandra|Donna|Carol|Ruth|Kimberly|Elizabeth|Susan|Margaret|Dorothy|Lisa|Nancy|Karen|Betty|Helen|Sandra|Donna|Carol|Ruth|Sharon|Michelle|Laura|Emily|Kimberly|Deborah|Jessica|Shirley|Cynthia|Angela|Melissa|Brenda|Amy|Anna|Rebecca|Virginia|Katherine|Christine|Samantha|Debra|Rachel|Carolyn|Janet|Catherine|Frances|Ann|Joyce|Diane|Alice|Julie|Heather|Teresa|Doris|Gloria|Cheryl|Mildred|Joan|Kelly|Judith|Rose|Janice|Kelly|Nicole|Judy|Christina|Kathy|Theresa|Beverly|Denise|Tammy|Irene|Jane|Lori|Marilyn|Andrea|Kathryn|Louise|Sara|Anne|Jacqueline|Wanda|Bonnie|Julia|Ruby|Lois|Tina|Paula|Eleanor|Elaine|Edna|Megan|Hazel|Crystal|Brittany|Danielle|Monica|Tracy|Dana|Stacy|April|Brenda|Claire|Gabriella|Jasmine|Brianna|Madison|Ellie|Aubrey|Zoey|Penelope|Layla|Eleanor|Violet|Aurora|Savannah|Audrey|Brooklyn|Bella|Skylar|Paisley|Everly|Allison|Valerie|Danielle|Brittany|Diana|Abigail|Jane|Lori|Tammy|Rose|Kathy|Alexis)\b/gi;
    const maleFirst =
      /\b(?:David|James|Michael|Robert|Tom|John|William|Richard|Joseph|Charles|Daniel|Matthew|Anthony|Mark|Donald|Steven|Paul|Andrew|Joshua|Kenneth|Kevin|Brian|George|Timothy|Ronald|Edward|Jason|Jeffrey|Ryan|Jacob|Gary|Nicholas|Eric|Jonathan|Stephen|Larry|Justin|Scott|Brandon|Benjamin|Samuel|Raymond|Gregory|Frank|Alexander|Patrick|Jack|Dennis|Jerry|Tyler|Aaron|Jose|Adam|Nathan|Henry|Douglas|Zachary|Peter|Kyle|Noah|Ethan|Jeremy|Walter|Christian|Keith|Roger|Terry|Gerald|Harold|Sean|Austin|Carl|Arthur|Lawrence|Dylan|Jesse|Jordan|Bryan|Billy|Bruce|Albert|Willie|Gabriel|Logan|Alan|Juan|Wayne|Roy|Ralph|Randy|Eugene|Vincent|Russell|Louis|Philip|Bobby|Johnny|Mason|Liam|Oliver|Elijah|Lucas|Aiden|Jackson|Sebastian|Carter|Wyatt|Jayden|Owen|Luke|Isaac|Grayson|Julian|Levi|Christopher|Theodore|Caleb|Josiah|Hudson|Hunter|Eli|Isaiah|Connor|Jeremiah|Cameron|Adrian|Easton|Nolan|Ezra|Colton|Dominic|Cooper|Ian|Carson|Axel|Mateo|Bentley|Sawyer|Nathaniel|Ryder|Kingston|Rowan|Ashton|Roman|Waylon|Silas|Bennett|Weston|Kai|Damian|August|Zayden|Wesley|Emmanuel|Brady|Jameson|Maxwell|Amir|Ivan|Diego|Luis|Miguel|Carlos|Omar|Yusuf|Ali|Hassan|Ahmed|Mohammed|Abdul|Tariq|Khalid|Mustafa|Ibrahim|Karim|Samir|Naveed|Raj|Amit|Rahul|Vikram|Arjun|Rohan|Dev|Kiran|Sanjay|Rajesh|Suresh|Manoj|Vijay|Anil|Ravi|Deepak|Sandeep|Ashok|Mukesh|Harish|Gopal|Vinod|Prakash|Sunil|Mahesh|Dinesh|Naresh|Peter|Paul|Mark|Luke|Simon|Martin|Geoffrey|Nigel|Colin|Derek|Gordon|Neil|Barry|Terence|Clive|Graham|Trevor|Malcolm|Rodney|Stuart|Warren|Dean|Earl|Floyd|Glen|Harvey|Leon|Milton|Norman|Perry|Rex|Seth|Troy|Vernon|Wade|Zane|Mitchell|Harrison|Johnson|Wilson|Mitchell|Harrison|Thompson|Anderson|Taylor|Moore|Jackson|Martin|Lee|Perez|Thomson|White|Harris|Sanchez|Clark|Ramirez|Lewis|Robinson|Walker|Young|Allen|King|Wright|Scott|Torres|Nguyen|Hill|Flores|Green|Adams|Nelson|Baker|Hall|Rivera|Campbell|Mitchell|Carter|Roberts)\b/gi;

    if (profile.gender === "male") {
      text = text.replace(femaleFirst, profile.name);
      text = text.replace(
        /\b(?:Sarah|Emma|Lisa|Sophie|Olivia|Emily|Maria|Anna|Jane|Helen)\s+[A-Z][a-z]+\b/g,
        profile.name
      );
    } else if (profile.gender === "female") {
      text = text.replace(maleFirst, profile.name);
      text = text.replace(
        /\b(?:David|James|Michael|Robert|Tom|John|William|Daniel|Mark|Paul)\s+[A-Z][a-z]+\b/g,
        profile.name
      );
    }

    text = text.replace(
      new RegExp(
        `\\bI'm\\s+${profile.name.split(" ")[0]}\\b`,
        "gi"
      ),
      `I'm ${profile.name}`
    );

    out.push(`${label}: ${text}`);
  }

  return out.join("\n");
}

/**
 * Fix zero-based or local question ranges in transcript text (e.g. "Questions 0 to 4" → global range).
 * @param {string} transcript
 * @param {number} sectionNumber
 */
export function sanitizeTranscriptQuestionReferences(transcript, sectionNumber) {
  const section = Number(sectionNumber);
  if (!String(transcript ?? "").trim() || section < 1 || section > 4) {
    return transcript;
  }

  const globalStart = (section - 1) * 10 + 1;
  const block1End = globalStart + 4;
  const block2Start = globalStart + 5;
  const globalEnd = section * 10;

  let text = String(transcript);

  text = text.replace(
    /\b[Qq]uestions?\s+0\s*(?:to|–|-)\s*4\b/g,
    `Questions ${globalStart} to ${block1End}`
  );
  text = text.replace(
    /\b[Qq]uestions?\s+5\s*(?:to|–|-)\s*9\b/g,
    `Questions ${block2Start} to ${globalEnd}`
  );
  text = text.replace(/\b[Qq]uestion\s+0\b/g, `Question ${globalStart}`);

  if (section > 1) {
    text = text.replace(
      /\b[Qq]uestions?\s+1\s*(?:to|–|-)\s*5\b/g,
      `Questions ${globalStart} to ${block1End}`
    );
    text = text.replace(
      /\b[Qq]uestions?\s+6\s*(?:to|–|-)\s*10\b/g,
      `Questions ${block2Start} to ${globalEnd}`
    );
  }

  return text;
}

/**
 * Apply canonical speaker name to unlabeled monologue text (sections 2 & 4).
 * @param {string} text
 * @param {{ name?: string, gender?: string }} profile
 */
export function sanitizeSpeechTextForProfile(text, profile) {
  if (!profile?.name || !String(text ?? "").trim()) return text;

  let out = String(text);
  const introRe = new RegExp(INTRO_NAME_RE.source, "gi");
  out = out.replace(introRe, (full, name) => {
    const inferred = inferGenderFromName(name);
    if (!inferred || inferred !== profile.gender) {
      return full.replace(name, profile.name);
    }
    return full.replace(name, profile.name);
  });

  const femaleFirst =
    /\b(?:Sarah|Emma|Lisa|Sophie|Olivia|Emily|Maria|Anna|Jane|Helen|Amy|Kate|Lucy|Rachel|Laura|Nicole|Michelle|Jennifer|Jessica|Ashley|Amanda|Melissa|Rebecca|Caroline|Natalie|Zoe|Leah|Samantha|Chloe|Grace|Victoria|Diana|Abigail|Hannah|Julia|Marie|Julie|Karen|Sharon|Elizabeth|Susan|Margaret|Nancy|Betty|Dorothy|Sandra|Donna|Carol|Ruth|Sharon|Michelle|Laura|Emily|Kimberly|Deborah|Jessica|Shirley|Cynthia|Angela|Melissa|Brenda|Amy|Anna|Rebecca|Virginia|Katherine|Christine|Samantha|Debra|Rachel|Carolyn|Janet|Catherine|Frances|Ann|Joyce|Diane|Alice|Julie|Heather|Teresa|Doris|Gloria|Cheryl|Mildred|Joan|Kelly|Judith|Rose|Janice|Kelly|Nicole|Judy|Christina|Kathy|Theresa|Beverly|Denise|Tammy|Irene|Jane|Lori|Marilyn|Andrea|Kathryn|Louise|Sara|Anne|Jacqueline|Wanda|Bonnie|Julia|Ruby|Lois|Tina|Paula|Eleanor|Elaine|Edna|Megan|Hazel|Crystal|Brittany|Danielle|Monica|Tracy|Dana|Stacy|April|Brenda|Claire|Gabriella|Jasmine|Brianna|Madison|Ellie|Aubrey|Zoey|Penelope|Layla|Violet|Aurora|Savannah|Audrey|Brooklyn|Bella|Skylar|Paisley|Everly|Allison|Valerie|Brittany|Diana|Abigail|Jane|Lori|Tammy|Rose|Kathy|Alexis)\b/gi;
  const maleFirst =
    /\b(?:David|James|Michael|Robert|Tom|John|William|Richard|Joseph|Charles|Daniel|Matthew|Anthony|Mark|Donald|Steven|Paul|Andrew|Joshua|Kenneth|Kevin|Brian|George|Timothy|Ronald|Edward|Jason|Jeffrey|Ryan|Jacob|Gary|Nicholas|Eric|Jonathan|Stephen|Larry|Justin|Scott|Brandon|Benjamin|Samuel|Raymond|Gregory|Frank|Alexander|Patrick|Jack|Dennis|Jerry|Tyler|Aaron|Adam|Nathan|Henry|Douglas|Zachary|Peter|Kyle|Noah|Ethan|Jeremy|Walter|Christian|Keith|Roger|Terry|Gerald|Harold|Sean|Austin|Carl|Arthur|Lawrence|Dylan|Jesse|Jordan|Bryan|Billy|Bruce|Albert|Willie|Gabriel|Logan|Alan|Juan|Wayne|Roy|Ralph|Randy|Eugene|Vincent|Russell|Louis|Philip|Bobby|Johnny|Mason|Liam|Oliver|Elijah|Lucas|Aiden|Jackson|Sebastian|Carter|Wyatt|Jayden|Owen|Luke|Isaac|Grayson|Julian|Levi|Christopher|Theodore|Caleb|Josiah|Hudson|Hunter|Eli|Isaiah|Connor|Jeremiah|Cameron|Adrian|Easton|Nolan|Ezra|Colton|Dominic|Cooper|Ian|Carson|Axel|Mateo|Bentley|Sawyer|Nathaniel|Ryder|Kingston|Rowan|Ashton|Roman|Waylon|Silas|Bennett|Weston|Kai|Damian|August|Zayden|Wesley|Emmanuel|Brady|Jameson|Maxwell|Amir|Ivan|Diego|Luis|Miguel|Carlos|Omar|Yusuf|Ali|Hassan|Ahmed|Mohammed|Abdul|Tariq|Khalid|Mustafa|Ibrahim|Karim|Samir|Naveed|Raj|Amit|Rahul|Vikram|Arjun|Rohan|Dev|Kiran|Sanjay|Rajesh|Suresh|Manoj|Vijay|Anil|Ravi|Deepak|Sandeep|Ashok|Mukesh|Harish|Gopal|Vinod|Prakash|Sunil|Mahesh|Dinesh|Naresh|Peter|Paul|Mark|Luke|Simon|Martin|Geoffrey|Nigel|Colin|Derek|Gordon|Neil|Barry|Terence|Clive|Graham|Trevor|Malcolm|Rodney|Stuart|Warren|Dean|Earl|Floyd|Glen|Harvey|Leon|Milton|Norman|Perry|Rex|Seth|Troy|Vernon|Wade|Zane|Mitchell|Harrison|Johnson|Wilson|Mitchell|Harrison|Thompson|Anderson|Taylor|Moore|Jackson|Martin|Lee|Perez|Thomson|White|Harris|Sanchez|Clark|Ramirez|Lewis|Robinson|Walker|Young|Allen|King|Wright|Scott|Torres|Nguyen|Hill|Flores|Green|Adams|Nelson|Baker|Hall|Rivera|Campbell|Mitchell|Carter|Roberts)\b/gi;

  if (profile.gender === "male") {
    out = out.replace(femaleFirst, profile.name);
  } else if (profile.gender === "female") {
    out = out.replace(maleFirst, profile.name);
  }

  return out;
}

/**
 * Sanitize unlabeled monologue lines (section 2 Guide / section 4 Lecturer).
 * @param {string} transcript
 * @param {number} sectionNumber
 * @param {Array<{ label?: string, name?: string, gender?: string }>} speakers
 */
export function sanitizeUnlabeledMonologueNames(
  transcript,
  sectionNumber,
  speakers
) {
  const section = Number(sectionNumber);
  if (section !== 2 && section !== 4) return transcript;
  if (!String(transcript ?? "").trim()) return transcript;

  const profiles =
    speakers?.length > 0
      ? speakers
      : getDefaultSpeakersForSection(section);
  const profile = profiles[0];
  if (!profile?.name) return transcript;

  const lines = String(transcript).split(/\r?\n/);
  const out = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || SPEAKER_LINE_RE.test(trimmed)) return line;
    return sanitizeSpeechTextForProfile(trimmed, profile);
  });

  return out.join("\n");
}

/**
 * Full pipeline: align labels, then canonical names per speaker.
 * @param {string} transcript
 * @param {number} sectionNumber
 */
export function prepareTranscriptForListening(
  transcript,
  sectionNumber,
  speakers
) {
  let text = sanitizeTranscriptQuestionReferences(transcript, sectionNumber);
  text = sanitizeUnlabeledMonologueNames(text, sectionNumber, speakers);
  const aligned = alignTranscriptSpeakerLabels(text, sectionNumber, speakers);
  return sanitizeTranscriptCharacterNames(aligned, sectionNumber, speakers);
}

/**
 * @param {string} speakerLabel
 * @param {number} sectionNumber
 * @param {Array<{ label: string, name?: string }>} [speakers]
 */
export function getDisplayNameForSpeakerLabel(
  speakerLabel,
  sectionNumber,
  speakers
) {
  const key = String(speakerLabel ?? "")
    .trim()
    .toLowerCase();
  const list =
    speakers?.length > 0
      ? speakers
      : getDefaultSpeakersForSection(sectionNumber);

  const profile = list.find(
    (s) =>
      String(s.label ?? "")
        .trim()
        .toLowerCase() === key
  );

  return profile?.displayName?.trim() || profile?.name?.trim() || speakerLabel;
}
