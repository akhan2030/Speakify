/**

 * IELTS Accelerator Elite Agent — Band 7.0+ (C1)

 * Generates one complete full IELTS mock test (same structure as Foundation, C1 difficulty).

 * Run: npm run agent:accelerator:elite

 */



const { runTrackGeneration } = require("./acceleratorAgentCore.js");
const { LISTENING_TRANSCRIPT_SPELLING_RULES } = require("./listeningTranscriptRules.js");

async function generateEliteContent() {
  return runTrackGeneration("elite");
}



if (require.main === module) {

  generateEliteContent()

    .then((r) => {

      console.log(`[Elite] ${r.tasksGenerated} generated, ${r.tasksFailed} failed`);

      process.exit(r.tasksFailed > 0 && r.tasksGenerated === 0 ? 1 : 0);

    })

    .catch((err) => {

      console.error("[Elite] Failed:", err.message);

      process.exit(1);

    });

}



module.exports = { generateEliteContent, LISTENING_TRANSCRIPT_SPELLING_RULES };

