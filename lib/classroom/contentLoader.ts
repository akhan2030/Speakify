/**
 * Server-side loader for classroom unit content under content/classroom/.
 *
 * Layout example:
 *   content/classroom/B1-1/unit-01/meta.json
 *   content/classroom/B1-1/unit-01/lesson-1.json
 *   content/classroom/B1-1/unit-01/lesson-2.json
 *   ...
 *   content/classroom/B1-1/unit-01/quiz.json
 *
 * Level folders use slugs from levelSlugFromCode (B1.1 -> B1-1).
 */

import fs from "fs";
import path from "path";
import {
  levelSlugFromCode,
  getLevelByCode,
  getLevelBySlug,
} from "./levels";
import {
  safeParseLessonJson,
  safeParseQuizJson,
  safeParseUnitMeta,
  type LessonJson,
  type QuizJson,
  type UnitMetaJson,
} from "./contentSchema";

const CONTENT_ROOT = path.join(process.cwd(), "content", "classroom");

export type LoadedUnitContent = {
  levelCode: string;
  levelFolder: string;
  unitNumber: number;
  unitFolder: string;
  meta: UnitMetaJson;
  lessons: Array<{ file: string; data: LessonJson }>;
  quiz: QuizJson | null;
};

/** B1.1 / b1-1 -> B1-1, AB / ab -> AB */
function levelFolderName(levelCodeOrSlug: string): string {
  const meta =
    getLevelByCode(levelCodeOrSlug) ?? getLevelBySlug(levelCodeOrSlug);
  const slug = levelSlugFromCode(meta?.code ?? levelCodeOrSlug);
  if (slug === "ab") return "AB";
  const [band, micro] = slug.split("-");
  return micro ? `${band.toUpperCase()}-${micro}` : band.toUpperCase();
}

function unitFolderName(unitNumber: number): string {
  return `unit-${String(unitNumber).padStart(2, "0")}`;
}

