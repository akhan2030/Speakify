/** English Pathway CEFR curriculum — not used by IELTS Accelerator. */
import {
  type PathwayLevelId,
  type PathwaySkill,
  PATHWAY_LEVEL_NAMES,
  levelCodeFromId,
} from "@/lib/programs/terminology";

export type PathwaySkillUnit = {
  id: string;
  title: string;
  level: string;
  week: number;
  minutes: number;
  objective: string;
  instructions: string;
};

type UnitTemplate = Omit<PathwaySkillUnit, "id" | "level">;

function units(
  levelId: PathwayLevelId,
  skill: PathwaySkill,
  templates: UnitTemplate[]
): PathwaySkillUnit[] {
  const level = PATHWAY_LEVEL_NAMES[levelId];
  return templates.map((t, i) => ({
    ...t,
    id: `${levelId}-${skill}-${i + 1}`,
    level,
  }));
}

const SPEAKING_B1_1: UnitTemplate[] = [
  {
    title: "Talking About Past Experiences",
    week: 1,
    minutes: 15,
    objective: "Describe past events clearly using past tenses.",
    instructions:
      "Record a 2-minute answer about a memorable trip or experience. Use past simple and past continuous where appropriate.",
  },
  {
    title: "Giving Opinions and Reasons",
    week: 1,
    minutes: 12,
    objective: "Express and support personal opinions in conversation.",
    instructions:
      "Respond to 3 prompts (e.g. social media, city life, learning English). Give your opinion and at least two reasons for each.",
  },
  {
    title: "Describing Future Plans",
    week: 2,
    minutes: 12,
    objective: "Talk about intentions and arrangements for the future.",
    instructions:
      "Explain your plans for the next month using going to, will, and present continuous for arrangements.",
  },
  {
    title: "Making Suggestions",
    week: 2,
    minutes: 10,
    objective: "Offer and respond to suggestions politely.",
    instructions:
      "Roleplay: a friend wants weekend plans. Make 4 suggestions and respond to their ideas using Let's, Why don't we, and How about.",
  },
  {
    title: "Handling Everyday Problems",
    week: 3,
    minutes: 15,
    objective: "Explain a problem and propose practical solutions.",
    instructions:
      "Choose a daily-life problem (late bus, lost item, appointment change). Describe what happened and what you did to solve it.",
  },
  {
    title: "Short Presentation Practice",
    week: 3,
    minutes: 18,
    objective: "Organise ideas for a brief structured talk.",
    instructions:
      "Prepare a 3-minute presentation on a hobby or local place. Include an introduction, two main points, and a conclusion.",
  },
  {
    title: "Conversation Roleplay",
    week: 4,
    minutes: 15,
    objective: "Maintain a natural two-way conversation.",
    instructions:
      "Complete a roleplay with the AI partner: making plans, asking follow-up questions, and reacting naturally.",
  },
  {
    title: "Pronunciation and Fluency Practice",
    week: 5,
    minutes: 12,
    objective: "Improve clarity, stress, and smooth delivery.",
    instructions:
      "Read aloud a short passage, then re-record in your own words. Focus on sentence stress and linking sounds.",
  },
];

const GRAMMAR_B1_1: UnitTemplate[] = [
  {
    title: "Present Perfect for Life Experiences",
    week: 1,
    minutes: 20,
    objective: "Use present perfect with ever/never and for/since.",
    instructions: "Complete the lesson, then write 6 sentences about experiences using present perfect.",
  },
  {
    title: "Past Simple vs Present Perfect",
    week: 2,
    minutes: 20,
    objective: "Choose the correct tense for finished vs connected past.",
    instructions: "Work through contrast exercises and rewrite a short paragraph using both tenses correctly.",
  },
  {
    title: "Modals for Advice and Obligation",
    week: 3,
    minutes: 18,
    objective: "Use should, must, have to, and don't have to accurately.",
    instructions: "Complete guided practice and respond to 5 workplace/school advice scenarios.",
  },
  {
    title: "First Conditional for Real Possibilities",
    week: 4,
    minutes: 18,
    objective: "Form if-clauses for real future situations.",
    instructions: "Write 8 first conditional sentences about health, study, and travel.",
  },
  {
    title: "Relative Clauses in Context",
    week: 5,
    minutes: 20,
    objective: "Use who, which, that, and where in descriptive sentences.",
    instructions: "Combine sentence pairs and produce a 100-word description of a person or place.",
  },
];

const VOCABULARY_B1_1: UnitTemplate[] = [
  {
    title: "Work and Study Vocabulary",
    week: 1,
    minutes: 15,
    objective: "Learn 15 words for jobs, tasks, and learning.",
    instructions: "Study the word set, complete matching exercises, and use 5 words in original sentences.",
  },
  {
    title: "Travel and Transport",
    week: 2,
    minutes: 15,
    objective: "Master common travel collocations and phrasal verbs.",
    instructions: "Learn 15 items, complete gap-fill, and describe a recent journey.",
  },
  {
    title: "Health and Lifestyle",
    week: 3,
    minutes: 15,
    objective: "Discuss habits, health, and wellbeing.",
    instructions: "Study vocabulary, then write advice for a friend using 8 new words.",
  },
  {
    title: "Opinion and Discussion Language",
    week: 4,
    minutes: 12,
    objective: "Use phrases for agreeing, disagreeing, and hedging.",
    instructions: "Practise discourse markers and respond to 4 discussion prompts.",
  },
  {
    title: "Weekly Vocabulary Review Quiz",
    week: 5,
    minutes: 20,
    objective: "Consolidate 60+ words from this level block.",
    instructions: "Complete the spaced-repetition quiz and review any missed items.",
  },
];

