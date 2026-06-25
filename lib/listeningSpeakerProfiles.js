/**
 * IELTS listening speaker names, genders, and TTS voice assignments.
 * Male voices: onyx, echo, fable — Female voices: nova, shimmer, alloy
 */

import {
  isBannedSpeakerName,
  pickSection1SpeakerPair,
} from "./listeningSection1Diversity.js";

export const MALE_VOICES = new Set(["onyx", "echo", "fable"]);
export const FEMALE_VOICES = new Set(["nova", "shimmer", "alloy"]);

const FEMALE_NAME_RE =
  /\b(sarah|emma|lisa|fatima|maria|aisha|sophie|anna|lucy|kate|jane|helen|priya|mei|yuki|rosa|nina|claire|diana|olivia|emily|sophia|isabella|mia|charlotte|amelia|harper|evelyn|abigail|ella|elizabeth|sofia|avery|scarlett|grace|chloe|victoria|riley|aria|lily|aubrey|zoey|penelope|hannah|layla|eleanor|hazel|violet|aurora|savannah|audrey|brooklyn|bella|skylar|paisley|everly|anna|caroline|natalie|zoe|leah|samantha|allison|gabriella|jasmine|brianna|madison|ellie|ashley|jessica|amanda|michelle|stephanie|nicole|melissa|rebecca|rachel|laura|kimberly|deborah|sharon|cynthia|kathleen|amy|angela|brenda|pamela|nicole|katherine|samantha|christine|debra|rachel|catherine|carolyn|janet|maria|heather|diane|ruth|julie|joyce|virginia|victoria|kelly|christina|joan|evelyn|judith|megan|andrea|hannah|jacqueline|martha|gloria|teresa|sara|janice|marie|julia|grace|judy|theresa|madison|beverly|denise|marilyn|amber|danielle|brittany|diana|abigail|jane|lori|tammy|rose|kathy|alexis|lori|johnson|wilson)\b/i;

const MALE_NAME_RE =
  /\b(james|david|michael|robert|tom|ahmed|hassan|john|william|richard|joseph|thomas|charles|daniel|matthew|anthony|mark|donald|steven|paul|andrew|joshua|kenneth|kevin|brian|george|timothy|ronald|edward|jason|jeffrey|ryan|jacob|gary|nicholas|eric|jonathan|stephen|larry|justin|scott|brandon|benjamin|samuel|raymond|gregory|frank|alexander|patrick|jack|dennis|jerry|tyler|aaron|jose|adam|nathan|henry|douglas|zachary|peter|kyle|noah|ethan|jeremy|walter|christian|keith|roger|terry|gerald|harold|sean|austin|carl|arthur|lawrence|dylan|jesse|jordan|bryan|billy|bruce|albert|willie|gabriel|logan|alan|juan|wayne|roy|ralph|randy|eugene|vincent|russell|louis|philip|bobby|johnny|mason|liam|noah|oliver|elijah|lucas|michael|alexander|ethan|daniel|matthew|aiden|henry|joseph|jackson|samuel|sebastian|david|carter|wyatt|jayden|john|owen|dylan|luke|gabriel|anthony|isaac|grayson|jack|julian|levi|christopher|joshua|andrew|theodore|caleb|ryan|nathan|thomas|charles|josiah|hudson|christian|hunter|eli|isaiah|connor|jeremiah|cameron|adrian|aaron|robert|easton|nolan|nicholas|ezra|colton|angel|dominic|austin|jordan|adam|cooper|ian|carson|axel|jaxson|mateo|jason|ezra|bentley|sawyer|nathaniel|ryder|kingston|rowan|ashton|ryan|roman|waylon|silas|bennett|weston|kai|christian|damian|august|kevin|zayden|wesley|alan|emmanuel|brady|jameson|maxwell|amir|jose|timothy|ivan|diego|luis|miguel|carlos|omar|yusuf|ali|hassan|ahmed|mohammed|abdul|tariq|khalid|mustafa|ibrahim|karim|samir|naveed|raj|amit|rahul|vikram|arjun|rohan|dev|kiran|sanjay|rajesh|suresh|manoj|vijay|anil|ravi|deepak|sandeep|ashok|mukesh|harish|gopal|vinod|prakash|sunil|mahesh|dinesh|naresh|peter|paul|mark|luke|simon|andrew|philip|stephen|martin|geoffrey|nigel|colin|derek|gordon|neil|barry|terence|clive|graham|keith|trevor|malcolm|rodney|stuart|warren|brent|carl|dean|earl|floyd|glen|harvey|leon|milton|norman|perry|rex|seth|troy|vernon|wade|zane|mitchell|harrison)\b/i;

