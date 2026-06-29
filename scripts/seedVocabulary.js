/**
 * Seed starter vocabulary into Supabase vocabulary_words.
 * Run: node scripts/seedVocabulary.js
 */
const path = require("path");
const dotenv = require("dotenv");
const { createClient } = require("@supabase/supabase-js");

dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

function getSupabaseUrl() {
  return (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
}

/** @typedef {object} SeedWord
 * @property {string} word
 * @property {string} cefr_level
 * @property {string} part_of_speech
 * @property {string} definition
 * @property {string} definition_arabic
 * @property {string} pronunciation_ipa
 * @property {string} example_sentence
 * @property {string} ielts_example
 * @property {object} word_family
 * @property {string[]} collocations
 * @property {string} memory_hook
 * @property {string} saudi_context
 * @property {string} topic_category
 */

/** @type {SeedWord[]} */
const STARTER_WORDS = [
  // A1.1 — 6 words
  {
    word: "data",
    cefr_level: "A1.1",
    part_of_speech: "noun",
    definition: "Facts or information used for analysis or decision-making.",
    definition_arabic: "بيانات",
    pronunciation_ipa: "/ˈdeɪ.tə/",
    example_sentence: "The app collects data about daily study time.",
    ielts_example:
      "The chart presents data on renewable energy use in three countries.",
    word_family: { noun: "data", adjective: "data-driven" },
    collocations: ["collect data", "raw data", "data analysis", "present data"],
    memory_hook: "DAY-ta — think of facts you save every day.",
    saudi_context:
      "Saudi universities increasingly publish open data on research output.",
    topic_category: "academic",
  },
  {
    word: "result",
    cefr_level: "A1.1",
    part_of_speech: "noun",
    definition: "The outcome or effect of an action, process, or test.",
    definition_arabic: "نتيجة",
    pronunciation_ipa: "/rɪˈzʌlt/",
    example_sentence: "Her IELTS result arrived by email yesterday.",
    ielts_example:
      "The experiment produced surprising results that challenged earlier theories.",
    word_family: { noun: "result", verb: "result in", adjective: "resultant" },
    collocations: [
      "exam result",
      "positive result",
      "as a result",
      "achieve results",
    ],
    memory_hook: "re-ZULT — what you get when something ZIPS to an end.",
    saudi_context:
      "Students in Riyadh check their IELTS results online within days.",
    topic_category: "education",
  },
  {
    word: "change",
    cefr_level: "A1.1",
    part_of_speech: "verb",
    definition: "To make or become different.",
    definition_arabic: "يُغَيِّر / تغيّر",
    pronunciation_ipa: "/tʃeɪndʒ/",
    example_sentence: "Governments must change how cities manage water.",
    ielts_example:
      "Climate models suggest that rainfall patterns will change significantly by 2050.",
    word_family: { verb: "change", noun: "change", adjective: "changeable" },
    collocations: [
      "climate change",
      "significant change",
      "change rapidly",
      "bring about change",
    ],
    memory_hook: "CHAIN-ge — break the chain of the old way.",
    saudi_context:
      "Vision 2030 aims to change the economy beyond oil dependence.",
    topic_category: "environment",
  },
  {
    word: "local",
    cefr_level: "A1.1",
    part_of_speech: "adjective",
    definition: "Relating to a particular area or neighbourhood.",
    definition_arabic: "محلي",
    pronunciation_ipa: "/ˈloʊ.kəl/",
    example_sentence: "We bought dates from a local market in Al-Ahsa.",
    ielts_example:
      "Local communities often resist large mining projects near their homes.",
    word_family: { adjective: "local", noun: "locality", adverb: "locally" },
    collocations: [
      "local community",
      "local government",
      "local economy",
      "local residents",
    ],
    memory_hook: "LOW-cal — close to home, not global.",
    saudi_context:
      "Local crafts in Jeddah attract tourists interested in heritage.",
    topic_category: "society",
  },
  {
    word: "public",
    cefr_level: "A1.1",
    part_of_speech: "adjective",
    definition: "Open to or shared by all people; not private.",
    definition_arabic: "عام / عمومي",
    pronunciation_ipa: "/ˈpʌb.lɪk/",
    example_sentence: "Public parks are free to enter on weekends.",
    ielts_example:
      "Public funding for science has declined in several OECD nations.",
    word_family: { adjective: "public", noun: "public", verb: "publicize" },
    collocations: [
      "public transport",
      "public health",
      "general public",
      "public opinion",
    ],
    memory_hook: "PUB-lick — everyone in the pub (community) shares it.",
    saudi_context:
      "New public museums in Diriyah showcase Saudi history to visitors.",
    topic_category: "government",
  },
  {
    word: "plan",
    cefr_level: "A1.1",
    part_of_speech: "noun",
    definition: "A detailed proposal for achieving something.",
    definition_arabic: "خطة",
    pronunciation_ipa: "/plæn/",
    example_sentence: "She wrote a study plan for the next three months.",
    ielts_example:
      "Urban planners developed a plan to reduce traffic congestion in the capital.",
    word_family: { noun: "plan", verb: "plan", adjective: "planned" },
    collocations: [
      "development plan",
      "action plan",
      "long-term plan",
      "implement a plan",
    ],
    memory_hook: "PLAN — picture a map you draw before you go.",
    saudi_context:
      "The National Transformation Program is a key government plan.",
    topic_category: "government",
  },

  // A1.2 — 6 words
  {
    word: "benefit",
    cefr_level: "A1.2",
    part_of_speech: "noun",
    definition: "An advantage or positive effect gained from something.",
    definition_arabic: "فائدة / منفعة",
    pronunciation_ipa: "/ˈben.ɪ.fɪt/",
    example_sentence: "Regular reading has a clear benefit for vocabulary.",
    ielts_example:
      "Tourism can bring economic benefits, but it may harm fragile ecosystems.",
    word_family: { noun: "benefit", verb: "benefit", adjective: "beneficial" },
    collocations: [
      "economic benefit",
      "mutual benefit",
      "health benefits",
      "reap benefits",
    ],
    memory_hook: "BENNY-fit — Benny gets fit and gains an advantage.",
    saudi_context:
      "Scholarships benefit thousands of Saudi students studying abroad.",
    topic_category: "economy",
  },
  {
    word: "cost",
    cefr_level: "A1.2",
    part_of_speech: "noun",
    definition: "The amount of money needed to buy or do something.",
    definition_arabic: "تكلفة",
    pronunciation_ipa: "/kɒst/",
    example_sentence: "The cost of housing rose sharply last year.",
    ielts_example:
      "Renewable energy lowers the long-term cost of electricity generation.",
    word_family: { noun: "cost", verb: "cost", adjective: "costly" },
    collocations: [
      "high cost",
      "reduce costs",
      "cost of living",
      "at the cost of",
    ],
    memory_hook: "COST — count coins you must spend.",
    saudi_context:
      "Solar projects help cut the cost of power for remote towns.",
    topic_category: "economy",
  },
  {
    word: "policy",
    cefr_level: "A1.2",
    part_of_speech: "noun",
    definition: "A course of action adopted by a government or organization.",
    definition_arabic: "سياسة",
    pronunciation_ipa: "/ˈpɒl.ə.si/",
    example_sentence: "The school has a strict phone-use policy.",
    ielts_example:
      "Immigration policy shapes the skills profile of the labour market.",
    word_family: { noun: "policy", adjective: "policy-making" },
    collocations: [
      "government policy",
      "foreign policy",
      "policy maker",
      "implement policy",
    ],
    memory_hook: "POLICE-y — rules officials enforce like police.",
    saudi_context:
      "Saudi labour policy encourages hiring in the private sector.",
    topic_category: "government",
  },
  {
    word: "growth",
    cefr_level: "A1.2",
    part_of_speech: "noun",
    definition: "An increase in size, number, or importance over time.",
    definition_arabic: "نمو",
    pronunciation_ipa: "/ɡroʊθ/",
    example_sentence: "Population growth puts pressure on water supplies.",
    ielts_example:
      "Sustained economic growth requires investment in education and infrastructure.",
    word_family: { noun: "growth", verb: "grow", adjective: "growing" },
    collocations: [
      "economic growth",
      "population growth",
      "rapid growth",
      "growth rate",
    ],
    memory_hook: "GROW-th — what you get when things GROW.",
    saudi_context:
      "The non-oil sector shows strong growth under diversification plans.",
    topic_category: "economy",
  },
  {
    word: "rate",
    cefr_level: "A1.2",
    part_of_speech: "noun",
    definition: "A measure, quantity, or frequency relative to another amount.",
    definition_arabic: "معدل / نسبة",
    pronunciation_ipa: "/reɪt/",
    example_sentence: "The unemployment rate fell slightly this quarter.",
    ielts_example:
      "Crime rates vary widely between urban and rural districts.",
    word_family: { noun: "rate", verb: "rate", adjective: "rated" },
    collocations: [
      "birth rate",
      "success rate",
      "at a rate of",
      "interest rate",
    ],
    memory_hook: "RATE — how fast something rates on a scale.",
    saudi_context:
      "Literacy rates among Saudi youth are among the highest in the region.",
    topic_category: "society",
  },
  {
    word: "issue",
    cefr_level: "A1.2",
    part_of_speech: "noun",
    definition: "An important topic or problem for debate or action.",
    definition_arabic: "قضية / مشكلة",
    pronunciation_ipa: "/ˈɪʃ.uː/",
    example_sentence: "Water scarcity is a serious issue in arid regions.",
    ielts_example:
      "The report addresses ethical issues surrounding genetic engineering.",
    word_family: { noun: "issue", verb: "issue" },
    collocations: [
      "key issue",
      "address an issue",
      "environmental issue",
      "controversial issue",
    ],
    memory_hook: "ISH-oo — something fishy you must discuss.",
    saudi_context:
      "Youth employment remains a central issue in national debates.",
    topic_category: "society",
  },

  // A2.1 — 7 words
  {
    word: "environment",
    cefr_level: "A2.1",
    part_of_speech: "noun",
    definition: "The natural world and the conditions in which organisms live.",
    definition_arabic: "بيئة",
    pronunciation_ipa: "/ɪnˈvaɪ.rən.mənt/",
    example_sentence: "Factories must limit pollution in the environment.",
    ielts_example:
      "Protecting the marine environment requires international cooperation.",
    word_family: {
      noun: "environment",
      adjective: "environmental",
      adverb: "environmentally",
    },
    collocations: [
      "protect the environment",
      "environmental damage",
      "natural environment",
      "work environment",
    ],
    memory_hook: "en-VY-ronment — envy a green, healthy world around you.",
    saudi_context:
      "NEOM projects aim to balance development with environmental protection.",
    topic_category: "environment",
  },
  {
    word: "resource",
    cefr_level: "A2.1",
    part_of_speech: "noun",
    definition: "A supply of materials, money, or skills that can be used.",
    definition_arabic: "مورد",
    pronunciation_ipa: "/rɪˈsɔːs/",
    example_sentence: "Teachers need more digital resources for classrooms.",
    ielts_example:
      "Finite resources such as freshwater must be managed sustainably.",
    word_family: { noun: "resource", verb: "resource", adjective: "resourceful" },
    collocations: [
      "natural resources",
      "allocate resources",
      "human resources",
      "scarce resources",
    ],
    memory_hook: "re-SOURCE — where you SOURCE things again.",
    saudi_context:
      "Oil was once the dominant resource driving Saudi economic growth.",
    topic_category: "economy",
  },
  {
    word: "economy",
    cefr_level: "A2.1",
    part_of_speech: "noun",
    definition: "The system of production, trade, and consumption in a country.",
    definition_arabic: "اقتصاد",
    pronunciation_ipa: "/ɪˈkɒn.ə.mi/",
    example_sentence: "Small businesses strengthen the local economy.",
    ielts_example:
      "A diversified economy is less vulnerable to commodity price shocks.",
    word_family: { noun: "economy", adjective: "economic", adverb: "economically" },
    collocations: [
      "global economy",
      "market economy",
      "boost the economy",
      "economic growth",
    ],
    memory_hook: "eco-NOMY — home (eco) of money (nom = name/value).",
    saudi_context:
      "Tourism and entertainment are expanding sectors of the Saudi economy.",
    topic_category: "economy",
  },
  {
    word: "industry",
    cefr_level: "A2.1",
    part_of_speech: "noun",
    definition: "Economic activity concerned with processing raw materials and manufacturing.",
    definition_arabic: "صناعة",
    pronunciation_ipa: "/ˈɪn.də.stri/",
    example_sentence: "The tech industry hires many graduates each year.",
    ielts_example:
      "Heavy industry contributes to air pollution in industrial zones.",
    word_family: { noun: "industry", adjective: "industrial" },
    collocations: [
      "manufacturing industry",
      "service industry",
      "industry leader",
      "chemical industry",
    ],
    memory_hook: "IN-dustry — goods produced IN factories.",
    saudi_context:
      "The petrochemical industry is a pillar of Saudi exports.",
    topic_category: "economy",
  },
  {
    word: "health",
    cefr_level: "A2.1",
    part_of_speech: "noun",
    definition: "The condition of being well in body or mind.",
    definition_arabic: "صحة",
    pronunciation_ipa: "/helθ/",
    example_sentence: "Diet and sleep affect long-term health.",
    ielts_example:
      "Public health campaigns reduced smoking rates among teenagers.",
    word_family: { noun: "health", adjective: "healthy", adverb: "healthily" },
    collocations: [
      "public health",
      "mental health",
      "health care",
      "pose a risk to health",
    ],
    memory_hook: "HEALTH — how you feel when you have wealth of energy.",
    saudi_context:
      "Saudi health authorities expanded screening programmes nationwide.",
    topic_category: "health",
  },
  {
    word: "transport",
    cefr_level: "A2.1",
    part_of_speech: "noun",
    definition: "The movement of people or goods from one place to another.",
    definition_arabic: "نقل / مواصلات",
    pronunciation_ipa: "/ˈtræn.spɔːt/",
    example_sentence: "Cheap transport helps workers reach distant jobs.",
    ielts_example:
      "Investment in public transport can reduce urban congestion and emissions.",
    word_family: {
      noun: "transport",
      verb: "transport",
      adjective: "transportation",
    },
    collocations: [
      "public transport",
      "transport network",
      "means of transport",
      "transport infrastructure",
    ],
    memory_hook: "TRANS-port — carry across (trans) a port/place.",
    saudi_context:
      "The Riyadh Metro will transform urban transport for millions.",
    topic_category: "infrastructure",
  },
  {
    word: "education",
    cefr_level: "A2.1",
    part_of_speech: "noun",
    definition: "The process of teaching and learning, especially in schools.",
    definition_arabic: "تعليم",
    pronunciation_ipa: "/ˌedʒ.uˈkeɪ.ʃən/",
    example_sentence: "Free education improved literacy in the region.",
    ielts_example:
      "Higher education correlates with higher lifetime earnings in many countries.",
    word_family: { noun: "education", verb: "educate", adjective: "educational" },
    collocations: [
      "higher education",
      "quality education",
      "education system",
      "access to education",
    ],
    memory_hook: "ed-u-CATION — lead (ed) you to your station in life.",
    saudi_context:
      "International partnerships upgraded science education in Saudi universities.",
    topic_category: "education",
  },

  // A2.2 — 7 words
  {
    word: "population",
    cefr_level: "A2.2",
    part_of_speech: "noun",
    definition: "All the people living in a particular area or country.",
    definition_arabic: "سكان",
    pronunciation_ipa: "/ˌpɒp.jəˈleɪ.ʃən/",
    example_sentence: "The city population doubled in twenty years.",
    ielts_example:
      "An ageing population increases demand for healthcare services.",
    word_family: { noun: "population", verb: "populate", adjective: "populous" },
    collocations: [
      "population growth",
      "dense population",
      "rural population",
      "population density",
    ],
    memory_hook: "POP-u-lation — people POPulating a place.",
    saudi_context:
      "Saudi Arabia's young population drives demand for jobs and housing.",
    topic_category: "society",
  },
  {
    word: "technology",
    cefr_level: "A2.2",
    part_of_speech: "noun",
    definition: "The use of scientific knowledge for practical purposes, especially in industry.",
    definition_arabic: "تقنية / تكنولوجيا",
    pronunciation_ipa: "/tekˈnɒl.ə.dʒi/",
    example_sentence: "Classroom technology helps students practise speaking.",
    ielts_example:
      "Digital technology has transformed how researchers share findings.",
    word_family: { noun: "technology", adjective: "technological" },
    collocations: [
      "modern technology",
      "advances in technology",
      "technology sector",
      "emerging technology",
    ],
    memory_hook: "tech-NOLOGY — study of techniques (tech) and logic.",
    saudi_context:
      "Saudi tech hubs attract startups in AI and fintech.",
    topic_category: "technology",
  },
  {
    word: "research",
    cefr_level: "A2.2",
    part_of_speech: "noun",
    definition: "Systematic study to discover facts or reach new conclusions.",
    definition_arabic: "بحث",
    pronunciation_ipa: "/rɪˈsɜːtʃ/",
    example_sentence: "She joined a team doing cancer research.",
    ielts_example:
      "Peer-reviewed research underpins evidence-based medical treatment.",
    word_family: { noun: "research", verb: "research", adjective: "researcher" },
    collocations: [
      "conduct research",
      "scientific research",
      "research findings",
      "further research",
    ],
    memory_hook: "re-SEARCH — search again until you find truth.",
    saudi_context:
      "King Abdullah University conducts cutting-edge energy research.",
    topic_category: "academic",
  },
  {
    word: "evidence",
    cefr_level: "A2.2",
    part_of_speech: "noun",
    definition: "Facts or signs that show whether something is true or exists.",
    definition_arabic: "دليل / أدلة",
    pronunciation_ipa: "/ˈev.ɪ.dəns/",
    example_sentence: "There is little evidence that the treatment works.",
    ielts_example:
      "Archaeological evidence suggests trade links across the desert centuries ago.",
    word_family: { noun: "evidence", verb: "evidence", adjective: "evident" },
    collocations: [
      "strong evidence",
      "scientific evidence",
      "in evidence",
      "gather evidence",
    ],
    memory_hook: "EVID-ence — every VID (view) you see proves a point.",
    saudi_context:
      "Satellite evidence tracks desertification near agricultural zones.",
    topic_category: "academic",
  },
  {
    word: "factor",
    cefr_level: "A2.2",
    part_of_speech: "noun",
    definition: "One of several things that influence or cause a result.",
    definition_arabic: "عامل",
    pronunciation_ipa: "/ˈfæk.tər/",
    example_sentence: "Cost is a major factor when choosing a university.",
    ielts_example:
      "Genetic and environmental factors both contribute to disease risk.",
    word_family: { noun: "factor", verb: "factor in" },
    collocations: [
      "key factor",
      "contributing factor",
      "risk factor",
      "factor in",
    ],
    memory_hook: "FACT-or — something that acts like a fact in the outcome.",
    saudi_context:
      "Water availability is a critical factor for new city projects.",
    topic_category: "science",
  },
  {
    word: "trend",
    cefr_level: "A2.2",
    part_of_speech: "noun",
    definition: "A general direction in which something is developing or changing.",
    definition_arabic: "اتجاه / نزعة",
    pronunciation_ipa: "/trend/",
    example_sentence: "Online learning is a clear trend among IELTS candidates.",
    ielts_example:
      "The graph illustrates an upward trend in renewable energy consumption.",
    word_family: { noun: "trend", verb: "trend", adjective: "trendy" },
    collocations: [
      "upward trend",
      "emerging trend",
      "reverse the trend",
      "follow a trend",
    ],
    memory_hook: "TREND — lines TEND to move in one direction.",
    saudi_context:
      "A trend toward remote work changed office demand in major cities.",
    topic_category: "society",
  },
  {
    word: "impact",
    cefr_level: "A2.2",
    part_of_speech: "noun",
    definition: "A strong effect or influence on a situation or person.",
    definition_arabic: "تأثير",
    pronunciation_ipa: "/ˈɪm.pækt/",
    example_sentence: "Tourism has a positive impact on some coastal towns.",
    ielts_example:
      "Researchers measured the impact of microplastics on marine food chains.",
    word_family: { noun: "impact", verb: "impact", adjective: "impactful" },
    collocations: [
      "significant impact",
      "environmental impact",
      "have an impact on",
      "social impact",
    ],
    memory_hook: "IM-pact — packs a punch when something hits.",
    saudi_context:
      "Mega-events can have a lasting impact on hospitality employment.",
    topic_category: "society",
  },

  // B1.1 — 6 words
  {
    word: "significant",
    cefr_level: "B1.1",
    part_of_speech: "adjective",
    definition: "Large or important enough to be noticed or have an effect.",
    definition_arabic: "مهم / جوهري",
    pronunciation_ipa: "/sɪɡˈnɪf.ɪ.kənt/",
    example_sentence: "There was a significant improvement in her writing score.",
    ielts_example:
      "The study found a significant correlation between sleep and exam performance.",
    word_family: {
      adjective: "significant",
      noun: "significance",
      adverb: "significantly",
    },
    collocations: [
      "significant increase",
      "statistically significant",
      "significant role",
      "significant difference",
    ],
    memory_hook: "SIGN-if-icant — a SIGN that it matters.",
    saudi_context:
      "A significant share of graduates now work in the private sector.",
    topic_category: "academic",
  },
  {
    word: "approach",
    cefr_level: "B1.1",
    part_of_speech: "noun",
    definition: "A way of dealing with a situation or problem.",
    definition_arabic: "نهج / مقاربة",
    pronunciation_ipa: "/əˈprəʊtʃ/",
    example_sentence: "The teacher recommended a new approach to essay planning.",
    ielts_example:
      "A multidisciplinary approach is needed to tackle urban poverty.",
    word_family: { noun: "approach", verb: "approach" },
    collocations: [
      "adopt an approach",
      "holistic approach",
      "traditional approach",
      "innovative approach",
    ],
    memory_hook: "ap-PROACH — move PROACH (close) to the problem.",
    saudi_context:
      "Schools adopt a bilingual approach to strengthen English skills.",
    topic_category: "education",
  },
  {
    word: "analysis",
    cefr_level: "B1.1",
    part_of_speech: "noun",
    definition: "Detailed examination of the parts or structure of something.",
    definition_arabic: "تحليل",
    pronunciation_ipa: "/əˈnæl.ə.sɪs/",
    example_sentence: "His analysis of the chart missed one key year.",
    ielts_example:
      "Statistical analysis revealed seasonal patterns in air pollution levels.",
    word_family: { noun: "analysis", verb: "analyse", plural: "analyses" },
    collocations: [
      "data analysis",
      "in-depth analysis",
      "critical analysis",
      "carry out analysis",
    ],
    memory_hook: "ana-LY-sis — break apart (ana) to see lies/truths.",
    saudi_context:
      "Market analysis guides investment in Red Sea tourism projects.",
    topic_category: "academic",
  },
  {
    word: "contribute",
    cefr_level: "B1.1",
    part_of_speech: "verb",
    definition: "To give something, especially money or help, toward a shared result.",
    definition_arabic: "يُساهم",
    pronunciation_ipa: "/kənˈtrɪb.juːt/",
    example_sentence: "Volunteers contribute time to community programmes.",
    ielts_example:
      "Deforestation may contribute to more frequent flooding downstream.",
    word_family: {
      verb: "contribute",
      noun: "contribution",
      adjective: "contributory",
    },
    collocations: [
      "contribute to",
      "make a contribution",
      "contribute significantly",
      "major contributor",
    ],
    memory_hook: "con-TRIB-ute — tribe (group) gives together.",
    saudi_context:
      "Small firms contribute heavily to job creation outside oil.",
    topic_category: "economy",
  },
  {
    word: "maintain",
    cefr_level: "B1.1",
    part_of_speech: "verb",
    definition: "To keep something at the same level or in good condition.",
    definition_arabic: "يحافظ على",
    pronunciation_ipa: "/meɪnˈteɪn/",
    example_sentence: "It is hard to maintain focus during long lectures.",
    ielts_example:
      "Governments must maintain infrastructure to support economic competitiveness.",
    word_family: { verb: "maintain", noun: "maintenance" },
    collocations: [
      "maintain standards",
      "maintain control",
      "maintain a balance",
      "difficult to maintain",
    ],
    memory_hook: "MAIN-tain — keep the MAIN thing steady.",
    saudi_context:
      "Desalination plants maintain water supply during dry summers.",
    topic_category: "infrastructure",
  },
  {
    word: "consequence",
    cefr_level: "B1.1",
    part_of_speech: "noun",
    definition: "A result or effect, often one that is unwelcome.",
    definition_arabic: "عاقبة / نتيجة",
    pronunciation_ipa: "/ˈkɒn.sɪ.kwəns/",
    example_sentence: "Skipping practice has consequences for your band score.",
    ielts_example:
      "Policy makers failed to anticipate the social consequences of rapid automation.",
    word_family: { noun: "consequence", adjective: "consequent" },
    collocations: [
      "serious consequences",
      "unintended consequences",
      "face the consequences",
      "as a consequence",
    ],
    memory_hook: "CON-sequence — what follows (sequence) after an action.",
    saudi_context:
      "Water waste can have serious consequences for desert agriculture.",
    topic_category: "environment",
  },

  // B1.2 — 6 words
  {
    word: "establish",
    cefr_level: "B1.2",
    part_of_speech: "verb",
    definition: "To set up or create something on a firm or official basis.",
    definition_arabic: "يُؤسِّس / يثبت",
    pronunciation_ipa: "/ɪˈstæb.lɪʃ/",
    example_sentence: "The lab was established to study renewable fuels.",
    ielts_example:
      "Long-term studies are needed to establish a causal link between diet and disease.",
    word_family: { verb: "establish", noun: "establishment", adjective: "established" },
    collocations: [
      "establish a link",
      "well established",
      "establish rules",
      "establish itself",
    ],
    memory_hook: "e-STABLE-ish — make stable and official.",
    saudi_context:
      "New regulators were established to oversee the fintech sector.",
    topic_category: "government",
  },
  {
    word: "decline",
    cefr_level: "B1.2",
    part_of_speech: "verb",
    definition: "To become smaller, weaker, or fewer.",
    definition_arabic: "ينخفض / يتراجع",
    pronunciation_ipa: "/dɪˈklaɪn/",
    example_sentence: "Wildlife numbers continue to decline in some habitats.",
    ielts_example:
      "Manufacturing employment may decline as factories adopt automation.",
    word_family: { verb: "decline", noun: "decline" },
    collocations: [
      "sharp decline",
      "in decline",
      "decline rapidly",
      "population decline",
    ],
    memory_hook: "de-CLINE — slide down the CLINE (slope).",
    saudi_context:
      "Some traditional crafts decline unless supported by cultural tourism.",
    topic_category: "society",
  },
  {
    word: "adequate",
    cefr_level: "B1.2",
    part_of_speech: "adjective",
    definition: "Enough or satisfactory for a particular purpose.",
    definition_arabic: "كافٍ / ملائم",
    pronunciation_ipa: "/ˈæd.ɪ.kwət/",
    example_sentence: "Students need adequate time to process feedback.",
    ielts_example:
      "Many rural clinics lack adequate equipment to treat chronic illness.",
    word_family: { adjective: "adequate", noun: "adequacy", adverb: "adequately" },
    collocations: [
      "adequate supply",
      "adequate funding",
      "adequate preparation",
      "less than adequate",
    ],
    memory_hook: "ADD-equate — add enough to equate to the need.",
    saudi_context:
      "New housing must provide adequate shade in hot climates.",
    topic_category: "health",
  },
  {
    word: "alternative",
    cefr_level: "B1.2",
    part_of_speech: "noun",
    definition: "One of two or more available possibilities.",
    definition_arabic: "بديل",
    pronunciation_ipa: "/ɒlˈtɜː.nə.tɪv/",
    example_sentence: "Solar power is an alternative to diesel generators.",
    ielts_example:
      "Governments should invest in alternative energy sources to cut emissions.",
    word_family: { noun: "alternative", adjective: "alternative", adverb: "alternatively" },
    collocations: [
      "viable alternative",
      "alternative energy",
      "have no alternative",
      "alternative approach",
    ],
    memory_hook: "ALTER-native — another native option you can alter to.",
    saudi_context:
      "Green hydrogen offers an alternative export beyond crude oil.",
    topic_category: "environment",
  },
  {
    word: "phenomenon",
    cefr_level: "B1.2",
    part_of_speech: "noun",
    definition: "Something that exists and can be seen, felt, or studied, especially something unusual.",
    definition_arabic: "ظاهرة",
    pronunciation_ipa: "/fəˈnɒm.ɪ.nən/",
    example_sentence: "Northern lights are a natural phenomenon tourists travel to see.",
    ielts_example:
      "Urban heat islands are a well-documented phenomenon in large cities.",
    word_family: { noun: "phenomenon", plural: "phenomena" },
    collocations: [
      "natural phenomenon",
      "social phenomenon",
      "rare phenomenon",
      "observe a phenomenon",
    ],
    memory_hook: "fe-NOMEN-on — something NAMED (nomen) that happens.",
    saudi_context:
      "Dust storms are a seasonal phenomenon affecting visibility on highways.",
    topic_category: "environment",
  },
  {
    word: "implement",
    cefr_level: "B1.2",
    part_of_speech: "verb",
    definition: "To put a plan, decision, or system into effect.",
    definition_arabic: "يُنفِّذ",
    pronunciation_ipa: "/ˈɪm.plɪ.ment/",
    example_sentence: "Schools will implement new reading standards next term.",
    ielts_example:
      "It is costly to implement reforms across the entire health sector.",
    word_family: { verb: "implement", noun: "implementation" },
    collocations: [
      "implement policy",
      "implement changes",
      "successfully implement",
      "implement a strategy",
    ],
    memory_hook: "IM-plement — use the tool (implement) to make it real.",
    saudi_context:
      "Authorities implement smart traffic systems on major Riyadh roads.",
    topic_category: "government",
  },

  // B2.1 — 6 words
  {
    word: "hypothesis",
    cefr_level: "B2.1",
    part_of_speech: "noun",
    definition: "An idea or explanation that you test through study and experiments.",
    definition_arabic: "فرضية",
    pronunciation_ipa: "/haɪˈpɒθ.ə.sɪs/",
    example_sentence: "Our hypothesis was that noise reduces concentration.",
    ielts_example:
      "The researchers rejected the hypothesis after the trial produced conflicting data.",
    word_family: { noun: "hypothesis", plural: "hypotheses", adjective: "hypothetical" },
    collocations: [
      "test a hypothesis",
      "working hypothesis",
      "null hypothesis",
      "support the hypothesis",
    ],
    memory_hook: "hypo-THESIS — a thesis you put UNDER test.",
    saudi_context:
      "Climate scientists in the Kingdom test hypotheses about rainfall shifts.",
    topic_category: "science",
  },
  {
    word: "allocate",
    cefr_level: "B2.1",
    part_of_speech: "verb",
    definition: "To distribute resources or duties for a particular purpose.",
    definition_arabic: "يُخصِّص",
    pronunciation_ipa: "/ˈæl.ə.keɪt/",
    example_sentence: "Managers allocate staff to projects each quarter.",
    ielts_example:
      "Governments must allocate funds fairly between urban and rural hospitals.",
    word_family: { verb: "allocate", noun: "allocation" },
    collocations: [
      "allocate resources",
      "allocate funds",
      "allocate time",
      "fair allocation",
    ],
    memory_hook: "AL-LOC-ate — place (loc) assets where they go.",
    saudi_context:
      "The budget allocates billions to giga-projects and infrastructure.",
    topic_category: "economy",
  },
  {
    word: "inevitable",
    cefr_level: "B2.1",
    part_of_speech: "adjective",
    definition: "Certain to happen and impossible to avoid.",
    definition_arabic: "حتمي / لا مفر منه",
    pronunciation_ipa: "/ɪˈnev.ɪ.tə.bəl/",
    example_sentence: "Some job losses seem inevitable during restructuring.",
    ielts_example:
      "Automation makes some forms of manual labour obsolete, an outcome many consider inevitable.",
    word_family: { adjective: "inevitable", noun: "inevitability", adverb: "inevitably" },
    collocations: [
      "seem inevitable",
      "inevitable consequence",
      "virtually inevitable",
      "inevitable result",
    ],
    memory_hook: "in-EVIT-able — not able to EVIT (avoid).",
    saudi_context:
      "Economic diversification was seen as inevitable as global demand shifts.",
    topic_category: "economy",
  },
  {
    word: "preliminary",
    cefr_level: "B2.1",
    part_of_speech: "adjective",
    definition: "Coming before the main part; preparatory.",
    definition_arabic: "أولي / تمهيدي",
    pronunciation_ipa: "/prɪˈlɪm.ɪ.nər.i/",
    example_sentence: "Preliminary results suggest the drug is safe.",
    ielts_example:
      "Preliminary findings indicate that the policy reduced truancy, but further study is required.",
    word_family: { adjective: "preliminary", noun: "preliminaries" },
    collocations: [
      "preliminary results",
      "preliminary study",
      "preliminary stage",
      "preliminary evidence",
    ],
    memory_hook: "pre-LIMIN-ary — before the LIMIT of the final test.",
    saudi_context:
      "Preliminary surveys guided site selection for new economic zones.",
    topic_category: "academic",
  },
  {
    word: "substantial",
    cefr_level: "B2.1",
    part_of_speech: "adjective",
    definition: "Large in amount, value, or importance.",
    definition_arabic: "كبير / جوهري",
    pronunciation_ipa: "/səbˈstæn.ʃəl/",
    example_sentence: "They made substantial progress in Task 1 vocabulary.",
    ielts_example:
      "The dam provided a substantial share of the region's electricity.",
    word_family: { adjective: "substantial", adverb: "substantially", noun: "substance" },
    collocations: [
      "substantial amount",
      "substantial evidence",
      "substantial increase",
      "substantial contribution",
    ],
    memory_hook: "sub-STANCE-ial — filled with real STANCE (substance).",
    saudi_context:
      "Foreign investment brought substantial capital into tech startups.",
    topic_category: "economy",
  },
  {
    word: "undermine",
    cefr_level: "B2.1",
    part_of_speech: "verb",
    definition: "To gradually weaken or damage something abstract, such as trust or health.",
    definition_arabic: "يُضعِف / يُقوِّض",
    pronunciation_ipa: "/ˌʌn.dəˈmaɪn/",
    example_sentence: "Constant criticism can undermine a student's confidence.",
    ielts_example:
      "Corruption may undermine public trust in institutions.",
    word_family: { verb: "undermine" },
    collocations: [
      "undermine confidence",
      "undermine efforts",
      "seriously undermine",
      "undermine authority",
    ],
    memory_hook: "UNDER-mine — dig under until the structure falls.",
    saudi_context:
      "Misinformation can undermine health campaigns during outbreaks.",
    topic_category: "society",
  },

  // B2.2 — 6 words
  {
    word: "paradigm",
    cefr_level: "B2.2",
    part_of_speech: "noun",
    definition: "A typical example or pattern of ideas in a field of study.",
    definition_arabic: "نموذج فكري",
    pronunciation_ipa: "/ˈpær.ə.daɪm/",
    example_sentence: "Online exams shifted the teaching paradigm.",
    ielts_example:
      "Kuhn argued that scientific progress often involves a paradigm shift.",
    word_family: { noun: "paradigm", adjective: "paradigmatic" },
    collocations: [
      "paradigm shift",
      "dominant paradigm",
      "new paradigm",
      "within the paradigm",
    ],
    memory_hook: "PAIR-a-dime — pair ideas that are worth a dime in the model.",
    saudi_context:
      "Renewable exports represent a paradigm shift in Saudi energy policy.",
    topic_category: "academic",
  },
  {
    word: "mitigate",
    cefr_level: "B2.2",
    part_of_speech: "verb",
    definition: "To make something less harmful, serious, or painful.",
    definition_arabic: "يُخفِّف",
    pronunciation_ipa: "/ˈmɪt.ɪ.ɡeɪt/",
    example_sentence: "Trees help mitigate heat in dense neighbourhoods.",
    ielts_example:
      "Flood barriers were built to mitigate damage from storm surges.",
    word_family: { verb: "mitigate", noun: "mitigation", adjective: "mitigating" },
    collocations: [
      "mitigate risk",
      "mitigate effects",
      "mitigate climate change",
      "mitigation measures",
    ],
    memory_hook: "MIT-igate — soften the HIT of harm.",
    saudi_context:
      "Green belts mitigate sandstorms encroaching on urban areas.",
    topic_category: "environment",
  },
  {
    word: "correlation",
    cefr_level: "B2.2",
    part_of_speech: "noun",
    definition: "A mutual relationship between two things that change together.",
    definition_arabic: "ارتباط / علاقة ارتباطية",
    pronunciation_ipa: "/ˌkɒr.əˈleɪ.ʃən/",
    example_sentence: "There is a correlation between practice hours and scores.",
    ielts_example:
      "A correlation between income and life expectancy does not prove causation.",
    word_family: { noun: "correlation", verb: "correlate", adjective: "correlated" },
    collocations: [
      "strong correlation",
      "positive correlation",
      "correlation between",
      "show a correlation",
    ],
    memory_hook: "co-RELATE-ion — things relate and move together.",
    saudi_context:
      "Analysts study correlation between oil prices and government revenue.",
    topic_category: "economy",
  },
  {
    word: "disparity",
    cefr_level: "B2.2",
    part_of_speech: "noun",
    definition: "A great difference, especially one that is unfair.",
    definition_arabic: "تفاوت / فجوة",
    pronunciation_ipa: "/dɪˈspær.ə.ti/",
    example_sentence: "A disparity in funding affects rural schools most.",
    ielts_example:
      "Income disparity between regions can fuel migration to capital cities.",
    word_family: { noun: "disparity", adjective: "disparate" },
    collocations: [
      "income disparity",
      "health disparity",
      "wide disparity",
      "reduce disparity",
    ],
    memory_hook: "DIS-PARITY — not at PAR; unequal pair.",
    saudi_context:
      "Efforts aim to reduce disparity between regions in healthcare access.",
    topic_category: "society",
  },
  {
    word: "sustainable",
    cefr_level: "B2.2",
    part_of_speech: "adjective",
    definition: "Able to continue over time without damaging the environment or depleting resources.",
    definition_arabic: "مستدام",
    pronunciation_ipa: "/səˈsteɪ.nə.bəl/",
    example_sentence: "Sustainable farming saves water in dry climates.",
    ielts_example:
      "Critics question whether rapid tourism growth is environmentally sustainable.",
    word_family: {
      adjective: "sustainable",
      noun: "sustainability",
      verb: "sustain",
    },
    collocations: [
      "sustainable development",
      "environmentally sustainable",
      "sustainable growth",
      "sustainable practices",
    ],
    memory_hook: "SUSTAIN-able — you can SUSTAIN it for years.",
    saudi_context:
      "The Line project markets itself as a model of sustainable urban design.",
    topic_category: "environment",
  },
  {
    word: "comprehensive",
    cefr_level: "B2.2",
    part_of_speech: "adjective",
    definition: "Including everything that is necessary; complete and thorough.",
    definition_arabic: "شامل",
    pronunciation_ipa: "/ˌkɒm.prɪˈhen.sɪv/",
    example_sentence: "The course offers comprehensive writing feedback.",
    ielts_example:
      "A comprehensive review of the literature identified several gaps in the evidence.",
    word_family: {
      adjective: "comprehensive",
      noun: "comprehension",
      verb: "comprehend",
    },
    collocations: [
      "comprehensive study",
      "comprehensive plan",
      "comprehensive coverage",
      "comprehensive approach",
    ],
    memory_hook: "COMPREHEND-sive — so wide you comprehend it all.",
    saudi_context:
      "Authorities published a comprehensive strategy for water conservation.",
    topic_category: "government",
  },

  // C1.1 — 6 words
  {
    word: "jurisdiction",
    cefr_level: "C1.1",
    part_of_speech: "noun",
    definition: "The official power to make legal decisions and judgments.",
    definition_arabic: "اختصاص قضائي / سلطة",
    pronunciation_ipa: "/ˌdʒʊə.rɪsˈdɪk.ʃən/",
    example_sentence: "The court has jurisdiction over commercial disputes in the region.",
    ielts_example:
      "Cross-border jurisdiction complicates enforcement of intellectual property law.",
    word_family: { noun: "jurisdiction", adjective: "jurisdictional" },
    collocations: ["legal jurisdiction", "within jurisdiction", "criminal jurisdiction", "jurisdiction over"],
    memory_hook: "JURY-diction — where the jury has authority.",
    saudi_context: "Special economic zones may have distinct regulatory jurisdiction.",
    topic_category: "legal",
  },
  {
    word: "mitigate",
    cefr_level: "C1.1",
    part_of_speech: "verb",
    definition: "To make something less harmful, serious, or painful.",
    definition_arabic: "يخفف / يقلل",
    pronunciation_ipa: "/ˈmɪt.ɪ.ɡeɪt/",
    example_sentence: "Firms adopted policies to mitigate environmental damage.",
    ielts_example:
      "Governments must mitigate climate risks through long-term investment in renewables.",
    word_family: { verb: "mitigate", noun: "mitigation", adjective: "mitigating" },
    collocations: ["mitigate risk", "mitigate impact", "mitigate effects", "mitigate damage"],
    memory_hook: "MILD-igate — make harm milder.",
    saudi_context: "Urban planners mitigate heat through shade structures and greenery.",
    topic_category: "professional",
  },
  {
    word: "pragmatic",
    cefr_level: "C1.1",
    part_of_speech: "adjective",
    definition: "Dealing with things sensibly and realistically in practical terms.",
    definition_arabic: "عملي / واقعي",
    pronunciation_ipa: "/præɡˈmæt.ɪk/",
    example_sentence: "A pragmatic approach helped the team finish on time.",
    ielts_example:
      "Pragmatic reforms often achieve more than idealistic but unworkable proposals.",
    word_family: { adjective: "pragmatic", noun: "pragmatism", adverb: "pragmatically" },
    collocations: ["pragmatic solution", "pragmatic approach", "pragmatic policy", "highly pragmatic"],
    memory_hook: "PRAG-ma-tic — practical, not just theory.",
    saudi_context: "Pragmatic training policies align skills with labour market needs.",
    topic_category: "business",
  },
  {
    word: "substantiate",
    cefr_level: "C1.1",
    part_of_speech: "verb",
    definition: "To provide evidence to support or prove the truth of something.",
    definition_arabic: "يُثبت / يدعم بالأدلة",
    pronunciation_ipa: "/səbˈstæn.ʃi.eɪt/",
    example_sentence: "Researchers must substantiate claims with reliable data.",
    ielts_example:
      "The author fails to substantiate the argument with peer-reviewed studies.",
    word_family: { verb: "substantiate", noun: "substantiation", adjective: "substantiated" },
    collocations: ["substantiate a claim", "substantiate allegations", "fully substantiated", "substantiate evidence"],
    memory_hook: "SUBSTANCE-iate — give substance with proof.",
    saudi_context: "Auditors substantiate financial reports before public release.",
    topic_category: "academic",
  },
  {
    word: "tenable",
    cefr_level: "C1.1",
    part_of_speech: "adjective",
    definition: "Able to be defended against attack or objection; reasonable.",
    definition_arabic: "دفاعي / معقول",
    pronunciation_ipa: "/ˈten.ə.bəl/",
    example_sentence: "The hypothesis is no longer tenable given new evidence.",
    ielts_example:
      "It is scarcely tenable to argue that technology alone can eliminate inequality.",
    word_family: { adjective: "tenable", adverb: "tenably", negative: "untenable" },
    collocations: ["tenable argument", "no longer tenable", "morally tenable", "barely tenable"],
    memory_hook: "TEN-able — can hold (ten) in debate.",
    saudi_context: "Analysts questioned whether the forecast remained tenable.",
    topic_category: "argument",
  },
  {
    word: "underpin",
    cefr_level: "C1.1",
    part_of_speech: "verb",
    definition: "To support or form the basis for an argument, theory, or system.",
    definition_arabic: "يرسخ / يدعم أساسًا",
    pronunciation_ipa: "/ˌʌn.dəˈpɪn/",
    example_sentence: "Strong institutions underpin sustainable economic growth.",
    ielts_example:
      "Empirical research underpins the policy recommendations in the white paper.",
    word_family: { verb: "underpin", noun: "underpinning" },
    collocations: ["underpin growth", "underpin the argument", "underpin policy", "theory underpins"],
    memory_hook: "UNDER-PIN — pin the foundation underneath.",
    saudi_context: "Education reform underpins long-term workforce development goals.",
    topic_category: "academic",
  },

  // C1.2 — 6 words
  {
    word: "articulate",
    cefr_level: "C1.2",
    part_of_speech: "verb",
    definition: "To express ideas or feelings fluently and coherently.",
    definition_arabic: "يعبّر بوضوح",
    pronunciation_ipa: "/ɑːˈtɪk.jə.leɪt/",
    example_sentence: "She articulated her concerns during the panel discussion.",
    ielts_example:
      "Candidates who articulate complex ideas clearly often score higher in speaking.",
    word_family: { verb: "articulate", adjective: "articulate", noun: "articulation" },
    collocations: ["articulate a view", "clearly articulate", "well articulated", "articulate concerns"],
    memory_hook: "ART-iculate — craft your thoughts like art.",
    saudi_context: "Graduates are trained to articulate proposals in international meetings.",
    topic_category: "fluency",
  },
  {
    word: "connotation",
    cefr_level: "C1.2",
    part_of_speech: "noun",
    definition: "An idea or feeling that a word invokes in addition to its literal meaning.",
    definition_arabic: "دلالة ضمنية",
    pronunciation_ipa: "/ˌkɒn.əˈteɪ.ʃən/",
    example_sentence: "The word 'cheap' has negative connotations in formal writing.",
    ielts_example:
      "Writers must consider the cultural connotations of politically charged terms.",
    word_family: { noun: "connotation", verb: "connote", adjective: "connotative" },
    collocations: ["negative connotation", "cultural connotation", "political connotation", "emotional connotation"],
    memory_hook: "CON-NOTE-ation — the note beyond the dictionary.",
    saudi_context: "Translators weigh connotations when adapting marketing slogans.",
    topic_category: "nuance",
  },
  {
    word: "discern",
    cefr_level: "C1.2",
    part_of_speech: "verb",
    definition: "To perceive or recognize something with difficulty or effort.",
    definition_arabic: "يميّز / يدرك",
    pronunciation_ipa: "/dɪˈsɜːn/",
    example_sentence: "Readers can discern bias in poorly sourced articles.",
    ielts_example:
      "It is difficult to discern long-term trends from short-term fluctuations.",
    word_family: { verb: "discern", noun: "discernment", adjective: "discernible" },
    collocations: ["discern a pattern", "difficult to discern", "discern the difference", "clearly discernible"],
    memory_hook: "dis-CERN — separate (CERN = sift) signal from noise.",
    saudi_context: "Investors discern opportunity amid shifting energy markets.",
    topic_category: "precision",
  },
  {
    word: "elucidate",
    cefr_level: "C1.2",
    part_of_speech: "verb",
    definition: "To make something clear; to explain.",
    definition_arabic: "يوضح / يشرح",
    pronunciation_ipa: "/ɪˈluː.sɪ.deɪt/",
    example_sentence: "The tutor elucidated the grammar rule with examples.",
    ielts_example:
      "The conclusion should elucidate how the findings answer the research question.",
    word_family: { verb: "elucidate", noun: "elucidation", adjective: "elucidative" },
    collocations: ["elucidate a point", "elucidate the issue", "further elucidate", "elucidate meaning"],
    memory_hook: "e-LUCID-ate — make lucid (clear).",
    saudi_context: "Workshops elucidate visa requirements for scholarship students.",
    topic_category: "academic",
  },
  {
    word: "nuanced",
    cefr_level: "C1.2",
    part_of_speech: "adjective",
    definition: "Characterized by subtle distinctions or variations.",
    definition_arabic: "دقيق / متعدد الأبعاد",
    pronunciation_ipa: "/ˈnjuː.ɑːnst/",
    example_sentence: "A nuanced essay acknowledges opposing viewpoints.",
    ielts_example:
      "Nuanced analysis distinguishes Band 8 writing from merely competent responses.",
    word_family: { adjective: "nuanced", noun: "nuance", verb: "nuance" },
    collocations: ["nuanced understanding", "nuanced view", "nuanced argument", "highly nuanced"],
    memory_hook: "NEW-anced — see the new shades of meaning.",
    saudi_context: "Media literacy teaches nuanced reading of online news.",
    topic_category: "nuance",
  },
  {
    word: "precursor",
    cefr_level: "C1.2",
    part_of_speech: "noun",
    definition: "A person or thing that comes before another of the same kind; a forerunner.",
    definition_arabic: "سابقة / مقدمة",
    pronunciation_ipa: "/priːˈkɜː.sər/",
    example_sentence: "Early prototypes were precursors to today's smartphones.",
    ielts_example:
      "The treaty is seen as a precursor to broader regional cooperation.",
    word_family: { noun: "precursor", adjective: "precursory" },
    collocations: ["precursor to", "early precursor", "historical precursor", "direct precursor"],
    memory_hook: "PRE-CURSOR — comes before the cursor moves.",
    saudi_context: "Pilot programmes acted as precursors to national digital services.",
    topic_category: "professional",
  },

  // C2.1 — 6 words
  {
    word: "paradigm",
    cefr_level: "C2.1",
    part_of_speech: "noun",
    definition: "A typical example or pattern of something; a worldview underlying theories.",
    definition_arabic: "نموذج / إطار فكري",
    pronunciation_ipa: "/ˈpær.ə.daɪm/",
    example_sentence: "The research challenged the dominant paradigm in linguistics.",
    ielts_example:
      "A paradigm shift in energy policy could reshape global carbon emissions within a decade.",
    word_family: { noun: "paradigm", adjective: "paradigmatic" },
    collocations: ["paradigm shift", "dominant paradigm", "new paradigm", "theoretical paradigm"],
    memory_hook: "PAIR-a-dime — a paired model you pay attention to.",
    saudi_context: "Vision 2030 represents a paradigm shift in Saudi economic planning.",
    topic_category: "academic",
  },
  {
    word: "salient",
    cefr_level: "C2.1",
    part_of_speech: "adjective",
    definition: "Most noticeable or important; prominent.",
    definition_arabic: "بارز / واضح",
    pronunciation_ipa: "/ˈseɪ.li.ənt/",
    example_sentence: "The most salient finding was the drop in youth unemployment.",
    ielts_example:
      "The report highlights several salient differences between urban and rural healthcare access.",
    word_family: { adjective: "salient", noun: "salience" },
    collocations: ["salient feature", "salient point", "particularly salient", "salient issue"],
    memory_hook: "SAIL-ient — stands out like a sail on the horizon.",
    saudi_context: "Water security remains a salient issue in arid regions of the Kingdom.",
    topic_category: "academic",
  },
  {
    word: "contention",
    cefr_level: "C2.1",
    part_of_speech: "noun",
    definition: "A heated disagreement; an assertion made in an argument.",
    definition_arabic: "جدال / ادعاء",
    pronunciation_ipa: "/kənˈten.ʃən/",
    example_sentence: "It is a widely held contention that early education shapes outcomes.",
    ielts_example:
      "The central contention of the essay is that regulation alone cannot solve the crisis.",
    word_family: { noun: "contention", verb: "contend", adjective: "contentious" },
    collocations: ["central contention", "bone of contention", "main contention", "point of contention"],
    memory_hook: "con-TENSION — tension in a debate.",
    saudi_context: "Labour market reform remains a point of contention among policymakers.",
    topic_category: "argument",
  },
  {
    word: "notwithstanding",
    cefr_level: "C2.1",
    part_of_speech: "preposition",
    definition: "In spite of; without being affected by.",
    definition_arabic: "على الرغم من",
    pronunciation_ipa: "/ˌnɒt.wɪðˈstæn.dɪŋ/",
    example_sentence: "Notwithstanding the delays, the project was completed on budget.",
    ielts_example:
      "Notwithstanding recent improvements, inequality persists in many developing economies.",
    word_family: { preposition: "notwithstanding" },
    collocations: ["notwithstanding the fact", "notwithstanding this", "notwithstanding concerns", "notwithstanding challenges"],
    memory_hook: "NOT-with-STANDING — still standing despite obstacles.",
    saudi_context: "Notwithstanding global volatility, the non-oil sector continued to grow.",
    topic_category: "formal",
  },
  {
    word: "juxtaposition",
    cefr_level: "C2.1",
    part_of_speech: "noun",
    definition: "The fact of placing two things close together for contrasting effect.",
    definition_arabic: "تقابل / موازنة",
    pronunciation_ipa: "/ˌdʒʌk.stə.pəˈzɪʃ.ən/",
    example_sentence: "The film uses juxtaposition of wealth and poverty to provoke debate.",
    ielts_example:
      "The juxtaposition of tradition and modernity defines many Gulf cities today.",
    word_family: { noun: "juxtaposition", verb: "juxtapose" },
    collocations: ["striking juxtaposition", "juxtaposition of", "visual juxtaposition", "ironic juxtaposition"],
    memory_hook: "JUXTA-pose — place side by side to compare.",
    saudi_context: "Riyadh's skyline offers a vivid juxtaposition of heritage and innovation.",
    topic_category: "discourse",
  },
  {
    word: "corroborate",
    cefr_level: "C2.1",
    part_of_speech: "verb",
    definition: "To confirm or give support to a statement, theory, or finding.",
    definition_arabic: "يؤكد / يدعم",
    pronunciation_ipa: "/kəˈrɒb.ə.reɪt/",
    example_sentence: "Witness testimony corroborated the investigator's conclusions.",
    ielts_example:
      "Independent datasets corroborate the claim that vaccination rates have plateaued.",
    word_family: { verb: "corroborate", noun: "corroboration", adjective: "corroborative" },
    collocations: ["corroborate evidence", "corroborate a claim", "corroborate findings", "fully corroborated"],
    memory_hook: "co-ROBBER-rate — others back up the story.",
    saudi_context: "Satellite imagery corroborated reports of agricultural expansion.",
    topic_category: "academic",
  },

  // C2.2 — 6 words
  {
    word: "ubiquitous",
    cefr_level: "C2.2",
    part_of_speech: "adjective",
    definition: "Present, appearing, or found everywhere.",
    definition_arabic: "منتشر في كل مكان",
    pronunciation_ipa: "/juːˈbɪk.wɪ.təs/",
    example_sentence: "Smartphones are ubiquitous among university students.",
    ielts_example:
      "Plastic waste has become ubiquitous in marine ecosystems worldwide.",
    word_family: { adjective: "ubiquitous", noun: "ubiquity", adverb: "ubiquitously" },
    collocations: ["ubiquitous presence", "increasingly ubiquitous", "ubiquitous technology", "ubiquitous influence"],
    memory_hook: "UBI-quit-us — everywhere (ubi = everywhere in Latin).",
    saudi_context: "Coffee culture is ubiquitous across Saudi cities and towns.",
    topic_category: "register",
  },
  {
    word: "hegemony",
    cefr_level: "C2.2",
    part_of_speech: "noun",
    definition: "Leadership or dominance, especially by one state or social group over others.",
    definition_arabic: "هيمنة",
    pronunciation_ipa: "/hɪˈɡem.ə.ni/",
    example_sentence: "Critics questioned the cultural hegemony of Western media.",
    ielts_example:
      "Economic hegemony can shape global trade rules for decades.",
    word_family: { noun: "hegemony", adjective: "hegemonic" },
    collocations: ["cultural hegemony", "economic hegemony", "political hegemony", "maintain hegemony"],
    memory_hook: "he-GEM-any — the gem everyone follows.",
    saudi_context: "Scholars debate the hegemony of English in international academia.",
    topic_category: "rhetoric",
  },
  {
    word: "ameliorate",
    cefr_level: "C2.2",
    part_of_speech: "verb",
    definition: "To make something bad or unsatisfactory better.",
    definition_arabic: "يُحسّن / يخفف",
    pronunciation_ipa: "/əˈmiːl.i.ə.reɪt/",
    example_sentence: "New policies aim to ameliorate living conditions in remote areas.",
    ielts_example:
      "Targeted subsidies may ameliorate the impact of rising food prices on low-income households.",
    word_family: { verb: "ameliorate", noun: "amelioration", adjective: "ameliorative" },
    collocations: ["ameliorate conditions", "ameliorate suffering", "ameliorate the situation", "ameliorate inequality"],
    memory_hook: "a-MEAL-iorate — a better meal makes life better.",
    saudi_context: "Green initiatives seek to ameliorate urban heat in desert cities.",
    topic_category: "professional",
  },
  {
    word: "circumvent",
    cefr_level: "C2.2",
    part_of_speech: "verb",
    definition: "To find a way around an obstacle or restriction; to bypass.",
    definition_arabic: "يتجنب / يتحايل على",
    pronunciation_ipa: "/ˌsɜː.kəmˈvent/",
    example_sentence: "Some firms circumvent regulations through offshore structures.",
    ielts_example:
      "Digital tools allow learners to circumvent traditional classroom constraints.",
    word_family: { verb: "circumvent", noun: "circumvention" },
    collocations: ["circumvent the law", "circumvent restrictions", "circumvent rules", "circumvent a problem"],
    memory_hook: "CIRCLE-vent — go around instead of through.",
    saudi_context: "Entrepreneurs must not circumvent labour laws when hiring staff.",
    topic_category: "legal",
  },
  {
    word: "rhetoric",
    cefr_level: "C2.2",
    part_of_speech: "noun",
    definition: "The art of effective or persuasive speaking or writing; language designed to persuade.",
    definition_arabic: "بلاغة / خطابة",
    pronunciation_ipa: "/ˈret.ər.ɪk/",
    example_sentence: "Political rhetoric often outpaces practical reform.",
    ielts_example:
      "The speech was admired for its rhetoric, yet critics questioned its substance.",
    word_family: { noun: "rhetoric", adjective: "rhetorical", adverb: "rhetorically" },
    collocations: ["political rhetoric", "empty rhetoric", "rhetorical device", "inflammatory rhetoric"],
    memory_hook: "RET-or-ic — return to classic persuasive speech.",
    saudi_context: "National addresses often blend rhetoric with policy announcements.",
    topic_category: "rhetoric",
  },
  {
    word: "idiosyncrasy",
    cefr_level: "C2.2",
    part_of_speech: "noun",
    definition: "A mode of behaviour or way of thought peculiar to an individual.",
    definition_arabic: "خصوصية / سمة فريدة",
    pronunciation_ipa: "/ˌɪd.i.əˈsɪŋ.krə.si/",
    example_sentence: "Every dialect has its own idiosyncrasies of grammar.",
    ielts_example:
      "Legal idiosyncrasies across jurisdictions complicate international contracts.",
    word_family: { noun: "idiosyncrasy", adjective: "idiosyncratic", adverb: "idiosyncratically" },
    collocations: ["personal idiosyncrasy", "cultural idiosyncrasy", "linguistic idiosyncrasy", "idiosyncratic style"],
    memory_hook: "IDIO-syncrasy — your own (idio) quirky sync.",
    saudi_context: "Regional idioms reflect idiosyncrasies of local Arabic influence on English.",
    topic_category: "idiomatic",
  },
];

function toDbRow(entry) {
  const collocations = entry.collocations
    .map((c) => String(c).trim())
    .filter(Boolean)
    .slice(0, 4);
  while (collocations.length < 4) {
    collocations.push(collocations[collocations.length - 1] || entry.word);
  }

  return {
    word: entry.word,
    cefr_level: entry.cefr_level,
    part_of_speech: entry.part_of_speech,
    definition: entry.definition,
    definition_arabic: entry.definition_arabic,
    pronunciation_ipa: entry.pronunciation_ipa,
    example_sentence: entry.example_sentence,
    ielts_example: entry.ielts_example,
    word_family: entry.word_family,
    collocations,
    memory_hook: entry.memory_hook,
    saudi_context: entry.saudi_context,
    topic_category: entry.topic_category,
  };
}

async function main() {
  if (STARTER_WORDS.length !== 74) {
    console.error(`Expected 74 starter words, found ${STARTER_WORDS.length}`);
    process.exit(1);
  }

  const url = getSupabaseUrl();
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: deleteError } = await supabase
    .from("vocabulary_words")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (deleteError) {
    console.error("Failed to clear vocabulary_words:", deleteError.message);
    process.exit(1);
  }

  const rows = STARTER_WORDS.map(toDbRow);
  const { data, error } = await supabase
    .from("vocabulary_words")
    .insert(rows)
    .select("id");

  if (error) {
    console.error("Insert failed:", error.message);
    process.exit(1);
  }

  const count = data?.length ?? rows.length;
  console.log(`✅ Seeded ${count} words successfully`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
