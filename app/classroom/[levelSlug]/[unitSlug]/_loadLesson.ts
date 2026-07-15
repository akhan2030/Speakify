import { getLevelBySlug } from "@/lib/classroom/levels";
import { loadUnitContentBySlug } from "@/lib/classroom/contentLoader";
import type { LessonSectionView } from "@/components/classroom/LessonPageClient";

export function loadLessonForPage(
  levelSlug: string,
  unitSlug: string,
  lessonNumber: number | "extra"
): {
  levelSlug: string;
  unitSlug: string;
  lessonNumber: number;
  title: string;
  sections: LessonSectionView[];
} | null {
  const level = getLevelBySlug(levelSlug);
  if (!level) return null;

  const unit = loadUnitContentBySlug(level.slug, unitSlug);
  const num = lessonNumber === "extra" ? 0 : lessonNumber;

  if (!unit) {
    return {
      levelSlug: level.slug,
      unitSlug,
      lessonNumber: num,
      title:
        lessonNumber === "extra"
          ? "Extra activities"
          : `Lesson ${lessonNumber}`,
      sections: [],
    };
  }

  const file =
    lessonNumber === "extra"
      ? unit.lessons.find((l) =>
          /extra/i.test(l.file) || l.data.type === "extra_activities"
        )
      : unit.lessons.find((l) => {
          const n =
            l.data.lessonNumber ??
            Number(l.file.match(/lesson-(\d+)/i)?.[1] ?? 0);
          return n === lessonNumber;
        }) ??
        unit.lessons.find((l) =>
          l.file.toLowerCase().includes(`lesson-${lessonNumber}`)
        );

  const metaTitle =
    lessonNumber === "extra"
      ? unit.meta.lessons?.find((l) => l.type === "extra_activities")?.title
      : unit.meta.lessons?.find((l) => l.lessonNumber === lessonNumber)?.title;

  const sections: LessonSectionView[] = (file?.data.sections ?? []).map(
    (s, i) => ({
      title: s.title,
      sectionType: String(s.sectionType ?? s.type ?? `section-${i}`),
      content: (s.content ?? {}) as Record<string, unknown>,
    })
  );

  return {
    levelSlug: level.slug,
    unitSlug,
    lessonNumber: num,
    title:
      file?.data.title ??
      metaTitle ??
      (lessonNumber === "extra"
        ? "Extra activities"
        : `Lesson ${lessonNumber}`),
    sections,
  };
}