/** Resolve a unit directory by slug (e.g. unit-1-smart-cities) or unit-01 / unit-1. */
export function resolveUnitDirBySlug(
  levelCodeOrSlug: string,
  unitSlug: string
): string | null {
  const levelDir = path.join(CONTENT_ROOT, levelFolderName(levelCodeOrSlug));
  if (!fs.existsSync(levelDir)) return null;
  const slug = String(unitSlug).trim();
  const direct = path.join(levelDir, slug);
  if (fs.existsSync(path.join(direct, "meta.json"))) return direct;

  const match = slug.match(/^unit-(\d+)/i);
  if (match) {
    const n = Number(match[1]);
    for (const candidate of [
      unitFolderName(n),
      `unit-${n}`,
      slug,
    ]) {
      const dir = path.join(levelDir, candidate);
      if (fs.existsSync(path.join(dir, "meta.json"))) return dir;
    }
  }

  // Scan folders whose meta.slug matches
  for (const entry of fs.readdirSync(levelDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const meta = readJsonFile(path.join(levelDir, entry.name, "meta.json"));
    if (
      meta &&
      typeof meta === "object" &&
      String((meta as { slug?: string }).slug ?? "") === slug
    ) {
      return path.join(levelDir, entry.name);
    }
  }
  return null;
}

export function listUnitFoldersForLevel(levelCodeOrSlug: string): Array<{
  folder: string;
  slug: string;
  unitNumber: number;
  title: string;
  status: string;
}> {
  const levelDir = path.join(CONTENT_ROOT, levelFolderName(levelCodeOrSlug));
  if (!fs.existsSync(levelDir)) return [];

  return fs
    .readdirSync(levelDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^unit-/i.test(d.name))
    .map((d) => {
      const meta = readJsonFile(path.join(levelDir, d.name, "meta.json")) as {
        slug?: string;
        unitNumber?: number;
        title?: string;
        status?: string;
      } | null;
      const numMatch = d.name.match(/^unit-(\d+)/i);
      return {
        folder: d.name,
        slug: String(meta?.slug ?? d.name),
        unitNumber: Number(meta?.unitNumber ?? numMatch?.[1] ?? 0),
        title: String(meta?.title ?? d.name),
        status: String(meta?.status ?? "draft"),
      };
    })
    .filter((u) => u.unitNumber > 0)
    .sort((a, b) => a.unitNumber - b.unitNumber);
}

export function loadUnitContentBySlug(
  levelCodeOrSlug: string,
  unitSlug: string
): LoadedUnitContent | null {
  const unitDir = resolveUnitDirBySlug(levelCodeOrSlug, unitSlug);
  if (!unitDir) return null;
  const metaRaw = readJsonFile(path.join(unitDir, "meta.json"));
  if (metaRaw == null) return null;

  const metaParsed = safeParseUnitMeta(metaRaw);
  const meta: UnitMetaJson = metaParsed.success
    ? metaParsed.data
    : (metaRaw as UnitMetaJson);

  const levelMeta =
    getLevelByCode(levelCodeOrSlug) ?? getLevelBySlug(levelCodeOrSlug);
  const levelCode = String(
    meta.levelCode ?? levelMeta?.code ?? levelCodeOrSlug
  );
  const unitNumber = Number(meta.unitNumber ?? 0) || 1;
  const lessons = loadLessonFiles(unitDir, meta);

  const quizRaw = readJsonFile(path.join(unitDir, "quiz.json"));
  let quiz: QuizJson | null = null;
  if (quizRaw != null) {
    const quizParsed = safeParseQuizJson(quizRaw);
    quiz = quizParsed.success
      ? quizParsed.data
      : ({
          title: "Unit Quiz",
          questions: [],
          ...(typeof quizRaw === "object" && quizRaw ? quizRaw : {}),
        } as QuizJson);
  }

  return {
    levelCode,
    levelFolder: levelFolderName(levelCodeOrSlug),
    unitNumber,
    unitFolder: path.basename(unitDir),
    meta,
    lessons,
    quiz,
  };
}

function readJsonFile(filePath: string): unknown | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

export function getClassroomContentRoot(): string {
  return CONTENT_ROOT;
}

export function resolveUnitDir(
  levelCodeOrSlug: string,
  unitNumber: number
): string {
  return path.join(
    CONTENT_ROOT,
    levelFolderName(levelCodeOrSlug),
    unitFolderName(unitNumber)
  );
}

export function unitContentExists(
  levelCodeOrSlug: string,
  unitNumber: number
): boolean {
  const metaPath = path.join(
    resolveUnitDir(levelCodeOrSlug, unitNumber),
    "meta.json"
  );
  return fs.existsSync(metaPath);
}

export function listUnitNumbersForLevel(levelCodeOrSlug: string): number[] {
  const levelDir = path.join(CONTENT_ROOT, levelFolderName(levelCodeOrSlug));
  if (!fs.existsSync(levelDir)) return [];

  return fs
    .readdirSync(levelDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^unit-\d+$/i.test(d.name))
    .map((d) => Number(d.name.replace(/^unit-/i, "")))
    .filter((n) => Number.isInteger(n) && n > 0)
    .sort((a, b) => a - b);
}

function loadLessonFiles(
  unitDir: string,
  meta: UnitMetaJson
): Array<{ file: string; data: LessonJson }> {
  const lessons: Array<{ file: string; data: LessonJson }> = [];
  const seen = new Set<string>();

  const fromMeta = (meta.lessons ?? [])
    .map((l) => l.file)
    .filter((f): f is string => Boolean(f));

  const discovered = fs.existsSync(unitDir)
    ? fs
        .readdirSync(unitDir)
        .filter((f) => /^lesson-\d+\.json$/i.test(f))
        .sort((a, b) => {
          const na = Number(a.match(/(\d+)/)?.[1] ?? 0);
          const nb = Number(b.match(/(\d+)/)?.[1] ?? 0);
          return na - nb;
        })
    : [];

  const files = [...fromMeta, ...discovered];

  for (const file of files) {
    const base = path.basename(file);
    if (seen.has(base)) continue;
    seen.add(base);
    const full = path.join(unitDir, base);
    const raw = readJsonFile(full);
    if (raw == null) continue;
    const parsed = safeParseLessonJson(raw);
    if (parsed.success) {
      lessons.push({ file: base, data: parsed.data });
    } else {
      lessons.push({
        file: base,
        data: {
          title: base,
          type: "lesson",
          sections: [],
          ...(typeof raw === "object" && raw ? raw : {}),
        } as LessonJson,
      });
    }
  }

  return lessons;
}

/**
 * Load unit meta.json, lesson-*.json, and quiz.json from the filesystem.
 */
export function loadUnitContent(
  levelCodeOrSlug: string,
  unitNumber: number
): LoadedUnitContent | null {
  const levelFolder = levelFolderName(levelCodeOrSlug);
  const unitFolder = unitFolderName(unitNumber);
  const unitDir = path.join(CONTENT_ROOT, levelFolder, unitFolder);
  const metaRaw = readJsonFile(path.join(unitDir, "meta.json"));
  if (metaRaw == null) return null;

  const metaParsed = safeParseUnitMeta(metaRaw);
  const meta: UnitMetaJson = metaParsed.success
    ? metaParsed.data
    : (metaRaw as UnitMetaJson);

  const levelMeta =
    getLevelByCode(levelCodeOrSlug) ?? getLevelBySlug(levelCodeOrSlug);
  const levelCode = String(
    meta.levelCode ?? levelMeta?.code ?? levelCodeOrSlug
  );

  const lessons = loadLessonFiles(unitDir, meta);

  const quizRaw = readJsonFile(path.join(unitDir, "quiz.json"));
  let quiz: QuizJson | null = null;
  if (quizRaw != null) {
    const quizParsed = safeParseQuizJson(quizRaw);
    quiz = quizParsed.success
      ? quizParsed.data
      : ({
          title: "Unit Quiz",
          questions: [],
          ...(typeof quizRaw === "object" && quizRaw ? quizRaw : {}),
        } as QuizJson);
  }

  return {
    levelCode,
    levelFolder,
    unitNumber,
    unitFolder,
    meta,
    lessons,
    quiz,
  };
}

export function loadUnitMeta(
  levelCodeOrSlug: string,
  unitNumber: number
): UnitMetaJson | null {
  const unitDir = resolveUnitDir(levelCodeOrSlug, unitNumber);
  const raw = readJsonFile(path.join(unitDir, "meta.json"));
  if (raw == null) return null;
  const parsed = safeParseUnitMeta(raw);
  return parsed.success ? parsed.data : (raw as UnitMetaJson);
}

export function loadLessonJson(
  levelCodeOrSlug: string,
  unitNumber: number,
  lessonNumber: number
): LessonJson | null {
  const unitDir = resolveUnitDir(levelCodeOrSlug, unitNumber);
  const file = path.join(unitDir, `lesson-${lessonNumber}.json`);
  const raw = readJsonFile(file);
  if (raw == null) return null;
  const parsed = safeParseLessonJson(raw);
  return parsed.success ? parsed.data : (raw as LessonJson);
}

export function loadQuizJson(
  levelCodeOrSlug: string,
  unitNumber: number
): QuizJson | null {
  const unitDir = resolveUnitDir(levelCodeOrSlug, unitNumber);
  const raw = readJsonFile(path.join(unitDir, "quiz.json"));
  if (raw == null) return null;
  const parsed = safeParseQuizJson(raw);
  return parsed.success ? parsed.data : (raw as QuizJson);
}

/** Exported for tests / callers that need the folder naming rule. */
export function levelFolderFromCode(levelCode: string): string {
  return levelFolderName(levelCode);
}
