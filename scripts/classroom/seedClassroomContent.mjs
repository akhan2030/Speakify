/**
 * Seed classroom filesystem content into Supabase tables.
 * Requires SUPABASE_URL + SUPABASE_SERVICE_KEY and applied classroom_schema.sql.
 *
 * Usage: node scripts/classroom/seedClassroomContent.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../../content/classroom");

function getSupabase() {
  const url = (process.env.SUPABASE_URL || "")
    .replace(/\/rest\/v1\/?$/i, "")
    .replace(/\/$/, "");
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function main() {
  const supabase = getSupabase();
  const levels = fs
    .readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory());

  for (const levelDirEnt of levels) {
    const levelFolder = levelDirEnt.name;
    const levelDir = path.join(ROOT, levelFolder);
    const code = levelFolder.replace("-", ".");
    // AB stays AB; B1-1 -> B1.1
    const levelCode =
      levelFolder === "AB"
        ? "AB"
        : levelFolder.includes("-")
          ? levelFolder.replace("-", ".")
          : levelFolder;

    const { data: levelRow, error: levelErr } = await supabase
      .from("classroom_levels")
      .select("id, code")
      .eq("code", levelCode)
      .maybeSingle();

    if (levelErr) {
      console.warn(`[skip] levels table?`, levelErr.message);
      return;
    }
    if (!levelRow) {
      console.warn(`[skip] level not seeded in DB: ${levelCode}`);
      continue;
    }

    for (const unitEnt of fs.readdirSync(levelDir, { withFileTypes: true })) {
      if (!unitEnt.isDirectory() || !unitEnt.name.startsWith("unit-")) continue;
      const unitDir = path.join(levelDir, unitEnt.name);
      const metaPath = path.join(unitDir, "meta.json");
      if (!fs.existsSync(metaPath)) continue;
      const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));

      const { data: unit, error: unitErr } = await supabase
        .from("classroom_units")
        .upsert(
          {
            level_id: levelRow.id,
            unit_number: meta.unitNumber ?? 1,
            slug: meta.slug ?? unitEnt.name,
            title: meta.title ?? unitEnt.name,
            theme: meta.theme ?? "",
            grammar_point_1: meta.grammarPoint1 ?? "",
            grammar_point_2: meta.grammarPoint2 ?? "",
            objectives: meta.objectives ?? [],
            status: meta.status ?? "draft",
          },
          { onConflict: "level_id,slug" }
        )
        .select("id")
        .maybeSingle();

      if (unitErr) {
        console.error("unit upsert failed", unitErr.message);
        continue;
      }
      console.log("✓ unit", levelCode, meta.slug ?? unitEnt.name, unit?.id);

      if (unit?.id && fs.existsSync(path.join(unitDir, "quiz.json"))) {
        const quiz = JSON.parse(
          fs.readFileSync(path.join(unitDir, "quiz.json"), "utf8")
        );
        await supabase.from("classroom_quizzes").upsert(
          {
            unit_id: unit.id,
            title: quiz.title ?? "Unit Quiz",
            questions: quiz.questions ?? [],
          },
          { onConflict: "unit_id" }
        );
      }
    }
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
