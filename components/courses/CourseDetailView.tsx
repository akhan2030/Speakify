import Link from "next/link";
import {
  getCoursePageContent,
  getRelatedIeltsCourses,
  getRelatedIeltsGeneralCourses,
  isIeltsCourse,
  isIeltsGeneralCourse,
} from "@/lib/courses/pageContent";
import { levelBadgeColor, type CourseCatalogItem } from "@/lib/courses/catalog";
import { loginPathForCourseSlug } from "@/lib/courses/loginPaths";

type Props = {
  course: CourseCatalogItem;
};

function ctaButtonStyle(accent: string): React.CSSProperties {
  if (accent === "#0d1b35" || accent === "#c9972c") {
    return { backgroundColor: accent === "#0d1b35" ? "#c9972c" : accent, color: "#0d1b35" };
  }
  return { backgroundColor: accent, color: "#fff" };
}

export default function CourseDetailView({ course }: Props) {
  const content = getCoursePageContent(course.slug);
  const relatedIelts = isIeltsCourse(course.slug)
    ? getRelatedIeltsCourses(course.slug)
    : isIeltsGeneralCourse(course.slug)
      ? getRelatedIeltsGeneralCourses(course.slug)
      : [];
  const primaryHref =
    course.ctaLabel === "Start Learning" ? course.ctaHref : "/placement-test";
  const primaryLabel =
    course.ctaLabel === "Start Learning" ? "Start Learning" : "Take placement test";
  const signInHref = loginPathForCourseSlug(course.slug);

  return (
    <div>
      <section
        className="px-4 py-12 sm:px-6 sm:py-16"
        style={{
          background: `linear-gradient(135deg, #0d1b35 0%, ${course.accent}22 100%)`,
        }}
      >
        <div className="mx-auto max-w-4xl">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link href="/courses" className="font-medium text-[#c9972c] hover:underline">
              All courses
            </Link>
            {isIeltsCourse(course.slug) ? (
              <>
                <span className="text-slate-500">/</span>
                <Link
                  href="/courses/ielts"
                  className="font-medium text-[#c9972c] hover:underline"
                >
                  IELTS Academic
                </Link>
              </>
            ) : null}
            {isIeltsGeneralCourse(course.slug) ? (
              <>
                <span className="text-slate-500">/</span>
                <Link
                  href="/courses/ielts-gt"
                  className="font-medium text-[#c9972c] hover:underline"
                >
                  IELTS General Training
                </Link>
              </>
            ) : null}
          </div>

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

          <div className="mt-6 flex flex-wrap gap-2">
            <span
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-white"
              style={{ backgroundColor: levelBadgeColor(course.levelBadge) }}
            >
              {course.levelBadge}
            </span>
            {content.targetLabel ? (
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-slate-200">
                Target: {content.targetLabel}
              </span>
            ) : null}
            {content.entryLevel ? (
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-slate-200">
                Entry: {content.entryLevel}
              </span>
            ) : null}
            {course.duration ? (
              <span className="rounded-full bg-white/10 px-4 py-1.5 text-sm text-slate-200">
                {course.duration}
              </span>
            ) : null}
            {content.price ? (
              <span className="rounded-full bg-[#c9972c]/20 px-4 py-1.5 text-sm font-semibold text-[#c9972c]">
                {content.price}
              </span>
            ) : null}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={primaryHref}
              className="inline-flex items-center rounded-xl px-6 py-3 text-sm font-semibold hover:opacity-95"
              style={ctaButtonStyle(course.accent)}
            >
              {primaryLabel}
            </Link>
            <Link
              href="/courses"
              className="inline-flex items-center rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Browse all programmes
            </Link>
          </div>
        </div>
      </section>

      {content.skills.length > 0 ? (
        <section className="border-b border-slate-200 bg-white py-8">
          <div className="mx-auto flex max-w-4xl flex-wrap gap-2 px-4 sm:px-6">
            {content.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-[#0d1b35]"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto grid max-w-4xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-bold text-[#0d1b35]">Who this is for</h2>
          <ul className="mt-4 space-y-3">
            {content.idealFor.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-slate-700">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c9972c]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#0d1b35]">What you&apos;ll achieve</h2>
          <ul className="mt-4 space-y-3">
            {content.outcomes.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-slate-700">
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ backgroundColor: course.accent }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-xl font-bold text-[#0d1b35]">Programme curriculum</h2>
          <div className="mt-6 space-y-4">
            {content.curriculum.map((item) => (
              <div
                key={`${item.week}-${item.title}`}
                className="rounded-2xl border border-slate-200 bg-white p-5"
              >
                <p className="text-xs font-bold uppercase tracking-wide text-[#c9972c]">
                  {item.week}
                </p>
                <h3 className="mt-1 font-bold text-[#0d1b35]">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="text-xl font-bold text-[#0d1b35]">Key highlights</h2>
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
      </section>

      {relatedIelts.length > 0 ? (
        <section className="border-t border-slate-200 bg-white px-4 py-12 sm:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-xl font-bold text-[#0d1b35]">
              {isIeltsGeneralCourse(course.slug)
                ? "Other General Training tracks"
                : "Other IELTS tracks"}
            </h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {relatedIelts.map((related) => (
                <Link
                  key={related.slug}
                  href={`/courses/${related.slug}`}
                  className="rounded-2xl border border-slate-200 p-5 transition-shadow hover:shadow-md"
                >
                  <p className="font-bold text-[#0d1b35]">{related.name}</p>
                  <p className="mt-1 text-sm text-slate-600">{related.shortDescription}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-[#0d1b35] px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-bold text-white">Ready to start {course.name}?</h2>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Register for Speakify LMS or take a placement test to find your best starting point.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={primaryHref}
              className="inline-flex rounded-xl bg-[#c9972c] px-6 py-3 text-sm font-semibold text-[#0d1b35] hover:opacity-95"
            >
              {primaryLabel}
            </Link>
            <Link
              href={signInHref}
              className="inline-flex rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
