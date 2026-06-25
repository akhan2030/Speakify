/**

 * IELTS Accelerator Plus Agent — Band 6.0–6.5 (B2)

 * Generates one complete full IELTS mock test (same structure as Foundation, B2 difficulty).

 * Run: npm run agent:accelerator:plus

 */



const { runTrackGeneration } = require("./acceleratorAgentCore.js");
const { LISTENING_TRANSCRIPT_SPELLING_RULES } = require("./listeningTranscriptRules.js");

async function generatePlusContent() {
  return runTrackGeneration("plus");
}


if (require.main === module) {

  generatePlusContent()

    .then((r) => {

      console.log(`[Plus] ${r.tasksGenerated} generated, ${r.tasksFailed} failed`);

      process.exit(r.tasksFailed > 0 && r.tasksGenerated === 0 ? 1 : 0);

    })

    .catch((err) => {

      console.error("[Plus] Failed:", err.message);

      process.exit(1);

    });

}



module.exports = { generatePlusContent, LISTENING_TRANSCRIPT_SPELLING_RULES };

