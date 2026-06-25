/**
 * Runs all 3 IELTS Accelerator content agents in sequence.
 * Usage: node agent/runAllAcceleratorAgents.js
 */

const { generateFoundationContent } = require("./acceleratorFoundationAgent.js");
const { generatePlusContent } = require("./acceleratorPlusAgent.js");
const { generateEliteContent } = require("./acceleratorEliteAgent.js");

async function runAll() {
  console.log("🚀 Starting Speakify IELTS Accelerator content generation...");

  console.log("📚 Generating Foundation track content...");
  const foundation = await generateFoundationContent();
  console.log(`   → ${foundation.tasksGenerated} published, ${foundation.tasksFailed} failed`);

  console.log("📚 Generating Plus track content...");
  const plus = await generatePlusContent();
  console.log(`   → ${plus.tasksGenerated} published, ${plus.tasksFailed} failed`);

  console.log("📚 Generating Elite track content...");
  const elite = await generateEliteContent();
  console.log(`   → ${elite.tasksGenerated} published, ${elite.tasksFailed} failed`);

  const total =
    foundation.tasksGenerated + plus.tasksGenerated + elite.tasksGenerated;
  const failed =
    foundation.tasksFailed + plus.tasksFailed + elite.tasksFailed;

  console.log("========================================");
  console.log(`✅ All agents finished — ${total} content sets published, ${failed} failed`);
  console.log("========================================");

  if (failed > 0 && total === 0) process.exit(1);
}

runAll().catch((err) => {
  console.error("❌ Accelerator generation failed:", err.message);
  process.exit(1);
});