const READING_B1_1: UnitTemplate[] = [
  {
    title: "Skimming for Main Ideas",
    week: 1,
    minutes: 20,
    objective: "Identify gist quickly in semi-formal texts.",
    instructions: "Read 2 short articles and write one-sentence summaries for each.",
  },
  {
    title: "Scanning for Specific Information",
    week: 2,
    minutes: 18,
    objective: "Locate dates, names, and figures efficiently.",
    instructions: "Complete timed scanning tasks using notices and information pages.",
  },
  {
    title: "Understanding Opinion Texts",
    week: 3,
    minutes: 22,
    objective: "Recognise viewpoint and supporting evidence.",
    instructions: "Read a blog post and answer inference questions about the writer's attitude.",
  },
  {
    title: "Text Organisation and Cohesion",
    week: 4,
    minutes: 20,
    objective: "Track reference words and paragraph function.",
    instructions: "Reorder paragraphs and identify linking devices in a magazine article.",
  },
  {
    title: "Weekly Reading Review",
    week: 5,
    minutes: 25,
    objective: "Apply B1.1 reading strategies under light time pressure.",
    instructions: "Complete one mixed comprehension set and review incorrect answers.",
  },
];

const LISTENING_B1_1: UnitTemplate[] = [
  {
    title: "Listening for Gist — Conversations",
    week: 1,
    minutes: 15,
    objective: "Understand the general topic of everyday dialogues.",
    instructions: "Listen to 3 conversations and choose the best summary for each.",
  },
  {
    title: "Detail Listening — Announcements",
    week: 2,
    minutes: 18,
    objective: "Catch specific information in public announcements.",
    instructions: "Answer questions about times, locations, and instructions.",
  },
  {
    title: "Attitude and Purpose",
    week: 3,
    minutes: 18,
    objective: "Identify how speakers feel and what they want.",
    instructions: "Listen to 4 clips and match speakers to attitudes (relieved, unsure, enthusiastic, annoyed).",
  },
  {
    title: "Note-Taking from Lectures",
    week: 4,
    minutes: 20,
    objective: "Extract key points from short educational audio.",
    instructions: "Take notes on a 4-minute talk, then answer 6 comprehension questions.",
  },
  {
    title: "Weekly Listening Review",
    week: 5,
    minutes: 22,
    objective: "Combine gist and detail skills at B1.1.",
    instructions: "Complete a mixed listening set and check answers with transcripts.",
  },
];

const WRITING_B1_1: UnitTemplate[] = [
  {
    title: "Personal Email Writing",
    week: 1,
    minutes: 25,
    objective: "Write a clear informal email with appropriate tone.",
    instructions: "Write 120–150 words inviting a friend to an event or sharing news.",
  },
  {
    title: "Describing a Process or Routine",
    week: 2,
    minutes: 25,
    objective: "Sequence ideas logically with time markers.",
    instructions: "Describe your daily routine or how to do something in 130 words.",
  },
  {
    title: "Opinion Paragraph",
    week: 3,
    minutes: 30,
    objective: "State and support a viewpoint in structured paragraphs.",
    instructions: "Write 150 words on whether students should study abroad. Include intro, two body points, conclusion.",
  },
  {
    title: "Problem–Solution Writing",
    week: 4,
    minutes: 30,
    objective: "Present a problem and suggest practical solutions.",
    instructions: "Write about a local issue and propose two solutions with examples.",
  },
  {
    title: "Weekly Writing Review",
    week: 5,
    minutes: 35,
    objective: "Edit for grammar, cohesion, and task completion.",
    instructions: "Revise a previous draft using feedback checklist, then submit final version.",
  },
];

const PRONUNCIATION_B1_1: UnitTemplate[] = [
  {
    title: "Word Stress in Two-Syllable Words",
    week: 1,
    minutes: 12,
    objective: "Place stress correctly on common B1 vocabulary.",
    instructions: "Listen, repeat, and record 20 words with correct stress patterns.",
  },
  {
    title: "Sentence Stress and Rhythm",
    week: 2,
    minutes: 12,
    objective: "Emphasise content words and reduce function words.",
    instructions: "Practise reading 8 sentences with natural rhythm, then record.",
  },
  {
    title: "Linking Sounds",
    week: 3,
    minutes: 12,
    objective: "Connect words smoothly in fluent speech.",
    instructions: "Drill linking in common phrases and re-record a short monologue.",
  },
  {
    title: "Intonation for Questions and Lists",
    week: 4,
    minutes: 10,
    objective: "Use rising/falling tone appropriately.",
    instructions: "Practise yes/no and wh-questions, then lists of three items.",
  },
  {
    title: "Fluency Review — Read Aloud",
    week: 5,
    minutes: 15,
    objective: "Combine pronunciation features in extended speech.",
    instructions: "Read a 150-word passage twice: first clearly, then more naturally.",
  },
];

