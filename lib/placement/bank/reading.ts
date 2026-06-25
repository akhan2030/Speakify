import type { Band, Question } from "../types";

type PassageBlock = {
  id: string;
  title: string;
  bandRange: Band[];
  text: string;
  topic: string;
  questions: {
    band: Band;
    type?: Question["type"];
    question: string;
    options?: string[];
    correct: string;
    explanation: string;
    saudiTrap?: string;
    topic?: string;
  }[];
};

const PASSAGES: PassageBlock[] = [
  {
    id: "p1",
    title: "Gulf Education Reform",
    bandRange: [4.0, 4.5, 5.0],
    topic: "education",
    text: `Gulf countries are investing heavily in schools and universities. Many students now study STEM subjects. Scholarships help young people study abroad and return with new skills. Teachers receive training in digital tools. Parents support homework apps that track progress. However, some rural schools still need better internet. Governments hope graduates will work in growing tech sectors.`,
    questions: [
      {
        band: 4.0,
        type: "mcq",
        question: "What is the main idea of the passage?",
        options: [
          "Gulf nations are improving education with technology and training",
          "Parents dislike homework apps",
          "All rural schools have fast internet",
          "Students refuse to study STEM",
        ],
        correct: "Gulf nations are improving education with technology and training",
        explanation: "The passage describes reforms, STEM focus, training, and remaining challenges.",
      },
      {
        band: 4.5,
        type: "mcq",
        question: "Scholarships mainly help students to ___. ",
        options: [
          "study abroad and gain skills",
          "avoid university",
          "work immediately",
          "stop using technology",
        ],
        correct: "study abroad and gain skills",
        explanation: "Explicit: study abroad and return with new skills.",
      },
      {
        band: 5.0,
        type: "mcq",
        question: "The writer's attitude toward digital tools is best described as:",
        options: ["generally positive", "strongly negative", "uncertain", "amused"],
        correct: "generally positive",
        explanation: "Training in digital tools and homework apps are presented favourably.",
        saudiTrap: "Choosing extreme attitudes not supported by mild positive tone.",
      },
      {
        band: 4.0,
        type: "mcq",
        question: "In context, 'track' is closest to:",
        options: ["monitor", "run away", "draw", "hide"],
        correct: "monitor",
        explanation: "Track progress = monitor progress.",
      },
      {
        band: 5.0,
        type: "mcq",
        question: "Text structure: the final sentence mainly ___",
        options: [
          "states a future goal",
          "contradicts the first sentence",
          "introduces a new unrelated topic",
          "quotes a student",
        ],
        correct: "states a future goal",
        explanation: "Governments hope graduates will work in tech = forward-looking goal.",
      },
      {
        band: 4.5,
        type: "mcq",
        question: "It can be inferred that rural schools ___",
        options: [
          "lag behind in connectivity",
          "have the best teachers",
          "do not use STEM",
          "reject scholarships",
        ],
        correct: "lag behind in connectivity",
        explanation: "Some rural schools still need better internet.",
        topic: "education",
      },
    ],
  },
  {
    id: "p2",
    title: "Climate Policy Basics",
    bandRange: [4.5, 5.0, 5.5],
    topic: "environment",
    text: `Countries meet each year to discuss carbon emissions. Rich nations promise funds for clean energy in developing states. Solar panels are cheaper than ten years ago. Cities plant trees to reduce heat. Some companies still pollute rivers, and fines are increasing. Scientists say targets must be met by 2030. Citizens can help by saving electricity at home.`,
    questions: [
      {
        band: 4.5,
        type: "mcq",
        question: "Solar panels are now ___ than before.",
        options: ["cheaper", "illegal", "rare", "heavier"],
        correct: "cheaper",
        explanation: "Explicit comparison in text.",
      },
      {
        band: 5.0,
        type: "mcq",
        question: "The passage suggests companies pollute because ___",
        options: [
          "some still do and face fines",
          "fines stopped pollution completely",
          "trees cause pollution",
          "scientists pollute rivers",
        ],
        correct: "some still do and face fines",
        explanation: "Some companies still pollute; fines are increasing.",
      },
      {
        band: 5.5,
        type: "mcq",
        question: "Writer's attitude to citizen action is:",
        options: ["supportive", "hostile", "indifferent", "sarcastic"],
        correct: "supportive",
        explanation: "Citizens can help by saving electricity.",
      },
      {
        band: 5.0,
        type: "mcq",
        question: "Main purpose of the passage:",
        options: [
          "outline simple climate actions and policies",
          "criticise all developing nations",
          "describe space travel",
          "reject renewable energy",
        ],
        correct: "outline simple climate actions and policies",
        explanation: "Covers meetings, funding, solar, trees, fines, targets, citizens.",
      },
      {
        band: 4.5,
        type: "mcq",
        question: "'Targets' in the last scientific sentence refers to ___",
        options: ["emission goals", "tree prices", "company profits", "school exams"],
        correct: "emission goals",
        explanation: "Context: carbon emissions and 2030 deadlines.",
      },
      {
        band: 5.5,
        type: "mcq",
        question: "Structure: the passage moves from global policy to ___",
        options: [
          "individual behaviour",
          "sports",
          "grammar rules",
          "oceanography only",
        ],
        correct: "individual behaviour",
        explanation: "Ends with citizens saving electricity at home.",
      },
    ],
  },
  {
    id: "p3",
    title: "Urban Life in the Gulf",
    bandRange: [5.0, 5.5, 5.5],
    topic: "urbanization",
    text: `Metro lines and bus lanes reduce traffic in major Gulf cities. Mixed neighbourhoods combine shops, homes, and offices. Young professionals prefer apartments near workplaces. Weekend markets attract families. City planners use data to place hospitals and schools. Still, summer heat limits walking, so shaded walkways are expanding. Affordable housing remains a challenge for new graduates.`,
    questions: [
      {
        band: 5.0,
        type: "mcq",
        question: "According to the passage, shaded walkways address ___",
        options: ["heat limiting walking", "lack of schools", "metro costs", "weekend markets"],
        correct: "heat limiting walking",
        explanation: "Summer heat limits walking; shaded walkways expanding.",
      },
      {
        band: 5.5,
        type: "mcq",
        question: "The writer implies planners rely on ___",
        options: ["data", "luck", "tourism only", "foreign languages"],
        correct: "data",
        explanation: "Planners use data to place hospitals and schools.",
      },
      {
        band: 5.0,
        type: "mcq",
        question: "Main idea:",
        options: [
          "Gulf cities are redesigning urban spaces with mixed use and transport",
          "Graduates refuse apartments",
          "Markets are banned",
          "Heat has ended in cities",
        ],
        correct: "Gulf cities are redesigning urban spaces with mixed use and transport",
        explanation: "Summarises transport, mixed use, planning, heat, housing.",
      },
      {
        band: 5.5,
        type: "mcq",
        question: "Affordable housing is ___ for graduates.",
        options: ["a challenge", "guaranteed", "illegal", "unnecessary"],
        correct: "a challenge",
        explanation: "Explicit final sentence.",
      },
      {
        band: 5.0,
        type: "mcq",
        question: "Inference: young professionals value ___",
        options: ["proximity to work", "rural isolation", "long commutes", "no public transport"],
        correct: "proximity to work",
        explanation: "Prefer apartments near workplaces.",
      },
      {
        band: 5.5,
        type: "mcq",
        question: "Vocabulary: 'mixed neighbourhoods' suggests ___",
        options: ["combined land uses", "only factories", "empty deserts", "online only"],
        correct: "combined land uses",
        explanation: "Shops, homes, and offices combined.",
      },
    ],
  },
  {
    id: "p4",
    title: "Cognitive Science and Learning",
    bandRange: [6.0, 6.5, 7.0],
    topic: "education",
    text: `Cognitive science examines how memory, attention, and motivation interact in learning. Spaced repetition strengthens long-term recall more than cramming. Retrieval practice—testing oneself—outperforms passive re-reading. Multitasking fragments attention and lowers comprehension. Bilingual learners may code-switch strategically, which does not necessarily indicate confusion. Educators who align tasks with working-memory limits see fewer errors. Neuroimaging reveals that sleep consolidates procedural skills. Critics warn against overselling 'brain-based' products without peer-reviewed evidence.`,
    questions: [
      {
        band: 6.0,
        type: "mcq",
        question: "The passage primarily ___",
        options: [
          "summarises evidence-based learning strategies",
          "promotes untested products",
          "rejects bilingualism",
          "denies the role of sleep",
        ],
        correct: "summarises evidence-based learning strategies",
        explanation: "Covers spaced repetition, retrieval, multitasking, sleep, caution.",
      },
      {
        band: 6.5,
        type: "mcq",
        question: "Writer's attitude to 'brain-based' products is ___",
        options: ["cautious", "enthusiastic", "neutral", "hostile to all science"],
        correct: "cautious",
        explanation: "Critics warn against overselling without peer review.",
      },
      {
        band: 7.0,
        type: "mcq",
        question: "Code-switching is presented as ___",
        options: [
          "potentially strategic",
          "always a sign of confusion",
          "unrelated to bilingualism",
          "forbidden in classrooms",
        ],
        correct: "potentially strategic",
        explanation: "May code-switch strategically; not necessarily confusion.",
      },
      {
        band: 6.0,
        type: "mcq",
        question: "Inference: cramming is ___ spaced repetition for long-term recall.",
        options: ["inferior to", "superior to", "identical to", "unrelated to"],
        correct: "inferior to",
        explanation: "Spaced repetition strengthens recall more than cramming.",
      },
      {
        band: 6.5,
        type: "mcq",
        question: "Structure: final sentence functions to ___",
        options: ["add a qualification", "introduce a case study", "change topic to sports", "quote law"],
        correct: "add a qualification",
        explanation: "Critics warn = limits/brain-based marketing caveat.",
      },
      {
        band: 7.0,
        type: "mcq",
        question: "'Retrieval practice' means ___",
        options: ["self-testing", "skimming only", "sleeping", "drawing maps"],
        correct: "self-testing",
        explanation: "Defined as testing oneself.",
      },
    ],
  },
  {
    id: "p5",
    title: "Economic Diversification",
    bandRange: [6.5, 7.0, 7.5],
    topic: "Vision2030",
    text: `Economic diversification reduces dependence on volatile commodity prices. Non-oil GDP share has risen where logistics, tourism, and fintech expanded. Regulatory sandboxes let startups test products under supervision. Human-capital investment—vocational tracks aligned with industry—raises productivity. Nevertheless, labour-market mismatch persists: graduates may lack applied skills employers demand. Foreign direct investment flows respond to governance indicators and contract enforcement. Long-term success requires innovation ecosystems, not only infrastructure megaprojects.`,
    questions: [
      {
        band: 6.5,
        type: "mcq",
        question: "Main argument:",
        options: [
          "Diversification needs skills, governance, and innovation—not only infrastructure",
          "Oil prices are stable forever",
          "Tourism harms logistics",
          "Graduates have too many applied skills",
        ],
        correct: "Diversification needs skills, governance, and innovation—not only infrastructure",
        explanation: "Final sentence emphasises ecosystems; text notes skills mismatch.",
      },
      {
        band: 7.0,
        type: "mcq",
        question: "Labour-market mismatch implies ___",
        options: [
          "skills supply does not meet employer demand",
          "universities should close",
          "FDI is illegal",
          "vocational tracks ended",
        ],
        correct: "skills supply does not meet employer demand",
        explanation: "Graduates may lack applied skills employers demand.",
      },
      {
        band: 7.5,
        type: "mcq",
        question: "Writer's attitude to megaprojects alone is ___",
        options: ["critical/insufficient", "fully sufficient", "unmentioned", "celebratory only"],
        correct: "critical/insufficient",
        explanation: "Success requires ecosystems, not only megaprojects.",
      },
      {
        band: 6.5,
        type: "mcq",
        question: "Regulatory sandboxes allow startups to ___",
        options: [
          "test products under supervision",
          "avoid all rules",
          "export oil",
          "ignore contracts",
        ],
        correct: "test products under supervision",
        explanation: "Explicit definition in passage.",
      },
      {
        band: 7.0,
        type: "mcq",
        question: "FDI flows are influenced by ___",
        options: [
          "governance and contract enforcement",
          "weather only",
          "social media trends only",
          "sports events",
        ],
        correct: "governance and contract enforcement",
        explanation: "Respond to governance indicators and contract enforcement.",
      },
      {
        band: 7.5,
        type: "mcq",
        question: "Text structure progresses from definition to ___",
        options: [
          "conditions for sustained diversification",
          "recipe for coffee",
          "grammar quiz",
          "ocean tides",
        ],
        correct: "conditions for sustained diversification",
        explanation: "Moves through sectors, skills, FDI, innovation ecosystems.",
      },
    ],
  },
  {
    id: "p6",
    title: "AI and Society",
    bandRange: [7.5, 8.0, 8.0],
    topic: "technology",
    text: `Artificial-intelligence systems increasingly mediate hiring, credit scoring, and medical triage. Proponents argue algorithms can reduce human bias when datasets are representative and audits are transparent. Skeptics counter that opaque models may entrench historical inequities and that consent frameworks lag behind deployment. Interdisciplinary governance—combining ethicists, engineers, and regulators—is urged. Linguistic diversity poses additional challenges: low-resource languages risk under-served communities. The passage does not claim technology is inherently benevolent; instead, outcomes depend on institutional safeguards and public literacy.`,
    questions: [
      {
        band: 7.5,
        type: "mcq",
        question: "The author's stance is best described as ___",
        options: [
          "conditional on safeguards and literacy",
          "uncritically pro-AI",
          "rejecting all algorithms",
          "ignoring ethics",
        ],
        correct: "conditional on safeguards and literacy",
        explanation: "Outcomes depend on safeguards and literacy; not inherently benevolent.",
      },
      {
        band: 8.0,
        type: "mcq",
        question: "Skeptics worry opaque models may ___",
        options: [
          "entrench inequities",
          "eliminate all bias instantly",
          "increase linguistic diversity automatically",
          "remove need for regulators",
        ],
        correct: "entrench inequities",
        explanation: "May entrench historical inequities.",
      },
      {
        band: 7.5,
        type: "mcq",
        question: "Main idea:",
        options: [
          "AI social impact hinges on governance, data, and inclusion",
          "AI replaces all jobs tomorrow",
          "Low-resource languages dominate AI",
          "Consent frameworks are ahead of deployment",
        ],
        correct: "AI social impact hinges on governance, data, and inclusion",
        explanation: "Covers bias, audits, consent, governance, linguistic diversity.",
      },
      {
        band: 8.0,
        type: "mcq",
        question: "Inference: low-resource languages may lead to ___",
        options: [
          "under-served communities",
          "perfect fairness",
          "no need for ethicists",
          "mandatory monolingualism",
        ],
        correct: "under-served communities",
        explanation: "Risk under-served communities.",
      },
      {
        band: 7.5,
        type: "mcq",
        question: "Word 'opaque' suggests models are ___",
        options: ["not fully transparent", "always illegal", "purely visual", "manual only"],
        correct: "not fully transparent",
        explanation: "Opposite of transparent audits.",
      },
      {
        band: 8.0,
        type: "mcq",
        question: "Final sentence mainly ___",
        options: [
          "qualifies earlier claims about technology",
          "introduces hiring statistics",
          "defines Arabic grammar",
          "promotes a product",
        ],
        correct: "qualifies earlier claims about technology",
        explanation: "Does not claim benevolence; outcomes depend on safeguards.",
      },
    ],
  },
];

export function buildReadingQuestions(): Question[] {
  const out: Question[] = [];
  for (const passage of PASSAGES) {
    passage.questions.forEach((q, i) => {
      out.push({
        id: `read-${passage.id}-q${i + 1}`,
        section: "reading",
        band: q.band,
        type: (q.type ?? "mcq") as Question["type"],
        question: `【${passage.title}】\n${passage.text}\n\n${q.question}`,
        options: q.options,
        correct: q.correct,
        explanation: q.explanation,
        saudiTrap: q.saudiTrap,
        topic: passage.topic,
      });
    });
  }
  while (out.length < 40) {
    const n = out.length + 1;
    out.push({
      id: `read-pad-${n}`,
      section: "reading",
      band: 6.0,
      type: "mcq",
      question:
        "【Supplementary】Researchers note that policy papers often use hedging language. The author's primary purpose is usually to:",
      options: [
        "present a balanced claim",
        "tell a fictional story",
        "list vocabulary only",
        "avoid any evidence",
      ],
      correct: "present a balanced claim",
      explanation: "Academic policy texts hedge claims.",
      topic: "education",
    });
  }
  return out.slice(0, 40);
}
