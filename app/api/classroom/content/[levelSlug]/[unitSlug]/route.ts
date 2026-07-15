import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getLevelBySlug } from "@/lib/classroom/levels";
import { loadUnitContentBySlug } from "@/lib/classroom/contentLoader";
import { getUnitContent } from "@/lib/classroom/content";
import { normalizeRole } from "@/lib/roles";

export async function GET(
  _req: Request,
  context: { params: { levelSlug: string; unitSlug: string } }
) {
  const session = await getServerSession(authOptions);
  const role = normalizeRole((session?.user as { role?: string })?.role);
  if (!session?.user || !role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { levelSlug, unitSlug } = context.params;
  const level = getLevelBySlug(levelSlug);
  if (!level) {
    return NextResponse.json({ error: "Unknown level" }, { status: 404 });
  }

  const loaded = loadUnitContentBySlug(level.slug, unitSlug);
  if (loaded) {
    return NextResponse.json({
      source: "filesystem",
      levelCode: loaded.levelCode,
      levelSlug: level.slug,
      unitNumber: loaded.unitNumber,
      unitFolder: loaded.unitFolder,
      meta: loaded.meta,
      lessons: loaded.lessons.map((l) => ({
        file: l.file,
        data: l.data,
      })),
      quiz: loaded.quiz,
    });
  }

  const unitNumMatch = unitSlug.match(/^unit-(\d+)/i);
  const unitNumber = unitNumMatch ? Number(unitNumMatch[1]) : NaN;
  const pilot =
    Number.isFinite(unitNumber) ? getUnitContent(level.code, unitNumber) : null;

  if (!pilot) {
    return NextResponse.json({ error: "Unit not found" }, { status: 404 });
  }

  return NextResponse.json({
    source: "pilot",
    levelCode: pilot.levelCode,
    levelSlug: level.slug,
    unitNumber: pilot.unitNumber,
    meta: {
      title: pilot.theme,
      theme: pilot.theme,
      grammarFocus: pilot.grammarFocus,
      objectives: pilot.learningObjectives,
      status: pilot.status,
    },
    lessons: [],
    quiz: pilot.quiz,
    answerKey: role === "teacher" || role === "admin" ? pilot.answerKey : undefined,
  });
}
