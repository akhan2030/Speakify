import { randomUUID } from "crypto";
import OpenAI from "openai";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ASSESSMENTS_TABLE,
  LESSONS_TABLE,
  UNITS_TABLE,
} from "@/lib/db/courseTables";
import {
  PATHWAY_DAYS,
  defaultLessonTitle,
  type PathwayDayType,
} from "@/lib/pathway/dayStructure";
import { getPathwayLevelDisplay } from "@/lib/pathway/levelDisplay";
import { openaiChatWithTimeout } from "@/lib/openaiTimeout";

type LevelRow = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  cefr_sub_level?: string | null;
  week_count?: number | null;
};

type GeneratedWeek = {
  weekNumber: number;
  unitTitle: string;
  days: Array<{
    dayType: PathwayDayType;
    lessonTitle: string;
    estimatedMinutes: number;
  }>;
};

function buildStaticWeeks(level: LevelRow, weekCount: number): GeneratedWeek[] {
  const code = level.cefr_sub_level ?? "B1.1";
  const display = getPathwayLevelDisplay(code, level.description ?? undefined);

  return Array.from({ length: weekCount }, (_, i) => {
    const weekNumber = i + 1;
    return {
      weekNumber,
      unitTitle: `${display.displayName} — Week ${weekNumber}`,
      days: PATHWAY_DAYS.map((day) => ({
        dayType: day.dayType,
        lessonTitle: defaultLessonTitle(day, weekNumber, display.focusAreas),
        estimatedMinutes: day.defaultMinutes,
      })),
    };
  });
}

async function generateWithOpenAI(
  level: LevelRow,
  weekCount: number
): Promise<GeneratedWeek[] | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const code = level.cefr_sub_level ?? "B1.1";
  const display = getPathwayLevelDisplay(code, level.description ?? undefined);

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const dayTypes = PATHWAY_DAYS.map((d) => d.dayType).join(", ");

  try {
    const completion = await openaiChatWithTimeout(openai, {
      model: "gpt-4o-mini",
      temperature: 0.5,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You design IELTS pathway weekly units for Speakify LMS. Return JSON only:
{"weeks":[{"weekNumber":number,"unitTitle":string,"days":[{"dayType":"input"|"practice"|"application"|"review"|"assessment","lessonTitle":string,"estimatedMinutes":number}]}]}
Each week must have exactly 5 days in order: ${dayTypes}. Titles should be specific to the CEFR level and week theme.`,
        },
        {
          role: "user",
          content: `CEFR level: ${code} (${display.displayName})
Focus: ${display.focusAreas}
Weeks to generate: ${weekCount}
Level name: ${level.name}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { weeks?: GeneratedWeek[] };
    if (!Array.isArray(parsed.weeks) || !parsed.weeks.length) return null;

    return parsed.weeks.slice(0, weekCount).map((week, i) => ({
      weekNumber: week.weekNumber ?? i + 1,
      unitTitle: week.unitTitle ?? `Week ${i + 1}`,
      days: PATHWAY_DAYS.map((day) => {
        const fromAi = week.days?.find((d) => d.dayType === day.dayType);
        return {
          dayType: day.dayType,
          lessonTitle:
            fromAi?.lessonTitle ??
            defaultLessonTitle(day, week.weekNumber ?? i + 1, display.focusAreas),
          estimatedMinutes: fromAi?.estimatedMinutes ?? day.defaultMinutes,
        };
      }),
    }));
  } catch (err) {
    console.warn("[generateLevelUnits] OpenAI failed:", err);
    return null;
  }
}

async function ensureAssessment(
  supabase: SupabaseClient,
  levelId: string,
  type: string,
  passScore: number
) {
  const { data: existing } = await supabase
    .from(ASSESSMENTS_TABLE)
    .select("id")
    .eq("level_id", levelId)
    .eq("type", type)
    .maybeSingle();

  if (existing?.id) return;

  await supabase.from(ASSESSMENTS_TABLE).insert({
    id: randomUUID(),
    level_id: levelId,
    type,
    pass_score: passScore,
  });
}

export async function ensureLevelUnits(
  supabase: SupabaseClient,
  level: LevelRow
): Promise<{ generated: boolean; weeks: GeneratedWeek[] }> {
  const { data: existing } = await supabase
    .from(UNITS_TABLE)
    .select("id")
    .eq("level_id", level.id)
    .limit(1);

  if (existing?.length) {
    return { generated: false, weeks: [] };
  }

  const weekCount =
    level.week_count ??
    getPathwayLevelDisplay(level.cefr_sub_level ?? "B1.1").weekCount;

  const weeks =
    (await generateWithOpenAI(level, weekCount)) ??
    buildStaticWeeks(level, weekCount);

  for (const week of weeks) {
    const { data: unit, error: unitError } = await supabase
      .from(UNITS_TABLE)
      .insert({
        id: randomUUID(),
        level_id: level.id,
        title: `Week ${week.weekNumber} — ${week.unitTitle}`,
        week_number: week.weekNumber,
      })
      .select("id")
      .single();

    if (unitError || !unit) {
      console.error("[generateLevelUnits] unit insert", unitError);
      continue;
    }

    for (const day of week.days) {
      const template = PATHWAY_DAYS.find((d) => d.dayType === day.dayType)!;
      await supabase.from(LESSONS_TABLE).insert({
        id: randomUUID(),
        unit_id: unit.id,
        day_type: day.dayType,
        title: day.lessonTitle,
        is_review: template.contentBadge === "review",
      });
    }
  }

  await ensureAssessment(supabase, level.id, "mid_level", 70);
  await ensureAssessment(supabase, level.id, "graduation", 75);

  return { generated: true, weeks };
}
