import Link from "next/link";
import { notFound } from "next/navigation";
import { getLevelBySlug, B1_1_UNIT_THEMES } from "@/lib/classroom/levels";
import { listUnitFoldersForLevel } from "@/lib/classroom/contentLoader";

export default async function AdminLevelUnitsPage({
  params,
}: {
  params: { levelSlug: string };
}) {
  const { levelSlug } = params;
  const level = getLevelBySlug(levelSlug);
  if (!level) notFound();

  const folders = listUnitFoldersForLevel(level.slug);
  const list =
    folders.length > 0
      ? folders
      : level.code === "B1.1"
        ? B1_1_UNIT_THEMES.map((u) => ({
            slug: `unit-${u.unitNumber}`,
            unitNumber: u.unitNumber,
            title: u.theme,
            status: u.unitNumber === 1 ? "published" : "draft",
          }))
        : [];

  return (
    <div className="space-y-4">
      <Link
        href="/admin/classroom/levels"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        ← Levels
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">
        {level.code} units
      </h1>
      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 text-slate-600">
          No unit folders under content/classroom yet.
        </p>
      ) : (
        <ul className="space-y-2">
          {list.map((unit) => (
            <li key={unit.slug}>
              <Link
                href={`/admin/classroom/levels/${encodeURIComponent(level.slug)}/units/${encodeURIComponent(unit.slug)}/edit`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 hover:border-slate-400"
              >
                <div>
                  <p className="font-semibold">
                    Unit {unit.unitNumber} · {unit.title}
                  </p>
                  <p className="text-sm capitalize text-slate-500">
                    {unit.status}
                  </p>
                </div>
                <span className="text-sm text-slate-500">Edit →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
