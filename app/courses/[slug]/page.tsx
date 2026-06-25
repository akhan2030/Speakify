import MarketingShell from "@/components/marketing/MarketingShell";
import CourseDetailView from "@/components/courses/CourseDetailView";
import { COURSE_SLUGS, getCourseBySlug } from "@/lib/courses/catalog";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

type Props = {
  params: { slug: string };
};

export function generateStaticParams() {
  return COURSE_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const course = getCourseBySlug(params.slug);
  if (!course) return { title: "Course | Speakify LMS" };
  return {
    title: `${course.name} | Speakify LMS`,
    description: course.description,
  };
}

export default function CourseDetailPage({ params }: Props) {
  const course = getCourseBySlug(params.slug);
  if (!course) notFound();

  return (
    <MarketingShell>
      <CourseDetailView course={course} />
    </MarketingShell>
  );
}
