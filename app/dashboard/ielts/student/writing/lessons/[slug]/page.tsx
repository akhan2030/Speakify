import { notFound } from "next/navigation";
import WritingLessonView from "@/components/ielts/writing/WritingLessonView";
import {
  ACADEMIC_WRITING_LESSONS,
  getAcademicWritingLesson,
} from "@/lib/ielts/writingLessons";

type Props = {
  params: { slug: string };
};

export function generateStaticParams() {
  return ACADEMIC_WRITING_LESSONS.map((lesson) => ({ slug: lesson.slug }));
}

export default function AcademicWritingLessonPage({ params }: Props) {
  const lesson = getAcademicWritingLesson(params.slug);
  if (!lesson) notFound();
  return <WritingLessonView lesson={lesson} />;
}
