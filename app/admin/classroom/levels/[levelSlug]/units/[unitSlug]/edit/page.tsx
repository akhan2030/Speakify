import Link from "next/link";
import { notFound } from "next/navigation";
import UnitEditor from "@/components/classroom/admin/UnitEditor";
import { getLevelBySlug, B1_1_UNIT_THEMES } from "@/lib/classroom/levels";
import { loadUnitContentBySlug } from "@/lib/classroom/contentLoader";
import { getUnitContent } from "@/lib/classroom/content";

export default async function AdminUnitEditPage({
  params,
}: {
  params: { levelSlug: string; unitSlug: string };
}) {
  const { levelSlug, unitSlug } = params;
  const level = getLevelBySlug(levelSlug);
  if (!level) notFound();

  const loaded = loadUnitContentBySlug(level.slug, unitSlug);
  const unitNumMatch = unitSlug.match(/^unit-(\d+)/i);
  const unitNumber =
    loaded?.unitNumber ?? (unitNumMatch ? Number(unitNumMatch[1]) : 1);
  const pilot =
    level.code === "B1.1" && unitNumber === 1
      ? getUnitContent("B1.1", 1)
      : null;
  const theme = B1_1_UNIT_THEMES.find((u) => u.unitNumber === unitNumber);

  return (
    <div className="space-y-4">
      <Link
        href={`/admin/classroom/levels/${encodeURIComponent(level.slug)}/units`}
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        ← {level.code} units
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">
        Edit · {loaded?.meta.title ?? theme?.theme ?? unitSlug}
      </h1>
      <UnitEditor
        levelSlug={level.slug}
        unitSlug={unitSlug}
        initial={{
          title: loaded?.meta.title ?? theme?.theme ?? "",
          theme: loaded?.meta.theme ?? pilot?.theme ?? theme?.theme ?? "",
          grammarPoint1:
            loaded?.meta.grammarPoint1 ??
            loaded?.meta.grammarFocus ??
            pilot?.grammarFocus ??
            theme?.grammarFocus ??
            "",
          grammarPoint2: loaded?.meta.grammarPoint2 ?? "",
          objectives:
            loaded?.meta.objectives ??
            loaded?.meta.learningObjectives ??
            pilot?.learningObjectives ??
            [],
          status:
            (loaded?.meta.status as "draft" | "published" | "archived") ??
            (pilot?.status ?? "draft"),
          lessonTitles: loaded?.lessons.map(
            (l, i) => l.data.title ?? `Lesson ${i + 1}`
          ),
        }}
      />
    </div>
  );
}
