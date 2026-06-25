import Link from "next/link";
import { levelBadgeColor, type CourseCatalogItem } from "@/lib/courses/catalog";

type Props = {
  course: CourseCatalogItem;
};

export default function CourseCard({ course }: Props) {
  const detailHref = `/courses/${course.slug}`;

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
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

      <Link
        href={detailHref}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-[#c9972c] px-4 py-2.5 text-sm font-semibold text-[#0d1b35] transition-opacity hover:opacity-90"
      >
        View Course
      </Link>
    </article>
  );
}
