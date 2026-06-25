import type { Band, Question } from "../types";

type ListenItem = {
  band: Band;
  topic: string;
  question: string;
  correct: string;
  options?: string[];
  transcript: string;
  saudiTrap?: string;
};

const LISTENING_ITEMS: ListenItem[] = [
  {
    band: 4.0,
    topic: "education",
    question: "Listen: What time does the library close on Thursday?",
    options: ["6 pm", "8 pm", "9 pm", "10 pm"],
    correct: "8 pm",
    transcript:
      "Student: Excuse me, is the library open late on Thursday? Staff: Yes, we close at eight pm on Thursdays, but at six pm on Fridays.",
    saudiTrap: "Missing pm/am distinction in notes.",
  },
  {
    band: 4.0,
    topic: "health",
    question: "Listen: Which floor is the pharmacy on?",
    options: ["Ground", "First", "Second", "Third"],
    correct: "Ground",
    transcript:
      "Reception: The pharmacy is on the ground floor, next to the café. Wards are on the second floor.",
  },
  {
    band: 4.5,
    topic: "urbanization",
    question: "Listen: How much is the metro day pass?",
    options: ["10 SAR", "15 SAR", "20 SAR", "25 SAR"],
    correct: "15 SAR",
    transcript:
      "Agent: A single ride is ten riyals, but the day pass is fifteen and covers all lines until midnight.",
  },
  {
    band: 4.5,
    topic: "technology",
    question: "Listen: What is the Wi-Fi password for guests?",
    options: ["Guest2024", "Guest2025", "Welcome1", "Library1"],
    correct: "Guest2025",
    transcript:
      "Host: Please use network SpeakifyGuest. The password is Guest2025, all one word.",
  },
  {
    band: 5.0,
    topic: "environment",
    question: "Listen: When is the recycling collection?",
    options: ["Monday", "Wednesday", "Friday", "Sunday"],
    correct: "Wednesday",
    transcript:
      "Announcement: Household recycling is collected every Wednesday morning. General waste is Sunday.",
  },
  {
    band: 5.0,
    topic: "education",
    question: "Listen: Which module is compulsory?",
    options: ["Research Methods", "Art History", "Sports Science", "Music"],
    correct: "Research Methods",
    transcript:
      "Advisor: Research Methods is compulsory for all foundation students. Art History is optional.",
  },
  {
    band: 5.5,
    topic: "Vision2030",
    question: "Listen: What percentage target is mentioned for non-oil GDP?",
    options: ["40%", "50%", "60%", "70%"],
    correct: "50%",
    transcript:
      "Speaker: The plan aims to raise the non-oil share of GDP to fifty percent by the end of the decade.",
  },
  {
    band: 5.5,
    topic: "health",
    question: "Listen: How long should patients fast before the blood test?",
    options: ["6 hours", "8 hours", "10 hours", "12 hours"],
    correct: "8 hours",
    transcript:
      "Nurse: Please fast for eight hours before the test. Water is fine, but no food or sugary drinks.",
  },
  {
    band: 6.0,
    topic: "education",
    question: "Listen (monologue): What is the speaker's main point about spaced repetition?",
    options: [
      "It improves long-term recall",
      "It replaces all lectures",
      "It is outdated",
      "It only helps children",
    ],
    correct: "It improves long-term recall",
    transcript:
      "Lecturer: Studies consistently show that spacing study sessions strengthens long-term recall more than cramming the night before an exam.",
  },
  {
    band: 6.0,
    topic: "technology",
    question: "Listen: Why was the startup's pilot delayed?",
    options: [
      "Data privacy review",
      "Lack of office space",
      "Marketing budget cut",
      "Founder illness",
    ],
    correct: "Data privacy review",
    transcript:
      "CEO: We delayed the pilot because regulators requested an additional data privacy review, which should finish next month.",
  },
  {
    band: 6.5,
    topic: "environment",
    question: "Listen: What concern does the scientist raise about carbon offsets?",
    options: [
      "Verification can be weak",
      "They are always cheap",
      "They ban renewables",
      "They increase oil use",
    ],
    correct: "Verification can be weak",
    transcript:
      "Scientist: Offsets can help, but verification is often weak, so emissions may not truly fall.",
  },
  {
    band: 6.5,
    topic: "urbanization",
    question: "Listen: The planner emphasises mixed-use zones primarily to ___",
    options: [
      "reduce car dependency",
      "eliminate schools",
      "ban public transport",
      "increase parking minimums",
    ],
    correct: "reduce car dependency",
    transcript:
      "Planner: Mixed-use zones shorten trips and reduce car dependency, especially when paired with reliable transit.",
  },
  {
    band: 7.0,
    topic: "education",
    question: "Listen (academic): The tutor's attitude toward bilingual code-switching is ___",
    options: ["generally positive", "hostile", "confused", "silent"],
    correct: "generally positive",
    transcript:
      "Tutor: Strategic code-switching can support comprehension; it is not automatically a sign of weak proficiency.",
  },
  {
    band: 7.0,
    topic: "health",
    question: "Listen: Telemedicine growth is limited mainly by ___",
    options: [
      "broadband inequality",
      "patient happiness",
      "too many doctors",
      "lack of diseases",
    ],
    correct: "broadband inequality",
    transcript:
      "Researcher: Adoption rises where broadband is reliable; rural inequality remains the main bottleneck.",
  },
  {
    band: 7.5,
    topic: "technology",
    question: "Listen (debate): Speaker A's central claim is that AI hiring tools ___",
    options: [
      "need transparent audits",
      "should be banned immediately",
      "never use data",
      "replace all interviews today",
    ],
    correct: "need transparent audits",
    transcript:
      "Speaker A: Without transparent audits, hiring algorithms risk scaling hidden bias. Speaker B: Audits help, but representative data matter too.",
  },
  {
    band: 7.5,
    topic: "environment",
    question: "Listen (debate): Speaker B disagrees with A mainly on ___",
    options: [
      "the role of data quality",
      "the existence of climate change",
      "the price of solar",
      "the need for any policy",
    ],
    correct: "the role of data quality",
    transcript:
      "Speaker B: Audits are necessary, yet biased training data can undermine fairness even with transparency.",
  },
  {
    band: 8.0,
    topic: "technology",
    question: "Listen (debate): Both speakers would likely agree that ___",
    options: [
      "institutional safeguards matter",
      "algorithms are always fair",
      "literacy is irrelevant",
      "regulation should end",
    ],
    correct: "institutional safeguards matter",
    transcript:
      "Speaker A: Safeguards and public literacy are essential. Speaker B: I agree safeguards matter, though implementation must include diverse languages.",
  },
  {
    band: 8.0,
    topic: "education",
    question: "Listen (debate): The overlap in their views concerns ___",
    options: [
      "governance not hype",
      "abolishing universities",
      "rejecting all AI",
      "ignoring ethics",
    ],
    correct: "governance not hype",
    transcript:
      "Speaker A: Policy must target governance, not marketing hype. Speaker B: Precisely—ethics boards should co-design deployment.",
  },
];

