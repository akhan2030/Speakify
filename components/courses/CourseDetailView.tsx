import Link from "next/link";
import { levelBadgeColor, type CourseCatalogItem } from "@/lib/courses/catalog";

type Props = {
  course: CourseCatalogItem;
};

export default function CourseDetailView({ course }: Props) {
  const isEnrollable = course.ctaLabel === "Start Learning";

  return (
    <div>
      <section
        className="px-4 py-12 sm:px-6 sm:py-16"
        style={{
          background: `linear-gradient(135deg, #0d1b35 0%, ${course.accent}22 100%)`,
        }}
      >
        <div className="mx-auto max-w-4xl">
          <Link
            href="/courses"
            className="text-sm font-medium text-[#c9972c] hover:underline"
          >
            ← All courses
          </Link>
          {course.tagline ? (
            <p className="mt-6 text-sm font-bold uppercase tracking-wide text-[#c9972c]">
              {course.tagline}
            </p>
          ) : null}
          <h1 className="mt-2 text-3xl font-extrabold text-white sm:text-4xl">
            {course.name}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">
            {course.description}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-white"
              style={{ backgroundColor: levelBadgeColor(course.levelBadge) }}
            >
              {course.levelBadge}
            </span>
            {course.duration ? (
              <span className="text-sm text-slate-400">{course.duration}</span>
            ) : null}
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={isEnrollable ? course.ctaHref : "/login"}
              className="inline-flex items-center rounded-xl px-6 py-3 text-sm font-semibold text-[#0d1b35] hover:opacity-95"
              style={{
                backgroundColor:
                  course.accent === "#0d1b35" ? "#c9972c" : course.accent,
                color:
                  course.accent === "#0d1b35" || course.accent === "#c9972c"
                    ? "#0d1b35"
                    : "#fff",
              }}
            >
              {isEnrollable ? "Start Learning" : "Sign in to enquire"}
            </Link>
            <Link
              href="/placement-test"
              className="inline-flex items-center rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Take placement test
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-bold text-[#0d1b35]">What you&apos;ll learn</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {course.highlights.map((item) => (
            <li
              key={item}
              className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700"
            >
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: course.accent }}
              />
              {item}
            </li>
          ))}
        </ul>

        {!isEnrollable ? (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
            <p className="font-semibold text-[#0d1b35]">Coming soon to Speakify LMS</p>
            <p className="mt-2 text-sm text-slate-600">
              This programme is listed in our course directory. Contact us or sign in for
              early access updates.
            </p>
            <Link
              href="/login"
              className="mt-4 inline-flex rounded-xl bg-[#0d1b35] px-5 py-2.5 text-sm font-semibold text-white hover:opacity-95"
            >
              Sign in
            </Link>
          </div>
        ) : null}
      </section>
    </div>
  );
}
