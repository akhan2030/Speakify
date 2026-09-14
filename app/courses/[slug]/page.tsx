import MarketingShell from "@/components/marketing/MarketingShell";
import CourseDetailView from "@/components/courses/CourseDetailView";
import ProgramComingSoon from "@/components/courses/ProgramComingSoon";
import { COURSE_SLUGS, getCourseBySlug } from "@/lib/courses/catalog";
import { comingSoonForCourseSlug } from "@/lib/courses/enrolmentClosed";
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

  const comingSoon = comingSoonForCourseSlug(course.slug);
  if (comingSoon) {
    return <ProgramComingSoon title={comingSoon.title} body={comingSoon.body} />;
  }

  return (
    <MarketingShell>
      <CourseDetailView course={course} />
    </MarketingShell>
  );
}
