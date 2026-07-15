/**
 * CLI stub: print-ready unit export via noted print workflow.
 * Full PDF generation can wrap puppeteer later; for now validates content exists.
 *
 * Usage: node scripts/classroom/exportUnitPdf.mjs b1-1 unit-1-smart-cities
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const levelSlug = process.argv[2] || "b1-1";
const unitSlug = process.argv[3] || "unit-1-smart-cities";

const levelFolder =
  levelSlug === "ab"
    ? "AB"
    : levelSlug
        .split("-")
        .map((p, i) => (i === 0 ? p.toUpperCase() : p))
        .join("-");

const unitDir = path.join(
  __dirname,
  "../../content/classroom",
  levelFolder,
  unitSlug
);

if (!fs.existsSync(path.join(unitDir, "meta.json"))) {
  console.error("Unit not found:", unitDir);
  process.exit(1);
}

console.log("Unit ready for PDF export (use Admin → PDF Export or Print in browser):");
console.log(" ", unitDir);
console.log("Student URL: /classroom/" + levelSlug + "/" + unitSlug);
console.log("Teacher answer keys: /classroom-teacher/[classId]/answer-keys/" + unitSlug);
