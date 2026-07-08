import {
  normalizeProgramType,
  resolveStudentProgramType,
  type ProgramType,
} from "@/lib/programType";
import { resolvePaidProgramme } from "@/lib/payments/checkoutLabels";

export type IeltsProgramVariant = "ielts" | "ielts_general";

const VARIANT_LABELS: Record<IeltsProgramVariant, string> = {
  ielts: "IELTS Academic",
  ielts_general: "IELTS General Training",
};

const SIDEBAR_PROGRAM_LABELS: Record<IeltsProgramVariant, string> = {
  ielts: "IELTS Academic Accelerator",
  ielts_general: "IELTS General Training Accelerator",
};

/** Resolve Academic vs GT from session / enrollment fields. */
export function resolveIeltsProgramVariant(input: {
  programType?: unknown;
  enrolledPrograms?: unknown;
  programSelected?: unknown;
  /** Dashboard path fallback when session fields are sparse */
  pathFallback?: IeltsProgramVariant;
}): IeltsProgramVariant {
  const resolved = resolveStudentProgramType({
    programType: input.programType,
    enrolledPrograms: input.enrolledPrograms,
    programSelected: input.programSelected,
  });

  if (resolved === "ielts_general") return "ielts_general";
  if (resolved === "ielts") return "ielts";

  if (input.pathFallback) return input.pathFallback;

  const paid = resolvePaidProgramme({
    enrolledPrograms: input.enrolledPrograms,
    programSelected:
      typeof input.programSelected === "string" ? input.programSelected : null,
  });
  return paid;
}

export function getIeltsVariantLabel(variant: IeltsProgramVariant): string {
  return VARIANT_LABELS[variant];
}

export function getIeltsSidebarProgramLabel(variant: IeltsProgramVariant): string {
  return SIDEBAR_PROGRAM_LABELS[variant];
}

export function formatIeltsTrackBadge(trackName: string): string {
  const trimmed = String(trackName ?? "").trim();
  if (!trimmed) return "Accelerator Track";
  return `${trimmed} Track`;
}

/** e.g. "IELTS Academic Accelerator — Plus Track" */
export function formatIeltsProgramHeader(
  variant: IeltsProgramVariant,
  trackName: string
): { programLine: string; trackBadge: string } {
  return {
    programLine: getIeltsSidebarProgramLabel(variant),
    trackBadge: formatIeltsTrackBadge(trackName),
  };
}

export function programTypeToIeltsVariant(
  programType: ProgramType | string | null | undefined
): IeltsProgramVariant {
  return normalizeProgramType(programType) === "ielts_general"
    ? "ielts_general"
    : "ielts";
}

/** Safe display when enrollment is unknown — never blank. */
export function resolveIeltsProgramDisplay(input: {
  programType?: unknown;
  enrolledPrograms?: unknown;
  programSelected?: unknown;
  pathFallback: IeltsProgramVariant;
  trackName?: string;
}): { variant: IeltsProgramVariant; programLine: string; trackBadge: string } {
  const variant = resolveIeltsProgramVariant({
    programType: input.programType,
    enrolledPrograms: input.enrolledPrograms,
    programSelected: input.programSelected,
    pathFallback: input.pathFallback,
  });
  const { programLine, trackBadge } = formatIeltsProgramHeader(
    variant,
    input.trackName ?? "Plus"
  );
  return { variant, programLine, trackBadge };
}
