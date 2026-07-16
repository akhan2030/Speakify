"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import CourseCard from "@/components/courses/CourseCard";
import PathwayLevelGrid from "@/components/courses/PathwayLevelGrid";
import {
  COURSE_CATEGORIES,
  COURSE_CATALOG,
  getCoursesByCategory,
  getIeltsAcademicCourses,
  getIeltsGeneralCourses,
  getOtherTestPrepCourses,
  type CourseCatalogItem,
  type CourseCategoryId,
  type CourseLevel,
} from "@/lib/courses/catalog";
import {
  DURATION_FILTER_OPTIONS,
  matchesDurationBucket,
  type DurationBucket,
} from "@/lib/courses/duration";
import { HUB_HERO_TRUST } from "@/lib/courses/trustStats";
import { useMarketingLocale } from "@/components/marketing/MarketingLocale";

type Props = {
  recommended?: {
    course: CourseCatalogItem;
    placementBand: number;
  } | null;
};

type CategoryFilter = "all" | CourseCategoryId;
type LevelFilter = "all" | CourseLevel;

function courseMatchesSearch(course: CourseCatalogItem, q: string): boolean {
  if (!q) return true;
  const hay = [
    course.name,
    course.shortDescription,
    course.tagline ?? "",
    course.levelBadge,
    course.category,
    course.duration ?? "",
  ]
    .join(" ")
    .toLowerCase();
  return hay.includes(q);
}

