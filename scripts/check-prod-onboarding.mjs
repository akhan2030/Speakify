/**
 * Verify production /onboarding serves all 8 programme options in JS bundles.
 * Run: node scripts/check-prod-onboarding.mjs
 */
const base = "https://ielts-ai-tutor-neon.vercel.app";

const REQUIRED = [
  "IELTS Academic",
  "IELTS General",
  "TOEFL",
  "STEP",
  "English Pathway",
  "Business English",
  "Legal English",
  "Kids English",
];

const DEPLOY_MARKER = "Pathway · Business · Legal · Kids";

async function collectChunks(startHtml) {
  const found = new Set();
  const queue = [
    ...startHtml.matchAll(/\/_next\/static\/chunks\/[^"']+\.js/g),
  ].map((m) => m[0]);

  while (queue.length) {
    const path = queue.shift();
    if (!path || found.has(path)) continue;
    found.add(path);

    const js = await fetch(`${base}${path}`).then((r) => r.text()).catch(() => "");
    const nested = [...js.matchAll(/\/_next\/static\/chunks\/[^"']+\.js/g)].map((m) => m[0]);
    for (const n of nested) {
      if (!found.has(n)) queue.push(n);
    }
  }

  return found;
}

const html = await fetch(`${base}/onboarding`).then((r) => r.text());
const chunks = await collectChunks(html);
console.log(`Scanned ${chunks.size} JS chunks from ${base}/onboarding`);

let combined = "";
for (const path of chunks) {
  combined += await fetch(`${base}${path}`).then((r) => r.text()).catch(() => "");
}

const missing = REQUIRED.filter((title) => !combined.includes(title));
const hasOld = combined.includes("Prepare for IELTS") || combined.includes("Build my English");
const hasMarker = combined.includes(DEPLOY_MARKER);

console.log("\n--- Programme titles ---");
for (const title of REQUIRED) {
  console.log(combined.includes(title) ? `  OK  ${title}` : `  MISS ${title}`);
}

console.log("\n--- Checks ---");
console.log("Old 4-option UI:", hasOld ? "FOUND (bad)" : "not found (good)");
console.log("Deploy marker:", hasMarker ? DEPLOY_MARKER : "not yet deployed");
console.log("Result:", missing.length === 0 && !hasOld ? "PASS" : "FAIL");

process.exit(missing.length === 0 && !hasOld ? 0 : 1);
