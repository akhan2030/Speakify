import "dotenv/config";
import { config } from "dotenv";
import { generateLessonContentWithAI } from "../lib/pathway/generateLessonContent.ts";

config({ path: ".env.local" });

async function main() {
  console.log("Testing Monday lesson generation...");
  const content = await generateLessonContentWithAI({
    dayType: "input",
    cefrCode: "B1.1",
    week: 1,
    focusAreas: "Academic vocabulary, formal writing",
  });
  const vocab = content.vocabulary;
  console.log("vocab count:", vocab?.length);
  console.log(
    "sample words:",
    vocab?.slice(0, 5).map((v) => v.word)
  );
  console.log("grammarTitle:", content.grammarTitle);
  console.log("passage length:", String(content.passage ?? "").length);
  console.log("SUCCESS");
}

main().catch((e) => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
