import {
  COURSE_CATALOG,
  COURSE_CATEGORIES,
  type CourseCatalogItem,
  type CourseCategoryId,
  type CourseLevel,
} from "@/lib/courses/catalog";
import { matchesDurationBucket, type DurationBucket } from "@/lib/courses/duration";
import { filterStepFromCatalog } from "@/lib/step/launchGate";

export type CategoryFilter = "all" | CourseCategoryId;
export type LevelFilter = "all" | CourseLevel;

export function courseMatchesSearch(course: CourseCatalogItem, q: string): boolean {
  if (!q) return true;
  const categoryLabel =
    COURSE_CATEGORIES.find((c) => c.id === course.category)?.label ?? course.category;
  const hay = [
    course.name,
    course.shortDescription,
    course.description,
    course.tagline ?? "",
    course.levelBadge,
    course.category,
    categoryLabel,
    course.duration ?? "",
    course.price ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export function filterCourses(options: {
  query?: string;
  category?: CategoryFilter;
  level?: LevelFilter;
  duration?: DurationBucket;
}): CourseCatalogItem[] {
  const q = String(options.query ?? "")
    .trim()
    .toLowerCase();
  const category = options.category ?? "all";
  const level = options.level ?? "all";
  const duration = options.duration ?? "all";

  return filterStepFromCatalog(
    COURSE_CATALOG.filter((course) => {
      if (category !== "all" && course.category !== category) return false;
      if (level !== "all" && course.levelBadge !== level) return false;
      if (!matchesDurationBucket(course.duration, duration)) return false;
      return courseMatchesSearch(course, q);
    })
  );
}
