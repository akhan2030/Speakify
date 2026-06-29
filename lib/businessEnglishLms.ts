export const BUSINESS_ENGLISH_PROGRAMME = "business_english";

export type BusinessEnglishLessonStatus = "available" | "locked" | "completed";

export type BusinessEnglishLesson = {
  id: string;
  module_id: string;
  title: string;
  description: string;
  duration_minutes: number;
  order_number: number;
  status: BusinessEnglishLessonStatus;
};

export type BusinessEnglishModule = {
  id: string;
  programme: string;
  title: string;
  slug: string;
  cefr_level: string;
  module_number: number;
  week_start: number;
  week_end: number;
  description: string;
  lessons: BusinessEnglishLesson[];
};

export function mapBusinessEnglishLesson(row: {
  id: string;
  module_id: string;
  title: string;
  description?: string | null;
  duration_minutes: number;
  order_number: number;
  status: string;
}): BusinessEnglishLesson {
  return {
    id: row.id,
    module_id: row.module_id,
    title: row.title,
    description: row.description ?? "",
    duration_minutes: row.duration_minutes,
    order_number: row.order_number,
    status: row.status as BusinessEnglishLessonStatus,
  };
}

export function mapBusinessEnglishModule(
  row: {
    id: string;
    programme: string;
    title: string;
    slug: string;
    cefr_level: string;
    module_number: number;
    week_start: number;
    week_end: number;
    description?: string | null;
  },
  lessons: BusinessEnglishLesson[] = []
): BusinessEnglishModule {
  return {
    id: row.id,
    programme: row.programme,
    title: row.title,
    slug: row.slug,
    cefr_level: row.cefr_level,
    module_number: row.module_number,
    week_start: row.week_start,
    week_end: row.week_end,
    description: row.description ?? "",
    lessons: [...lessons].sort((a, b) => a.order_number - b.order_number),
  };
}

export function formatWeekRange(weekStart: number, weekEnd: number) {
  if (weekStart === weekEnd) return `Week ${weekStart}`;
  return `Weeks ${weekStart}–${weekEnd}`;
}

export function lessonStatusLabel(status: string) {
  switch (status) {
    case "available":
      return "Available";
    case "completed":
      return "Completed";
    case "locked":
    default:
      return "Locked";
  }
}

export async function fetchBusinessEnglishModules(
  supabase: ReturnType<typeof import("@/lib/vocabularySupabase").getSupabase>
) {
  const { data: modules, error: modulesError } = await supabase
    .from("business_english_modules")
    .select(
      "id, programme, title, slug, cefr_level, module_number, week_start, week_end, description"
    )
    .eq("programme", BUSINESS_ENGLISH_PROGRAMME)
    .order("module_number", { ascending: true });

  if (modulesError) throw modulesError;
  if (!modules?.length) return [] as BusinessEnglishModule[];

  const moduleIds = modules.map((m) => m.id);
  const { data: lessons, error: lessonsError } = await supabase
    .from("business_english_lessons")
    .select(
      "id, module_id, title, description, duration_minutes, order_number, status"
    )
    .in("module_id", moduleIds)
    .order("order_number", { ascending: true });

  if (lessonsError) throw lessonsError;

  const lessonsByModule: Record<string, BusinessEnglishLesson[]> = {};
  for (const lesson of lessons ?? []) {
    const mapped = mapBusinessEnglishLesson(lesson);
    if (!lessonsByModule[mapped.module_id]) lessonsByModule[mapped.module_id] = [];
    lessonsByModule[mapped.module_id].push(mapped);
  }

  return modules.map((module) =>
    mapBusinessEnglishModule(module, lessonsByModule[module.id] ?? [])
  );
}
