/**
 * Validate classroom unit JSON under content/classroom against soft Zod schemas.
 * Usage: node scripts/classroom/validateContent.mjs
 *        node scripts/classroom/validateContent.mjs B1-1/unit-1-smart-cities
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  safeParseLessonJson,
  safeParseQuizJson,
  safeParseUnitMeta,
} from "../../lib/classroom/contentSchema.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../../content/classroom");

function walkUnits(root) {
  if (!fs.existsSync(root)) return [];
  const out = [];
  for (const level of fs.readdirSync(root, { withFileTypes: true })) {
    if (!level.isDirectory()) continue;
    const levelDir = path.join(root, level.name);
    for (const unit of fs.readdirSync(levelDir, { withFileTypes: true })) {
      if (!unit.isDirectory() || !unit.name.startsWith("unit-")) continue;
      out.push(path.join(levelDir, unit.name));
    }
  }
  return out;
}

const filter = process.argv[2];
let units = walkUnits(ROOT);
if (filter) {
  units = units.filter((u) => u.replace(/\\/g, "/").includes(filter));
}

let failed = 0;
for (const unitDir of units) {
  const metaPath = path.join(unitDir, "meta.json");
  if (!fs.existsSync(metaPath)) {
    console.error("✗ missing meta.json", unitDir);
    failed += 1;
    continue;
  }
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  const metaOk = safeParseUnitMeta(meta);
  if (!metaOk.success) {
    console.error("✗ meta", unitDir, metaOk.error);
    failed += 1;
  } else {
    console.log("✓ meta", path.relative(ROOT, unitDir));
  }

  for (const file of fs.readdirSync(unitDir)) {
    if (!file.endsWith(".json") || file === "meta.json") continue;
    const raw = JSON.parse(fs.readFileSync(path.join(unitDir, file), "utf8"));
    if (file === "quiz.json") {
      const q = safeParseQuizJson(raw);
      if (!q.success) {
        console.error("✗ quiz", file, q.error);
        failed += 1;
      } else {
        console.log("  ✓", file, `(${q.data.questions?.length ?? 0} Qs)`);
      }
    } else {
      const l = safeParseLessonJson(raw);
      if (!l.success) {
        console.error("✗ lesson", file, l.error);
        failed += 1;
      } else {
        console.log("  ✓", file, `(${l.data.sections?.length ?? 0} sections)`);
      }
    }
  }
}

if (units.length === 0) {
  console.log("No units found under content/classroom");
}

process.exit(failed ? 1 : 0);
