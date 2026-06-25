import type { Band, Question } from "../types";

const BANDS: Band[] = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0];
const TOPICS = [
  "Vision2030",
  "education",
  "technology",
  "environment",
  "health",
  "urbanization",
] as const;

const VOCAB_SETS: {
  band: Band;
  topic: (typeof TOPICS)[number];
  q: string;
  options: string[];
  correct: string;
  explanation: string;
  saudiTrap?: string;
}[] = [
  {
    band: 4.0,
    topic: "education",
    q: "Students must ___ regular attendance to pass the foundation year.",
    options: ["maintain", "maintains", "maintenance", "maintained"],
    correct: "maintain",
    explanation: "Collocation: maintain attendance (verb + noun).",
    saudiTrap: "Using 'keep' for all contexts (*keep attendance*) instead of maintain.",
  },
  {
    band: 4.0,
    topic: "health",
    q: "Choose the best word: Public hospitals offer ___ care at low cost.",
    options: ["basic", "basically", "basis", "basal"],
    correct: "basic",
    explanation: "Adjective + care: basic care.",
    saudiTrap: "Confusing basic/basically due to Arabic adverb patterns.",
  },
  {
    band: 4.5,
    topic: "urbanization",
    q: "Riyadh has seen rapid ___ growth over the last decade.",
    options: ["urban", "urbane", "urbanize", "urbanity"],
    correct: "urban",
    explanation: "Urban growth = city-related expansion.",
    saudiTrap: "Direct translation *city growth* without academic adjective urban.",
  },
  {
    band: 4.5,
    topic: "Vision2030",
    q: "The reform plan aims to ___ economic diversification.",
    options: ["promote", "promotion", "promoted", "promoter"],
    correct: "promote",
    explanation: "Verb after aim to + base form: promote.",
    saudiTrap: "Using noun promotion after 'to' (*to promotion*).",
  },
  {
    band: 5.0,
    topic: "technology",
    q: "Cloud systems can ___ operational costs for SMEs.",
    options: ["reduce", "reduction", "reducing", "reduced"],
    correct: "reduce",
    explanation: "Modal/can + base verb reduce.",
    saudiTrap: "Article omission before costs (*reduce operational costs* vs missing 'the' when specific).",
  },
  {
    band: 5.0,
    topic: "environment",
    q: "Solar farms provide a ___ source of electricity.",
    options: ["renewable", "renew", "renewably", "renewed"],
    correct: "renewable",
    explanation: "Renewable energy collocation.",
  },
  {
    band: 5.5,
    topic: "education",
    q: "Scholarships are highly ___ among high-achieving students.",
    options: ["competitive", "compete", "competition", "competitively"],
    correct: "competitive",
    explanation: "Highly + adjective competitive.",
    saudiTrap: "False friend *competent* confused with competitive.",
  },
  {
    band: 5.5,
    topic: "health",
    q: "Vaccination campaigns have ___ disease transmission.",
    options: ["curbed", "curb", "curbing", "curby"],
    correct: "curbed",
    explanation: "Present perfect: have + past participle curbed.",
  },
  {
    band: 6.0,
    topic: "technology",
    q: "The platform enables users to ___ data securely.",
    options: ["share", "sharing", "shared", "sharement"],
    correct: "share",
    explanation: "Enable + object + to-infinitive.",
  },
  {
    band: 6.0,
    topic: "Vision2030",
    q: "Non-oil revenue is becoming increasingly ___ to GDP.",
    options: ["significant", "signify", "significance", "significantly"],
    correct: "significant",
    explanation: "Become + adjective significant.",
  },
  {
    band: 6.5,
    topic: "environment",
    q: "Desertification poses a ___ threat to arid regions.",
    options: ["severe", "severely", "severity", "sever"],
    correct: "severe",
    explanation: "Adjective severe modifies threat.",
  },
  {
    band: 6.5,
    topic: "urbanization",
    q: "Transit-oriented design can ___ congestion in megacities.",
    options: ["alleviate", "alleviation", "alleviating", "alleviated"],
    correct: "alleviate",
    explanation: "Academic verb alleviate congestion.",
    saudiTrap: "Using *reduce* only; alleviate is more formal for IELTS writing.",
  },
  {
    band: 7.0,
    topic: "education",
    q: "Curriculum reform must be ___ with labour market needs.",
    options: ["aligned", "align", "alignment", "aligns"],
    correct: "aligned",
    explanation: "Be aligned with = collocation.",
  },
  {
    band: 7.0,
    topic: "health",
    q: "Telemedicine offers ___ access in remote communities.",
    options: ["equitable", "equity", "equitably", "equalize"],
    correct: "equitable",
    explanation: "Equitable access (fair distribution).",
  },
  {
    band: 7.5,
    topic: "technology",
    q: "Algorithms may ___ bias if training data are unrepresentative.",
    options: ["entrench", "entrenchment", "entrenched", "entrenching"],
    correct: "entrench",
    explanation: "May + base verb; entrench bias (formal).",
  },
  {
    band: 7.5,
    topic: "Vision2030",
    q: "The giga-projects are intended to ___ global investment.",
    options: ["attract", "attraction", "attractive", "attractively"],
    correct: "attract",
    explanation: "Intended to + verb attract.",
  },
  {
    band: 8.0,
    topic: "environment",
    q: "Carbon markets remain ___ without robust verification.",
    options: ["speculative", "speculate", "speculation", "speculatively"],
    correct: "speculative",
    explanation: "Remain + adjective speculative.",
  },
  {
    band: 8.0,
    topic: "education",
    q: "Interdisciplinary research can ___ siloed thinking.",
    options: ["transcend", "transcendence", "transcending", "transcended"],
    correct: "transcend",
    explanation: "Can + transcend (high-level academic verb).",
  },
];

