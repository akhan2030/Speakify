/**
 * Patch mock #2 passage_2 to 13 heading questions (40 total reading).
 * Usage: npx tsx scripts/patchMock2Reading40.ts
 */
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { resolveAcademicMockBundle } from "../lib/mock-test/resolveFullMockContent";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const EXTRA_QUESTIONS = [
  {
    id: 11,
    text: "Homogeneous goods and price-taking firms",
    type: "heading",
    answer: "B",
    options: [],
    explanation:
      "Paragraph B describes perfect competition with homogeneous products and firms that cannot set prices.",
    questionNumber: 11,
  },
  {
    id: 12,
    text: "High entry barriers and mutual firm dependence",
    type: "heading",
    answer: "D",
    options: [],
    explanation:
      "Paragraph D explains oligopoly interdependence and barriers that block new entrants.",
    questionNumber: 12,
  },
  {
    id: 13,
    text: "Allocative efficiency versus deadweight loss",
    type: "heading",
    answer: "F",
    options: [],
    explanation:
      "Paragraph F contrasts efficient perfect competition with welfare loss under monopoly.",
    questionNumber: 13,
  },
];

async function main() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error("Missing Supabase env");

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: row, error } = await supabase
    .from("generated_mock_tests")
    .select("*")
    .eq("id", 8)
    .single();

  if (error || !row) throw error ?? new Error("Mock id=8 not found");

  const passage2 = row.passage_2 as Record<string, unknown>;
  const questions = Array.isArray(passage2.questions)
    ? [...(passage2.questions as object[])]
    : [];

  if (questions.length >= 13) {
    console.log(`passage_2 already has ${questions.length} questions — skipping insert`);
  } else {
    for (const q of EXTRA_QUESTIONS) {
      if (!questions.some((x) => (x as { id?: number }).id === q.id)) {
        questions.push(q);
      }
    }
    passage2.questions = questions;
  }

  const { reading: _staleReading, ...rowWithoutReading } = row;
  const bundle = resolveAcademicMockBundle({
    ...rowWithoutReading,
    passage_2: passage2,
    mock_number: 2,
  });
  const readingJson = bundle.reading.reading;

  const { error: upErr } = await supabase
    .from("generated_mock_tests")
    .update({
      passage_2: passage2,
      reading: { passages: readingJson.passages, section: "reading" },
      total_questions:
        (readingJson.totalQuestions ?? 0) +
        bundle.listening.flatMap((p) => p.questions).length,
    })
    .eq("id", 8);

  if (upErr) throw upErr;

  console.log(
    `Mock #2 reading now ${readingJson.totalQuestions} questions (passage_2: ${questions.length})`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
