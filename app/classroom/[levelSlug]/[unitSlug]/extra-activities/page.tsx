import { notFound } from "next/navigation";
import LessonPageClient from "@/components/classroom/LessonPageClient";
import { loadLessonForPage } from "../_loadLesson";

export default async function ExtraActivitiesPage({
  params,
}: {
  params: { levelSlug: string; unitSlug: string };
}) {
  const { levelSlug, unitSlug } = params;
  const data = loadLessonForPage(levelSlug, unitSlug, "extra");
  if (!data) notFound();
  return <LessonPageClient {...data} />;
}