export function buildListeningQuestions(): Question[] {
  const base: Question[] = LISTENING_ITEMS.map((item, i) => ({
    id: `listen-${item.band}-${String(i + 1).padStart(2, "0")}`,
    section: "listening",
    band: item.band,
    type: "mcq" as const,
    question: item.question,
    options: item.options,
    correct: item.correct,
    explanation: `Transcript: ${item.transcript}`,
    audioScript: item.transcript,
    saudiTrap: item.saudiTrap,
    topic: item.topic,
  }));

  const bands = [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0] as const;
  const topics = [
    "education",
    "technology",
    "environment",
    "health",
    "urbanization",
    "Vision2030",
  ];

  while (base.length < 40) {
    const n = base.length + 1;
    const band = bands[n % bands.length];
    const topic = topics[n % topics.length];
    const transcript = `Speaker: This is a placement listening item about ${topic}. The main topic discussed is ${topic}.`;
    base.push({
      id: `listen-pad-${n}`,
      section: "listening",
      band,
      type: "mcq",
      question: `Listen: What is the main topic of the talk? (${topic})`,
      options: [
        topic,
        "unrelated sports",
        "cooking recipes",
        "ancient history",
      ],
      correct: topic,
      explanation: `Transcript: ${transcript}`,
      audioScript: transcript,
      topic,
    });
  }
  return base.slice(0, 40);
}