export default function CoursesHub({ recommended = null }: Props) {
  const { t, dir } = useMarketingLocale();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [duration, setDuration] = useState<DurationBucket>("all");

  const q = query.trim().toLowerCase();
  const filtering = Boolean(q || category !== "all" || level !== "all" || duration !== "all");

  const filtered = useMemo(() => {
    return COURSE_CATALOG.filter((course) => {
      if (category !== "all" && course.category !== category) return false;
      if (level !== "all" && course.levelBadge !== level) return false;
      if (!matchesDurationBucket(course.duration, duration)) return false;
      return courseMatchesSearch(course, q);
    });
  }, [category, level, duration, q]);

  const ieltsAcademic = getIeltsAcademicCourses().filter((c) =>
    filtered.some((f) => f.slug === c.slug)
  );
  const ieltsGeneral = getIeltsGeneralCourses().filter((c) =>
    filtered.some((f) => f.slug === c.slug)
  );
  const otherTestPrep = getOtherTestPrepCourses().filter((c) =>
    filtered.some((f) => f.slug === c.slug)
  );

  const selectClass =
    "rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none focus:border-[#c9972c] focus:ring-1 focus:ring-[#c9972c]";

  return (
    <div dir={dir}>
      <section className="relative overflow-hidden bg-[#0d1b35] px-4 py-12 sm:px-6 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 20% 20%, rgba(201,151,44,0.25), transparent), radial-gradient(ellipse 60% 50% at 90% 80%, rgba(13,148,136,0.2), transparent)",
          }}
        />
        <div className="relative mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#c9972c]">
              {t("hub.eyebrow")}
            </p>
            <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
              {t("hub.title")}
            </h1>
            <p className="mt-3 text-base text-slate-300 sm:text-lg">
              {t("hub.subtitle")}
            </p>
            <p className="mt-4 inline-flex max-w-xl rounded-xl border border-[#c9972c]/40 bg-[#c9972c]/10 px-4 py-3 text-sm font-medium text-[#f5e6c8]">
              {HUB_HERO_TRUST}
            </p>
          </div>

          <div className="mt-8 grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm sm:grid-cols-2 lg:grid-cols-4">
            <label className="block sm:col-span-2 lg:col-span-4">
              <span className="sr-only">{t("hub.search")}</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("hub.searchPlaceholder")}
                className="w-full rounded-xl border border-white/20 bg-white px-4 py-3 text-sm text-[#0d1b35] outline-none placeholder:text-slate-400 focus:border-[#c9972c] focus:ring-2 focus:ring-[#c9972c]/40"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {t("hub.filterCategory")}
              </span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CategoryFilter)}
                className={`w-full ${selectClass}`}
              >
                <option value="all" className="text-[#0d1b35]">
                  {t("hub.allCategories")}
                </option>
                {COURSE_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id} className="text-[#0d1b35]">
                    {t(`category.${c.id}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {t("hub.filterLevel")}
              </span>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value as LevelFilter)}
                className={`w-full ${selectClass}`}
              >
                <option value="all" className="text-[#0d1b35]">
                  {t("hub.allLevels")}
                </option>
                {(["Beginner", "Intermediate", "Advanced"] as CourseLevel[]).map((l) => (
                  <option key={l} value={l} className="text-[#0d1b35]">
                    {t(`level.${l}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="block sm:col-span-2 lg:col-span-2">
              <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {t("hub.filterDuration")}
              </span>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value as DurationBucket)}
                className={`w-full ${selectClass}`}
              >
                {DURATION_FILTER_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="text-[#0d1b35]">
                    {t(`duration.${opt.id}`)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href="/placement-test"
              className="rounded-xl bg-[#c9972c] px-5 py-2.5 text-sm font-semibold text-[#0d1b35] hover:opacity-95"
            >
              {t("hub.placementCta")}
            </Link>
            {filtering ? (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setCategory("all");
                  setLevel("all");
                  setDuration("all");
                }}
                className="text-sm font-medium text-slate-300 underline-offset-2 hover:text-white hover:underline"
              >
                {t("hub.clearFilters")} ({filtered.length})
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        {recommended ? (
          <section className="mb-12 rounded-2xl border border-[#c9972c]/40 bg-[#fffbeb] p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-wider text-[#c9972c]">
              {t("hub.recommendedEyebrow")}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-[#0d1b35]">
              {t("hub.recommendedTitle")}
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              {t("hub.recommendedBody").replace(
                "{band}",
                recommended.placementBand.toFixed(1)
              )}
            </p>
            <div className="mt-6 max-w-md">
              <CourseCard
                course={recommended.course}
                featured
                labels={{
                  viewCourse: t("hub.viewCourse"),
                  recommended: t("hub.recommendedBadge"),
                }}
              />
            </div>
          </section>
        ) : null}

        {filtering ? (
          <section>
            <h2 className="mb-6 text-2xl font-bold text-[#0d1b35]">
              {t("hub.results")} ({filtered.length})
            </h2>
            {filtered.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                {t("hub.noResults")}
              </p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((course) => (
                  <CourseCard
                    key={course.slug}
                    course={course}
                    featured={recommended?.course.slug === course.slug}
                    labels={{
                      viewCourse: t("hub.viewCourse"),
                      recommended: t("hub.recommendedBadge"),
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          COURSE_CATEGORIES.map((cat) => {
            if (cat.id === "test-prep") {
              if (
                ieltsAcademic.length + ieltsGeneral.length + otherTestPrep.length ===
                0
              ) {
                return null;
              }
              return (
                <section key={cat.id} id={cat.id} className="mb-14">
                  <div className="mb-6 border-b border-slate-200 pb-4">
                    <h2 className="text-2xl font-bold text-[#0d1b35]">
                      {t(`category.${cat.id}`)}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {t(`categoryDesc.${cat.id}`)}
                    </p>
                  </div>

                  {ieltsAcademic.length > 0 ? (
                    <>
                      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-[#0d1b35]">
                            {t("hub.ieltsAcademic")}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {t("hub.ieltsAcademicDesc")}
                          </p>
                        </div>
                        <Link
                          href="/courses/ielts"
                          className="text-sm font-semibold text-[#c9972c] hover:underline"
                        >
                          {t("hub.viewAllAcademic")}
                        </Link>
                      </div>
                      <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {ieltsAcademic.map((course) => (
                          <CourseCard
                            key={course.slug}
                            course={course}
                            featured={recommended?.course.slug === course.slug}
                            labels={{
                              viewCourse: t("hub.viewCourse"),
                              recommended: t("hub.recommendedBadge"),
                            }}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}

                  {ieltsGeneral.length > 0 ? (
                    <>
                      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <h3 className="text-lg font-bold text-[#0d1b35]">
                            {t("hub.ieltsGt")}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {t("hub.ieltsGtDesc")}
                          </p>
                        </div>
                        <Link
                          href="/courses/ielts-gt"
                          className="text-sm font-semibold text-[#c9972c] hover:underline"
                        >
                          {t("hub.viewAllGt")}
                        </Link>
                      </div>
                      <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {ieltsGeneral.map((course) => (
                          <CourseCard
                            key={course.slug}
                            course={course}
                            featured={recommended?.course.slug === course.slug}
                            labels={{
                              viewCourse: t("hub.viewCourse"),
                              recommended: t("hub.recommendedBadge"),
                            }}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}

                  {otherTestPrep.length > 0 ? (
                    <>
                      <h3 className="mb-4 text-lg font-bold text-[#0d1b35]">
                        {t("hub.otherTestPrep")}
                      </h3>
                      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {otherTestPrep.map((course) => (
                          <CourseCard
                            key={course.slug}
                            course={course}
                            labels={{
                              viewCourse: t("hub.viewCourse"),
                              recommended: t("hub.recommendedBadge"),
                            }}
                          />
                        ))}
                      </div>
                    </>
                  ) : null}
                </section>
              );
            }

            const courses = getCoursesByCategory(cat.id).filter((c) =>
              filtered.some((f) => f.slug === c.slug)
            );
            if (courses.length === 0 && cat.id !== "general-english") return null;

            return (
              <section key={cat.id} id={cat.id} className="mb-14 last:mb-0">
                <div className="mb-6 border-b border-slate-200 pb-4">
                  <h2 className="text-2xl font-bold text-[#0d1b35]">
                    {t(`category.${cat.id}`)}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {t(`categoryDesc.${cat.id}`)}
                  </p>
                </div>
                {courses.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.map((course) => (
                      <CourseCard
                        key={course.slug}
                        course={course}
                        labels={{
                          viewCourse: t("hub.viewCourse"),
                          recommended: t("hub.recommendedBadge"),
                        }}
                      />
                    ))}
                  </div>
                ) : null}
                {cat.id === "general-english" ? (
                  <PathwayLevelGrid
                    title={t("hub.pathwayGridTitle")}
                    subtitle={t("hub.pathwayGridSubtitle")}
                    weeksLabel={t("hub.pathwayWeeks")}
                    ctaLabel={t("hub.pathwayCta")}
                  />
                ) : null}
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
