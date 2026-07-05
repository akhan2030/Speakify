/**
 * Seed 5 valid Section 3 bank rows with complete Q21–25 MCQ blocks.
 * Run: node scripts/seed-listening-s3-mcq-bank.mjs
 */
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { parseQuestionsJson } from "../lib/listeningContentPool.js";

dotenv.config({ path: ".env.local" });

const TOPICS = [
  "Dissertation proposal meeting",
  "Engineering design review",
  "Marketing campaign planning",
  "Ethics committee application",
  "Internship placement discussion",
];

function mcqQuestion(n, text, options, answer) {
  return {
    id: n - 20,
    questionNumber: n,
    type: "multiple-choice",
    text,
    options: options.map(([label, optionText]) => ({ label, text: optionText })),
    answer,
    wordLimit: "",
    explanation: "",
  };
}

function buildQuestions(topic) {
  const base = [
    mcqQuestion(
      21,
      `What do the students agree is the main challenge in the ${topic.toLowerCase()}?`,
      [
        ["A", "Limited time to complete tasks"],
        ["B", "Conflicting feedback from supervisors"],
        ["C", "Lack of interest in the topic"],
      ],
      "B"
    ),
    mcqQuestion(
      22,
      "What deadline do they mention for the first draft?",
      [
        ["A", "End of this month"],
        ["B", "Middle of next month"],
        ["C", "Start of next semester"],
      ],
      "A"
    ),
    mcqQuestion(
      23,
      "Which resource do they plan to use for research?",
      [
        ["A", "University library databases"],
        ["B", "Social media surveys only"],
        ["C", "Personal blogs"],
      ],
      "A"
    ),
    mcqQuestion(
      24,
      "What does the tutor recommend for managing workload?",
      [
        ["A", "Working without breaks"],
        ["B", "Using a shared task list"],
        ["C", "Delaying all meetings"],
      ],
      "B"
    ),
    mcqQuestion(
      25,
      "What format will they use for the presentation?",
      [
        ["A", "A ten-minute oral summary"],
        ["B", "A written report only"],
        ["C", "An ungraded group chat"],
      ],
      "A"
    ),
  ];

  const matching = [26, 27, 28, 29, 30].map((n, i) => ({
    id: n - 20,
    questionNumber: n,
    type: "matching",
    text: `Match the task to the student responsible (Question ${n}).`,
    options: [
      { label: "A", text: "Literature review" },
      { label: "B", text: "Data collection" },
      { label: "C", text: "Presentation slides" },
      { label: "D", text: "Ethics form" },
      { label: "E", text: "Final proofreading" },
    ],
    answer: ["A", "B", "C", "D", "E"][i],
    wordLimit: "",
    explanation: "",
  }));

  return [...base, ...matching];
}

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  return createClient(url, process.env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function main() {
  const supabase = getSupabase();
  const generationDate = new Date().toISOString().slice(0, 10);
  let saved = 0;

  for (let i = 0; i < TOPICS.length; i += 1) {
    const topic = TOPICS[i];
    const testNumber = 100 + i;
    const questions = buildQuestions(topic);
    const payload = {
      title: `Section 3 — ${topic}`,
      topic,
      section: 3,
      speakers: [
        { label: "Tutor", name: "Dr Morgan" },
        { label: "Student A", name: "Elena" },
        { label: "Student B", name: "Sam" },
      ],
      questionType: "multiple-choice",
      wordLimit: "NO MORE THAN TWO WORDS AND/OR A NUMBER",
      items: questions,
    };

    const { error } = await supabase.from("generated_listening_tests").insert({
      generation_date: generationDate,
      content_type: "section_practice",
      test_number: testNumber,
      section_number: 3,
      transcript: `Tutor: Welcome everyone. Today we're discussing ${topic.toLowerCase()}.\nStudent A: The main challenge is conflicting feedback from supervisors.\nStudent B: We need the first draft by the end of this month.\n[SECTION BREAK]\nStudent A: I'll handle the literature review.\nStudent B: I'll collect the data.`,
      questions: payload,
      used: false,
      topic,
      topics: [topic],
      is_available: true,
      total_questions: 10,
      section_1: {},
      section_2: {},
      section_3: {},
      section_4: {},
    });

    if (error) {
      console.error(`FAIL set ${testNumber}:`, error.message);
      continue;
    }
    saved += 1;
    console.log(`Saved S3 seed row test_number=${testNumber} (${topic})`);
  }

  console.log(`\nDone: ${saved}/${TOPICS.length} rows seeded for ${generationDate}`);
  process.exit(saved >= 1 ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