const LEVEL_SKILL_TEMPLATES: Partial<
  Record<
    PathwayLevelId,
    Partial<Record<PathwaySkill, UnitTemplate[]>>
  >
> = {
  b1_1: {
    speaking: SPEAKING_B1_1,
    grammar: GRAMMAR_B1_1,
    vocabulary: VOCABULARY_B1_1,
    reading: READING_B1_1,
    listening: LISTENING_B1_1,
    writing: WRITING_B1_1,
    pronunciation: PRONUNCIATION_B1_1,
  },
};

const CEFR_SPEAKING_THEMES: Record<string, string[]> = {
  A1: [
    "Introducing Yourself",
    "Talking About Your Family",
    "Daily Routines",
    "Ordering Food",
    "Asking Simple Questions",
  ],
  A2: [
    "Describing Your Home Town",
    "Talking About Last Weekend",
    "Making Plans with Friends",
    "Shopping Conversations",
    "Simple Problem Solving",
  ],
  B1: SPEAKING_B1_1.map((u) => u.title),
  B2: [
    "Discussing Abstract Topics",
    "Presenting an Argument",
    "Handling Complex Roleplays",
    "Summarising Information",
    "Negotiating Solutions",
  ],
  C1: [
    "Advanced Discussion Skills",
    "Professional Presentations",
    "Hypothesising and Speculating",
    "Evaluating Options",
    "Formal vs Informal Register",
  ],
};

function cefrTier(levelId: PathwayLevelId): string {
  return levelId.charAt(0).toUpperCase();
}

function buildGenericUnits(
  levelId: PathwayLevelId,
  skill: PathwaySkill
): UnitTemplate[] {
  const code = levelCodeFromId(levelId);
  const tier = cefrTier(levelId);
  const themes =
    skill === "speaking"
      ? CEFR_SPEAKING_THEMES[tier] ?? CEFR_SPEAKING_THEMES.B1
      : [
          `${skill} Unit 1: Core Skills`,
          `${skill} Unit 2: Guided Practice`,
          `${skill} Unit 3: Application Tasks`,
          `${skill} Unit 4: Consolidation`,
          `${skill} Unit 5: Level Review`,
        ];

  return themes.slice(0, 5).map((title, i) => ({
    title: skill === "speaking" ? title : `${code} ${title}`,
    week: i + 1,
    minutes: 12 + i * 2,
    objective: `Build ${skill} skills appropriate for ${PATHWAY_LEVEL_NAMES[levelId]}.`,
    instructions: `Complete the ${skill} activities for Week ${i + 1}. Focus on accuracy, then fluency. Submit or record your work for feedback.`,
  }));
}

export function getPathwaySkillUnits(
  levelId: PathwayLevelId,
  skill: PathwaySkill,
  currentWeek?: number
): PathwaySkillUnit[] {
  const templates =
    LEVEL_SKILL_TEMPLATES[levelId]?.[skill] ?? buildGenericUnits(levelId, skill);
  const all = units(levelId, skill, templates);
  if (!currentWeek) return all;
  return all.filter((u) => u.week <= Math.max(currentWeek, 1));
}

export function getRecommendedFocus(
  levelId: PathwayLevelId,
  week: number,
  skillProgress: Partial<Record<PathwaySkill, number>>
): { skill: PathwaySkill; label: string; reason: string } {
  const skills: PathwaySkill[] = [
    "grammar",
    "vocabulary",
    "reading",
    "listening",
    "speaking",
    "writing",
    "pronunciation",
  ];
  let weakest: PathwaySkill = "grammar";
  let lowest = 100;
  for (const s of skills) {
    const score = skillProgress[s] ?? 70;
    if (score < lowest) {
      lowest = score;
      weakest = s;
    }
  }
  const unit = getPathwaySkillUnits(levelId, weakest, week).find(
    (u) => u.week === week
  );
  return {
    skill: weakest,
    label: unit?.title ?? `${weakest} practice`,
    reason: `Lowest skill progress (${lowest}%) at ${PATHWAY_LEVEL_NAMES[levelId]}.`,
  };
}

export function defaultSkillProgress(
  levelId: PathwayLevelId
): Record<PathwaySkill, number> {
  const base: Record<PathwayLevelId, number> = {
    a1_1: 45,
    a1_2: 52,
    a2_1: 58,
    a2_2: 64,
    b1_1: 72,
    b1_2: 76,
    b2_1: 80,
    b2_2: 84,
    c1_1: 88,
    c1_2: 92,
  };
  const b = base[levelId] ?? 70;
  return {
    grammar: b + 4,
    vocabulary: b + 6,
    reading: b - 2,
    listening: b,
    speaking: b - 1,
    writing: b - 3,
    pronunciation: b - 2,
  };
}
