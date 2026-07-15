import { notFound } from "next/navigation";
import LessonPageClient from "@/components/classroom/LessonPageClient";
import { loadLessonForPage } from "../_loadLesson";

export default async function Lesson5Page({
  params,
}: {
  params: { levelSlug: string; unitSlug: string };
}) {
  const { levelSlug, unitSlug } = params;
  const data = loadLessonForPage(levelSlug, unitSlug, 5);
  if (!data) notFound();
  return <LessonPageClient {...data} />;
}
