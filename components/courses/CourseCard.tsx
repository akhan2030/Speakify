import Link from "next/link";
import { levelBadgeColor, type CourseCatalogItem } from "@/lib/courses/catalog";
import { formatDurationLabel } from "@/lib/courses/duration";
import { COURSE_TRUST_STATS } from "@/lib/courses/trustStats";

type Props = {
  course: CourseCatalogItem;
  /** Highlight as placement recommendation */
  featured?: boolean;
  labels?: {
    viewCourse: string;
    recommended: string;
  };
};

export default function CourseCard({
  course,
  featured = false,
  labels = { viewCourse: "View Course", recommended: "Recommended for you" },
}: Props) {
  const detailHref = `/courses/${course.slug}`;
  const duration = formatDurationLabel(course.duration);
  const trust = COURSE_TRUST_STATS[course.slug]?.card;

  return (
    <article
      className={`flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-shadow hover:shadow-md ${
        featured
          ? "border-[#c9972c] ring-2 ring-[#c9972c]/30"
          : "border-slate-200"
      }`}
    >
      {featured ? (
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#c9972c]">
          {labels.recommended}
        </p>
      ) : null}

      <div className="flex items-start justify-between gap-3">
        <Link href={detailHref}>
          <h3 className="text-xl font-bold text-[#0d1b35] hover:text-[#c9972c]">
            {course.name}
          </h3>
        </Link>
        <span
          className="shrink-0 rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: levelBadgeColor(course.levelBadge) }}
        >
          {course.levelBadge}
        </span>
      </div>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
        {course.shortDescription}
      </p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500">
        {duration ? <span>{duration}</span> : null}
        {course.price ? <span>{course.price}</span> : null}
      </div>

      {trust ? (
        <p className="mt-3 text-xs font-semibold text-[#0d9488]">{trust}</p>
      ) : null}

      <Link
        href={detailHref}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#c9972c] px-4 py-2.5 text-sm font-semibold text-[#0d1b35] transition-opacity hover:opacity-90"
      >
        {labels.viewCourse}
      </Link>
    </article>
  );
}
