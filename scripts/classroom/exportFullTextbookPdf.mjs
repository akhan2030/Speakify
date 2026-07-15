/**
 * CLI stub for full-level textbook export checklist.
 * Usage: node scripts/classroom/exportFullTextbookPdf.mjs b1-1
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const levelSlug = process.argv[2] || "b1-1";
const levelFolder =
  levelSlug === "ab"
    ? "AB"
    : levelSlug
        .split("-")
        .map((p, i) => (i === 0 ? p.toUpperCase() : p))
        .join("-");

const levelDir = path.join(__dirname, "../../content/classroom", levelFolder);
if (!fs.existsSync(levelDir)) {
  console.error("Level folder missing:", levelDir);
  process.exit(1);
}

const units = fs
  .readdirSync(levelDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && d.name.startsWith("unit-"))
  .map((d) => d.name);

console.log(`Level ${levelSlug}: ${units.length} unit folder(s)`);
for (const u of units) console.log(" -", u);
console.log("Open /admin/classroom/pdf-export to print the student or teacher pack.");