/** @type {Record<number, Array<{ label: string, name: string, gender: 'male'|'female', voice: string, role?: string }>>} */
export const SECTION_SPEAKER_PROFILES = {
  1: [
    {
      label: "Speaker A",
      name: "James Carter",
      gender: "male",
      voice: "onyx",
      role: "staff",
    },
    {
      label: "Speaker B",
      name: "Emily Roberts",
      gender: "female",
      voice: "nova",
      role: "customer",
    },
  ],
  2: [
    {
      label: "Guide",
      name: "Oliver Bennett",
      gender: "male",
      voice: "fable",
      role: "guide",
    },
  ],
  3: [
    {
      label: "Tutor",
      name: "Nathan Brooks",
      gender: "male",
      voice: "onyx",
      role: "tutor",
    },
    {
      label: "Student A",
      name: "Hannah Cooper",
      gender: "female",
      voice: "shimmer",
      role: "student",
    },
    {
      label: "Student B",
      name: "Patrick Walsh",
      gender: "male",
      voice: "echo",
      role: "student",
    },
  ],
  4: [
    {
      label: "Lecturer",
      name: "Gregory Shaw",
      gender: "male",
      voice: "onyx",
      role: "lecturer",
    },
    {
      label: "Question",
      name: "Victoria Ellis",
      gender: "female",
      voice: "nova",
      role: "questioner",
    },
  ],
};

/**
 * @param {string} name
 */
export function inferGenderFromName(name) {
  const n = String(name ?? "").trim();
  if (!n) return null;
  if (FEMALE_NAME_RE.test(n)) return "female";
  if (MALE_NAME_RE.test(n)) return "male";
  return null;
}

/**
 * @param {string} gender
 * @param {string} [name]
 */
export function voiceMatchesGender(voice, gender, name) {
  const g =
    gender === "male" || gender === "female"
      ? gender
      : inferGenderFromName(name);
  if (!g) return true;
  if (g === "male") return MALE_VOICES.has(voice);
  if (g === "female") return FEMALE_VOICES.has(voice);
  return true;
}

/**
 * @param {number} sectionNumber
 */
export function getDefaultSpeakersForSection(sectionNumber) {
  return SECTION_SPEAKER_PROFILES[sectionNumber] ?? [];
}

/**
 * @param {Array<{ label?: string, name?: string }>} parsedSpeakers
 * @param {number} sectionNumber
 * @param {{ assignedSpeakers?: Array<{ label: string, name: string, gender: string, voice?: string, role?: string }> }} [options]
 */
export function normalizeSpeakersFromPayload(
  parsedSpeakers,
  sectionNumber,
  options = {}
) {
  const parsed = Array.isArray(parsedSpeakers) ? parsedSpeakers : [];
  const parsedHasBanned =
    Number(sectionNumber) === 1 &&
    parsed.some((s) => isBannedSpeakerName(s?.name));

  let defaults =
    options.assignedSpeakers?.length > 0
      ? options.assignedSpeakers
      : getDefaultSpeakersForSection(sectionNumber);

  if (Number(sectionNumber) === 1 && (parsedHasBanned || parsed.length < 2)) {
    defaults = pickSection1SpeakerPair().speakers;
  }

  return defaults.map((profile) => {
    const gender = profile.gender;
    const fromApi = parsed.find(
      (s) =>
        String(s.label ?? "")
          .trim()
          .toLowerCase() === profile.label.toLowerCase()
    );
    const apiName = String(
      fromApi?.displayName ?? fromApi?.name ?? ""
    ).trim();
    const apiInferred = apiName ? inferGenderFromName(apiName) : null;
    const name =
      apiName &&
      !isBannedSpeakerName(apiName) &&
      (!apiInferred || apiInferred === gender)
        ? apiName
        : profile.displayName ?? profile.name;

    const voice = voiceMatchesGender(profile.voice, gender, name)
      ? profile.voice
      : gender === "female"
        ? "nova"
        : "onyx";

    return {
      speakerId: profile.speakerId,
      label: profile.label,
      displayName: name,
      name,
      gender,
      voiceId: profile.voiceId,
      voice,
      role: profile.role,
    };
  });
}

/**
 * @param {string} speakerLabel
 * @param {number} sectionNumber
 * @param {Array<{ label: string, voice?: string, name?: string, gender?: string }>} [speakers]
 */
export function getSpeakerProfileByLabel(
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

  if (profile) return profile;

  return getDefaultSpeakersForSection(sectionNumber).find(
    (s) =>
      String(s.label ?? "")
        .trim()
        .toLowerCase() === key
  );
}

/**
 * @param {string} speakerLabel
 * @param {number} sectionNumber
 * @param {Array<{ label: string, voice: string, name?: string, gender?: string }>} [speakers]
 */
export function getVoiceForSpeakerLabel(speakerLabel, sectionNumber, speakers) {
  const profile = getSpeakerProfileByLabel(
    speakerLabel,
    sectionNumber,
    speakers
  );
  return profile?.voice ?? "onyx";
}

/**
 * @param {number} sectionNumber
 */
export function getGlobalQuestionBase(sectionNumber) {
  return (Number(sectionNumber) - 1) * 10;
}

/**
 * @param {Array<object>} questions
 * @param {number} sectionNumber
 */
export function assignGlobalQuestionNumbers(questions, sectionNumber) {
  const base = getGlobalQuestionBase(sectionNumber);
  return questions.map((q, index) => ({
    ...q,
    questionNumber: base + index + 1,
  }));
}

export { getSecondaryQuestionType } from "./listeningSectionTypes.js";
