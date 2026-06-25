import MarketingShell from "@/components/marketing/MarketingShell";
import CourseCard from "@/components/courses/CourseCard";
import { COURSE_CATEGORIES, getCoursesByCategory } from "@/lib/courses/catalog";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Courses | Speakify LMS",
  description:
    "Browse all Speakify programmes — IELTS, TOEFL, STEP, English Pathway, Business English, and more.",
};

export default function CoursesHubPage() {
  return (
    <MarketingShell>
      <section className="bg-[#0d1b35] px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#c9972c]">
            Speakify LMS
          </p>
          <h1 className="mt-4 text-3xl font-extrabold text-white sm:text-4xl">
            Course Hub
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-300">
            Your directory for every Speakify programme — from IELTS test prep to
            general English and specialty courses.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {COURSE_CATEGORIES.map((category) => {
          const courses = getCoursesByCategory(category.id);
          return (
            <section key={category.id} id={category.id} className="mb-14 last:mb-0">
              <div className="mb-6 border-b border-slate-200 pb-4">
                <h2 className="text-2xl font-bold text-[#0d1b35]">{category.label}</h2>
                <p className="mt-1 text-sm text-slate-500">{category.description}</p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {courses.map((course) => (
                  <CourseCard key={course.slug} course={course} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </MarketingShell>
  );
}
