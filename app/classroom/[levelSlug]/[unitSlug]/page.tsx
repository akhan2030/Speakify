import Link from "next/link";
import { notFound } from "next/navigation";
import ProgressPath from "@/components/classroom/ProgressPath";
import { getLevelBySlug, B1_1_UNIT_THEMES } from "@/lib/classroom/levels";
import { loadUnitContentBySlug } from "@/lib/classroom/contentLoader";
import { getUnitContent } from "@/lib/classroom/content";

export default async function ClassroomUnitPage({
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
    loaded?.unitNumber ??
    (unitNumMatch ? Number(unitNumMatch[1]) : 1);

  const pilot =
    level.code === "B1.1" && unitNumber === 1
      ? getUnitContent("B1.1", 1)
      : null;
  const themeFallback = B1_1_UNIT_THEMES.find((u) => u.unitNumber === unitNumber);

  const title =
    loaded?.meta.title ??
    pilot?.theme ??
    themeFallback?.theme ??
    `Unit ${unitNumber}`;
  const theme = loaded?.meta.theme ?? pilot?.theme ?? themeFallback?.theme ?? "";
  const objectives =
    loaded?.meta.objectives?.length
      ? loaded.meta.objectives
      : loaded?.meta.learningObjectives?.length
        ? loaded.meta.learningObjectives
        : pilot?.learningObjectives ?? [];
  const grammar =
    loaded?.meta.grammarPoint1 ??
    loaded?.meta.grammarFocus ??
    pilot?.grammarFocus ??
    themeFallback?.grammarFocus ??
    "";

  const lessonLinks = [1, 2, 3, 4, 5].map((n) => {
    const fromMeta = loaded?.meta.lessons?.find((l) => l.lessonNumber === n);
    const fromFile = loaded?.lessons.find((l) =>
      l.file.toLowerCase().includes(`lesson-${n}`)
    );
    return {
      n,
      title: fromMeta?.title ?? fromFile?.data.title ?? `Lesson ${n}`,
      href: `/classroom/${encodeURIComponent(level.slug)}/${encodeURIComponent(unitSlug)}/lesson-${n}`,
    };
  });

  const base = `/classroom/${encodeURIComponent(level.slug)}/${encodeURIComponent(unitSlug)}`;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/classroom/${encodeURIComponent(level.slug)}`}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ← {level.code}
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h1>
        {theme ? <p className="mt-1 text-lg text-slate-600">{theme}</p> : null}
        {grammar ? (
          <p className="mt-2 text-sm text-slate-500">Grammar: {grammar}</p>
        ) : null}
      </div>

      <ProgressPath levelSlug={level.slug} unitSlug={unitSlug} />

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Learning objectives</h2>
        {objectives.length > 0 ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-700">
            {objectives.map((o) => (
              <li key={o}>{o}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-500">
            Objectives will appear when unit meta.json is published.
          </p>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {lessonLinks.map((lesson) => (
          <Link
            key={lesson.n}
            href={lesson.href}
            className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6a1f]">
              Lesson {lesson.n}
            </p>
            <p className="mt-1 font-semibold">{lesson.title}</p>
          </Link>
        ))}
        <Link
          href={`${base}/extra-activities`}
          className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6a1f]">
            Extra
          </p>
          <p className="mt-1 font-semibold">Extra activities</p>
        </Link>
        <Link
          href={`${base}/quiz`}
          className="rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-400"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8a6a1f]">
            Assessment
          </p>
          <p className="mt-1 font-semibold">End-of-unit quiz</p>
        </Link>
      </section>
    </div>
  );
}
