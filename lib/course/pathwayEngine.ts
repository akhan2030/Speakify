import {

  bandToCefr,

  generateStudyPlan,

  getRecommendedCourse,

  roundToHalfBand,

} from "@/lib/placement/scoring";

import {

  buildRoadmapWeeks,

  getEstimatedTimeline,

  getRecommendedProgram,

} from "@/lib/placement/certificate";

import { parseTargetBandNumeric } from "@/lib/placement/onboarding";

import type { PlacementOnboarding } from "@/lib/placement/onboarding";

import type { PlacementResult } from "@/lib/placement/types";

import {

  bandToCefrSubLevelSlug,

  getCefrLevel,

  CEFR_SUB_LEVELS,

} from "@/lib/course/cefrLevels";

import {

  bandToProgramTrackSlug,

  getProgramTrack,

  PROGRAM_TRACKS,

  type ProgramTrack,

} from "@/lib/course/programTracks";



export type CourseLevelSlug = ProgramTrack["slug"] | (typeof CEFR_SUB_LEVELS)[number]["slug"];



export type JourneyStep = {

  order: number;

  phase: string;

  title: string;

  description: string;

  skill?: string;

  duration: string;

  href?: string;

};



export type PathwayRecommendation = {

  levelSlug: CourseLevelSlug;

  trackCode: string;

  trackWeekCount: number;

  cefrCode: string;

  cefrSubLevelSlug: string;

  levelName: string;

  levelDescription: string;

  programName: string;

  cefr: string;

  cefrLabel: string;

  courseHref: string;

  currentBand: number;

  targetBand: number;

  bandGap: number;

  estimatedTimeline: string;

  weakAreas: string[];

  strongAreas: string[];

  journeySteps: JourneyStep[];

  studyPlanWeeks: ReturnType<typeof generateStudyPlan>;

  enrollmentCta: string;

  dashboardHref: string;

};



const ALL_VALID_SLUGS = new Set<string>([

  ...PROGRAM_TRACKS.map((t) => t.slug),

  ...CEFR_SUB_LEVELS.map((l) => l.slug),

]);



export function bandToLevelSlug(band: number): CourseLevelSlug {

  return bandToProgramTrackSlug(band) as CourseLevelSlug;

}



export function isValidLevelSlug(slug: string): slug is CourseLevelSlug {

  return ALL_VALID_SLUGS.has(slug);

}



function skillDashboardHref(skill: string): string {

  const map: Record<string, string> = {

    vocabulary: "/dashboard/student/vocabulary",

    grammar: "/dashboard/student/grammar",

    reading: "/dashboard/student/reading",

    writing: "/dashboard/student/writing",

    writing_prompt: "/dashboard/student/writing",

    listening: "/dashboard/student/listening",

    speaking: "/dashboard/student/speaking",

  };

  return map[skill.toLowerCase()] ?? "/dashboard/student";

}



function buildJourneySteps(

  result: PlacementResult,

  targetBand: number,

  track: ReturnType<typeof getProgramTrack>

): JourneyStep[] {

  const roadmap = buildRoadmapWeeks(result.weakAreas);

  const skillFocus = result.weakAreas.slice(0, 3);

  const weekCount = track?.weekCount ?? 6;



  const steps: JourneyStep[] = roadmap.slice(0, weekCount).map((week, index) => ({

    order: index + 1,

    phase: week.phase,

    title: `Week ${week.week}: ${week.phase}`,

    description: week.focus,

    duration: "1 week",

    href: skillFocus[index]

      ? skillDashboardHref(skillFocus[index])

      : "/dashboard/student",

  }));



  if (steps.length < weekCount) {

    for (let w = steps.length + 1; w <= weekCount; w += 1) {

      steps.push({

        order: w,

        phase: "Track",

        title: `Week ${w}: Integrated practice`,

        description: "Weekly lessons with 70% review and 30% new content.",

        duration: "1 week",

        href: track ? `/dashboard/student/course/${track.slug}/week/${w}` : undefined,

      });

    }

  }



  const trackSlug = track?.slug ?? bandToProgramTrackSlug(result.overallBand);

  steps.push({

    order: steps.length + 1,

    phase: "Graduation",

    title: `Reach Band ${targetBand.toFixed(1)}`,

    description: `Complete the ${track?.code ?? "program"} track and pass the graduation exam for your certificate.`,

    duration: getEstimatedTimeline(Math.max(0, targetBand - result.overallBand)),

    href: `/dashboard/student/course/${trackSlug}`,

  });



  return steps;

}



export function buildPathwayRecommendation(

  result: PlacementResult,

  onboarding?: PlacementOnboarding | null

): PathwayRecommendation {

  const course = getRecommendedCourse(result.overallBand);

  const levelSlug = bandToLevelSlug(result.overallBand);

  const programTrack = getProgramTrack(levelSlug);

  const cefrSubLevelSlug = bandToCefrSubLevelSlug(result.overallBand);

  const cefrLevel = getCefrLevel(cefrSubLevelSlug);

  const cefrInfo = bandToCefr(result.overallBand);

  const currentBand = result.overallBand;

  const targetBand =

    parseTargetBandNumeric(onboarding?.targetBandScore ?? "") ??

    Math.min(9, roundToHalfBand(currentBand + 1));

  const bandGap = Math.max(0, roundToHalfBand(targetBand - currentBand));



  return {

    levelSlug,

    trackCode: programTrack?.code ?? "Track",

    trackWeekCount: programTrack?.weekCount ?? 6,

    cefrCode: cefrLevel?.code ?? cefrInfo.cefr,

    cefrSubLevelSlug,

    levelName: programTrack?.name ?? course.name,

    levelDescription: programTrack?.description ?? course.description,

    programName: getRecommendedProgram(currentBand),

    cefr: cefrLevel?.cefr ?? cefrInfo.cefr,

    cefrLabel: cefrInfo.label,

    currentBand,

    targetBand,

    bandGap,

    estimatedTimeline: getEstimatedTimeline(bandGap),

    weakAreas: result.weakAreas,

    strongAreas: result.strongAreas,

    journeySteps: buildJourneySteps(result, targetBand, programTrack),

    studyPlanWeeks: generateStudyPlan(result),

    enrollmentCta: `Start ${programTrack?.code ?? course.name} Track`,

    courseHref: `/dashboard/student/course/${levelSlug}`,

    dashboardHref: "/dashboard/student",

  };

}


