import Link from "next/link";
import { notFound } from "next/navigation";
import { getLevelBySlug, B1_1_UNIT_THEMES } from "@/lib/classroom/levels";
import { listUnitFoldersForLevel } from "@/lib/classroom/contentLoader";

export default async function ClassroomLevelPage({
  params,
}: {
  params: { levelSlug: string };
}) {
  const { levelSlug } = params;
  const level = getLevelBySlug(levelSlug);
  if (!level) notFound();

  const units = listUnitFoldersForLevel(level.slug);
  const fallback =
    level.code === "B1.1" && units.length === 0
      ? B1_1_UNIT_THEMES.map((u) => ({
          slug: `unit-${u.unitNumber}`,
          unitNumber: u.unitNumber,
          title: u.theme,
          status: u.unitNumber === 1 ? "published" : "placeholder",
        }))
      : [];

  const list = units.length > 0 ? units : fallback;

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
          {level.code}
        </span>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          {level.name}
        </h1>
        <p className="mt-2 text-slate-600">
          {level.targetWeeks} weeks · {level.targetProfile}
        </p>
      </div>

      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white/70 p-6 text-slate-600">
          No units published for this level yet.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {list.map((unit) => {
            const href = `/classroom/${encodeURIComponent(level.slug)}/${encodeURIComponent(unit.slug)}`;
            return (
              <li key={unit.slug}>
                <Link
                  href={href}
                  className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-400"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6a1f]">
                    Unit {unit.unitNumber}
                  </p>
                  <p className="mt-1 font-semibold text-slate-900">
                    {unit.title}
                  </p>
                  <p className="mt-1 text-sm capitalize text-slate-500">
                    {unit.status}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
