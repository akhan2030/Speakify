import Link from "next/link";
import { getLevelBySlug } from "@/lib/classroom/levels";
import { loadUnitContentBySlug } from "@/lib/classroom/contentLoader";
import { getUnitContent } from "@/lib/classroom/content";

export default async function TeacherAnswerKeysPage({
  params,
}: {
  params: { classId: string; unitSlug: string };
}) {
  const { classId, unitSlug } = params;
  const level = getLevelBySlug("b1-1");
  const loaded = level
    ? loadUnitContentBySlug(level.slug, unitSlug)
    : null;
  const pilot = getUnitContent("B1.1", 1);

  const quizQuestions =
    loaded?.quiz?.questions ??
    pilot?.quiz.questions.map((q) => ({
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      answer: q.answer,
    })) ??
    [];

  const keyEntries = pilot?.answerKey
    ? Object.entries(pilot.answerKey).flatMap(([section, map]) =>
        Object.entries(map as Record<string, string | string[]>).map(
          ([id, answer]) => ({
            section,
            id,
            answer: Array.isArray(answer) ? answer.join(" / ") : String(answer),
          })
        )
      )
    : [];

  return (
    <div className="space-y-6">
      <Link
        href={`/classroom-teacher/${encodeURIComponent(classId)}`}
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        ← Class home
      </Link>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Answer keys · {unitSlug}
        </h1>
        <p className="mt-1 text-slate-600">
          Teacher-only. B1.1 pilot keys shown when filesystem content is empty.
        </p>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Quiz answers</h2>
        {quizQuestions.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No quiz loaded.</p>
        ) : (
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
            {quizQuestions.map((q) => (
              <li key={String(q.id)}>
                <span className="text-slate-700">
                  {String(q.prompt ?? "").slice(0, 120)}
                </span>
                {"answer" in q && q.answer != null ? (
                  <span className="mt-0.5 block font-semibold text-emerald-800">
                    {Array.isArray(q.answer)
                      ? q.answer.join(" / ")
                      : String(q.answer)}
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </section>

      {keyEntries.length > 0 ? (
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Section answer keys</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {keyEntries.map((row) => (
              <li
                key={`${row.section}-${row.id}`}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"
              >
                <span className="text-xs font-semibold uppercase text-slate-400">
                  {row.section} · {row.id}
                </span>
                <p className="font-medium text-emerald-900">{row.answer}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
