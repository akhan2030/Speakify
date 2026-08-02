/**
 * Stage 5 UI evidence: GT purchase lobby is distinct from Academic.
 * Run: $env:PROOF_BASE_URL="https://ielts-ai-tutor-neon.vercel.app"; node scripts/proof-gt-mock-lobby-ui.mjs
 */
import dotenv from "dotenv";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

dotenv.config({ path: ".env.local", quiet: true });

const BASE = (process.env.PROOF_BASE_URL || "https://ielts-ai-tutor-neon.vercel.app").replace(
  /\/$/,
  ""
);
const EMAIL = process.env.GT_PROOF_EMAIL || "gt.routing.regression@speakify.test";
const PASSWORD = process.env.GT_PROOF_PASSWORD || "GtRouting!2026";

const outDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "output",
  "gt-mock-lobby"
);

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.fill('input[name="email"], input[type="email"]', EMAIL);
  await page.fill('input[name="password"], input[type="password"]', PASSWORD);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 90000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForFunction(
    async () => {
      const res = await fetch("/api/auth/session");
      const data = await res.json().catch(() => null);
      return Boolean(data?.user?.email);
    },
    { timeout: 90000 }
  );
}

async function main() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  await login(page);

  await page.goto(`${BASE}/dashboard/ielts-general/student/mock-exam`, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForSelector("text=Your GT mock exam lobby", { timeout: 90000 });
  await page.screenshot({ path: path.join(outDir, "01-gt-lobby.png"), fullPage: true });
  const gtText = await page.locator("body").innerText();

  await page.goto(`${BASE}/dashboard/ielts/student/mock-exam`, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForSelector("text=IELTS Academic", { timeout: 90000 }).catch(() => null);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(outDir, "02-academic-lobby.png"), fullPage: true });
  const acText = await page.locator("body").innerText();

  await page.goto(`${BASE}/courses/mock-exams`, {
    waitUntil: "domcontentloaded",
    timeout: 90000,
  });
  await page.waitForSelector("text=GT 3-Mock Pack", { timeout: 90000 });
  await page.screenshot({ path: path.join(outDir, "03-hub-mock-exams.png"), fullPage: true });
  const hubText = await page.locator("body").innerText();

  // Invalid GT mock number must be rejected (not resume an unrelated in-progress).
  const sessionRes = await page.evaluate(async () => {
    const res = await fetch("/api/mock-test/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mockNumber: 4, examVariant: "general" }),
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, error: data.error ?? null, attemptId: data.attemptId ?? null };
  });

  const report = {
    base: BASE,
    email: EMAIL,
    gtLobbyUrl: `${BASE}/dashboard/ielts-general/student/mock-exam`,
    academicLobbyUrl: `${BASE}/dashboard/ielts/student/mock-exam`,
    checks: {
      gtHeaderGeneralTraining: /IELTS General Training/i.test(gtText),
      gtSaysYourGtLobby: /Your GT mock exam lobby/i.test(gtText),
      gtHasThreeMocksOnly: (gtText.match(/Mock Exam #0[123]/g) || []).length >= 3,
      gtNoFiveMockPack: !/Upgrade to 5-Mock Pack/i.test(gtText),
      gtMentionsThree: /3 of 3|All 3|3 full timed|of 3 GT/i.test(gtText),
      academicStillAcademic: /IELTS Academic/i.test(acText),
      academicNotGtLobby: !/Your GT mock exam lobby/i.test(acText),
      hubHasGtSection: /3 full timed GT mock exams|IELTS General Training/i.test(hubText),
      hubHasGtPack: /GT 3-Mock Pack/i.test(hubText),
      gtMock4Rejected: sessionRes.status === 400 || sessionRes.status === 403,
    },
    sessionMock4: sessionRes,
  };

  report.allPassed = Object.values(report.checks).every(Boolean);
  await writeFile(path.join(outDir, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
  process.exit(report.allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
