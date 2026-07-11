/**
 * Backfill generated_mock_tests rows with full JSON content + mock_number.
 * Usage: npx tsx scripts/backfillGeneratedMockContent.ts
 */
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { resolveAcademicMockBundle } from "../lib/mock-test/resolveFullMockContent";
import { getSkillVariantsForMock } from "../lib/mock-test/academicMockSkillVariants";

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

async function main() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: rows, error } = await supabase
    .from("generated_mock_tests")
    .select("*")
    .eq("test_type", "full_mock")
    .order("test_number", { ascending: true });

  if (error) throw error;

  for (const row of rows ?? []) {
    const mockNumber = row.mock_number ?? row.test_number ?? row.id;
    const bundle = resolveAcademicMockBundle({ ...row, mockNumber });
    const skills = getSkillVariantsForMock(mockNumber);
    const listeningParts = skills.listening;
    const readingJson = bundle.reading.reading;
    const topic =
      row.topic ??
      (Array.isArray(row.topics) && row.topics[0]) ??
      row.passage_1?.topic ??
      row.passage_1?.title ??
      `Mock ${mockNumber}`;

    const update = {
      mock_number: mockNumber,
      topic,
      reading: { passages: readingJson.passages, section: "reading" },
      listening: { parts: listeningParts, section: "listening" },
      writing: {
        section: "writing",
        task1: bundle.writing.task1,
        task2: bundle.writing.task2,
      },
      speaking: {
        section: "speaking",
        part1: { questions: bundle.speaking[0]?.questions ?? [] },
        part2: {
          cue_card: bundle.speaking[1]?.cueCard?.topic,
          bullet_points: bundle.speaking[1]?.cueCard?.bullets ?? [],
        },
        part3: { questions: bundle.speaking[2]?.questions ?? [] },
      },
      total_questions:
        (readingJson.totalQuestions ?? 0) +
        listeningParts.flatMap((p) => p.questions).length,
      status: row.status === "draft" ? "published" : row.status,
    };

    const { error: upErr } = await supabase
      .from("generated_mock_tests")
      .update(update)
      .eq("id", row.id);

    if (upErr) {
      console.error(`Failed id=${row.id}:`, upErr.message);
    } else {
      console.log(
        `Updated mock #${mockNumber} (id=${row.id}) — reading ${readingJson.totalQuestions}q, topic: ${topic}`
      );
    }
  }

  console.log("Backfill complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
