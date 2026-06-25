import { getOrCreateAssistant } from "../lib/assistant.js";

const id = await getOrCreateAssistant();
console.log("\n--- FULL OPENAI_ASSISTANT_ID ---");
console.log(id);
console.log("--- END ---\n");
