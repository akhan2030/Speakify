import { notFound } from "next/navigation";
import QuizPageClient from "@/components/classroom/QuizPageClient";
import { getLevelBySlug } from "@/lib/classroom/levels";
import { loadUnitContentBySlug } from "@/lib/classroom/contentLoader";
import { getUnitContent } from "@/lib/classroom/content";

export default async function ClassroomQuizPage({
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

  const quiz = loaded?.quiz ??
    (pilot
      ? {
          title: pilot.quiz.title,
          questions: pilot.quiz.questions,
        }
      : null);

  return (
    <QuizPageClient
      levelSlug={level.slug}
      unitSlug={unitSlug}
      levelCode={level.code}
      unitNumber={unitNumber}
      title={quiz?.title ?? "Unit Quiz"}
      questions={(quiz?.questions ?? []).map((q) => ({
        id: q.id,
        type: String(q.type ?? "mcq"),
        prompt: String(q.prompt ?? ""),
        options: q.options,
        pairs: "pairs" in q ? (q as { pairs?: { left: string; right: string }[] }).pairs : undefined,
      }))}
    />
  );
}
