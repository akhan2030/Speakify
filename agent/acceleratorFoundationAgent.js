/**

 * IELTS Accelerator Foundation Agent — Band 5.0–5.5 (B1)

 * Generates one complete full IELTS mock test:

 *   Listening 4 sections / 40 Q | Reading 3 passages / 40 Q

 *   Writing Task 1 + 2 | Speaking Part 1 + 2 + 3

 * Run: npm run agent:accelerator:foundation

 */



const { runTrackGeneration } = require("./acceleratorAgentCore.js");
const { LISTENING_TRANSCRIPT_SPELLING_RULES } = require("./listeningTranscriptRules.js");



async function generateFoundationContent() {

  return runTrackGeneration("foundation");

}



if (require.main === module) {

  generateFoundationContent()

    .then((r) => {

      console.log(`[Foundation] ${r.tasksGenerated} generated, ${r.tasksFailed} failed`);

      process.exit(r.tasksFailed > 0 && r.tasksGenerated === 0 ? 1 : 0);

    })

    .catch((err) => {

      console.error("[Foundation] Failed:", err.message);

      process.exit(1);

    });

}



module.exports = { generateFoundationContent, LISTENING_TRANSCRIPT_SPELLING_RULES };