const EXTRA_VOCAB: Omit<Question, "id" | "section" | "type">[] = [
  {
    band: 4.0,
    topic: "technology",
    question: "Wi-Fi is ___ in most university libraries.",
    options: ["available", "availability", "avail", "availably"],
    correct: "available",
    explanation: "Be + available.",
    saudiTrap: "Missing 'is' in speech translating Arabic verbless sentences.",
  },
  {
    band: 4.5,
    topic: "health",
    question: "Hydration is ___ for athletes in hot climates.",
    options: ["essential", "essentially", "essence", "essentiality"],
    correct: "essential",
    explanation: "Essential for + noun.",
  },
  {
    band: 5.0,
    topic: "Vision2030",
    question: "Tourism targets will ___ new hospitality jobs.",
    options: ["generate", "generation", "generating", "generative"],
    correct: "generate",
    explanation: "Will + base verb generate.",
  },
  {
    band: 5.5,
    topic: "environment",
    question: "Recycling rates remain ___ in some districts.",
    options: ["low", "lowly", "lower", "lowest"],
    correct: "low",
    explanation: "Remain + adjective low.",
  },
  {
    band: 6.0,
    topic: "urbanization",
    question: "Mixed-use zoning encourages ___ communities.",
    options: ["walkable", "walk", "walking", "walkability"],
    correct: "walkable",
    explanation: "Walkable communities (adjective).",
  },
  {
    band: 6.5,
    topic: "technology",
    question: "Cybersecurity is ___ to national infrastructure.",
    options: ["critical", "critically", "critic", "criticize"],
    correct: "critical",
    explanation: "Critical to = collocation.",
  },
  {
    band: 7.0,
    topic: "education",
    question: "Peer review ensures academic ___",
    options: ["rigour", "rigorous", "rigorously", "rigueur"],
    correct: "rigour",
    explanation: "Academic rigour (noun). British spelling common in IELTS.",
  },
  {
    band: 7.5,
    topic: "health",
    question: "Antimicrobial resistance is a ___ health crisis.",
    options: ["looming", "loom", "loomed", "loomingly"],
    correct: "looming",
    explanation: "Looming crisis = emerging threat.",
  },
  {
    band: 8.0,
    topic: "urbanization",
    question: "Gentrification may ___ long-term residents.",
    options: ["displace", "displacement", "displacing", "displaced"],
    correct: "displace",
    explanation: "May + displace (verb).",
  },
];

export function buildVocabularyQuestions(): Question[] {
  const fromSets: Question[] = VOCAB_SETS.map((item, i) => ({
    id: `vocab-${item.band}-${String(i + 1).padStart(2, "0")}`,
    section: "vocabulary" as const,
    band: item.band,
    type: "mcq" as const,
    question: item.q,
    options: item.options,
    correct: item.correct,
    explanation: item.explanation,
    saudiTrap: item.saudiTrap,
    topic: item.topic,
  }));

  const extra: Question[] = EXTRA_VOCAB.map((item, i) => ({
    id: `vocab-extra-${item.band}-${String(i + 1).padStart(2, "0")}`,
    section: "vocabulary",
    type: "mcq",
    ...item,
  }));

  const generated: Question[] = [];
  let idx = 0;
  for (const band of BANDS) {
    for (const topic of TOPICS) {
      if (fromSets.length + extra.length + generated.length >= 40) break;
      if (
        fromSets.some((s) => s.band === band && s.topic === topic) ||
        extra.some((e) => e.band === band && e.topic === topic)
      ) {
        continue;
      }
      idx += 1;
      generated.push({
        id: `vocab-gen-${band}-${idx}`,
        section: "vocabulary",
        band,
        type: "mcq",
        question: `In the context of ${topic}, choose the formal academic word: "The policy will ___ outcomes."`,
        options: ["improve", "improvement", "improving", "improved"],
        correct: "improve",
        explanation: `Formal verb improve fits policy + outcomes (${topic}).`,
        saudiTrap: "Using informal *make better* in writing tasks.",
        topic,
      });
    }
  }

  const all = [...fromSets, ...extra, ...generated].slice(0, 40);
  while (all.length < 40) {
    const band = BANDS[all.length % BANDS.length];
    const topic = TOPICS[all.length % TOPICS.length];
    all.push({
      id: `vocab-pad-${all.length + 1}`,
      section: "vocabulary",
      band,
      type: "mcq",
      question: `Which collocation is correct for ${topic}?`,
      options: [
        "conduct research",
        "make research",
        "do a research",
        "researching make",
      ],
      correct: "conduct research",
      explanation: "Academic collocation: conduct research.",
      saudiTrap: "Arabic-influenced *make research*.",
      topic,
    });
  }
  return all;
}
