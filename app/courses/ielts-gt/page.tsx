import Link from "next/link";
import MarketingShell from "@/components/marketing/MarketingShell";
import CourseCard from "@/components/courses/CourseCard";
import { getIeltsGeneralCourses } from "@/lib/courses/catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "IELTS General Training Courses | Speakify LMS",
  description:
    "IELTS General Training Foundation, Plus, and Elite — letter writing, GT reading, and everyday English inside Speakify LMS.",
};

export default function IeltsGeneralCoursesPage() {
  const ieltsCourses = getIeltsGeneralCourses();

  return (
    <MarketingShell>
      <section className="bg-[#0d1b35] px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <Link href="/courses" className="text-sm font-medium text-[#c9972c] hover:underline">
            ← All courses
          </Link>
          <h1 className="mt-6 text-3xl font-extrabold text-white sm:text-4xl">
            IELTS General Training
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-slate-300">
            Three dedicated General Training tracks — Foundation, Plus, and Elite — for letter
            writing, everyday reading, and GT skills. Separate from Academic graph/report
            writing.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ieltsCourses.map((course) => (
            <CourseCard key={course.slug} course={course} />
          ))}
        </div>
      </div>
    </MarketingShell>
  );
}
