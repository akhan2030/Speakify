import { notFound } from "next/navigation";
import LessonPageClient from "@/components/classroom/LessonPageClient";
import { loadLessonForPage } from "../_loadLesson";

export default async function Lesson3Page({
  params,
}: {
  params: { levelSlug: string; unitSlug: string };
}) {
  const { levelSlug, unitSlug } = params;
  const data = loadLessonForPage(levelSlug, unitSlug, 3);
  if (!data) notFound();
  return <LessonPageClient {...data} />;
}
