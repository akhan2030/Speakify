import { notFound } from "next/navigation";
import GeneralWritingLessonView from "@/components/ielts-general/writing/GeneralWritingLessonView";
import { getWritingLesson, GT_WRITING_LESSONS } from "@/lib/ielts-general/writingLessons";

type Props = {
  params: { slug: string };
};

export function generateStaticParams() {
  return GT_WRITING_LESSONS.map((lesson) => ({ slug: lesson.slug }));
}

export default function GeneralWritingLessonPage({ params }: Props) {
  const lesson = getWritingLesson(params.slug);
  if (!lesson) notFound();
  return <GeneralWritingLessonView lesson={lesson} />;
}
