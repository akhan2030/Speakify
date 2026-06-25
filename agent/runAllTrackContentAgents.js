/**
 * Runs IELTS Accelerator (Foundation + Plus + Elite) + Vocabulary + Grammar agents.
 * Usage: node agent/runAllTrackContentAgents.js
 */

const { generateFoundationContent } = require("./acceleratorFoundationAgent.js");
const { generatePlusContent } = require("./acceleratorPlusAgent.js");
const { generateEliteContent } = require("./acceleratorEliteAgent.js");
const { runVocabularyGeneration } = require("./vocabularyAgent.js");
const { runGrammarGeneration } = require("./grammarAgent.js");

async function runAll() {
  console.log("🚀 Speakify — Full track content generation");
  console.log("   Accelerator (Foundation / Plus / Elite) + Vocabulary + Grammar\n");

  const steps = [
    { label: "Foundation track", fn: generateFoundationContent },
    { label: "Plus track", fn: generatePlusContent },
    { label: "Elite track", fn: generateEliteContent },
    { label: "Vocabulary bank", fn: runVocabularyGeneration },
    { label: "Grammar bank", fn: runGrammarGeneration },
  ];

  let totalGenerated = 0;
  let totalFailed = 0;

  for (const step of steps) {
    console.log(`\n📚 ${step.label}...`);
    try {
      const result = await step.fn();
      const gen = result?.tasksGenerated ?? 0;
      const fail = result?.tasksFailed ?? 0;
      totalGenerated += gen;
      totalFailed += fail;
      console.log(`   ✓ ${gen} generated, ${fail} failed/skipped`);
    } catch (err) {
      totalFailed += 1;
      console.error(`   ✗ Failed: ${err.message}`);
    }
  }

  console.log("\n========================================");
  console.log(`✅ Pipeline complete — ${totalGenerated} items generated, ${totalFailed} failures`);
  console.log("========================================");
}

runAll().catch((err) => {
  console.error("Pipeline failed:", err.message);
  process.exit(1);
});
