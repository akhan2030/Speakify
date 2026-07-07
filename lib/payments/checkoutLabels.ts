import type { AcceleratorTrackId } from "@/lib/accelerator/tracks";
import { ACCELERATOR_TRACKS } from "@/lib/accelerator/tracks";

export type PaidProgramme = "ielts" | "ielts_general";

/** Resolve the paid programme from enrolled_programs or program_selected. */
export function resolvePaidProgramme(input: {
  enrolledPrograms?: unknown;
  programSelected?: string | null;
}): PaidProgramme {
  const programs = Array.isArray(input.enrolledPrograms)
    ? input.enrolledPrograms.map((p) => String(p).trim().toLowerCase())
    : [];

  if (programs.includes("ielts_general")) return "ielts_general";

  const selected = String(input.programSelected ?? "").trim().toLowerCase();
  if (selected === "ielts_general") return "ielts_general";

  return "ielts";
}

export function checkoutTrackLabel(
  programme: PaidProgramme,
  track: AcceleratorTrackId
): string {
  const meta = ACCELERATOR_TRACKS[track];
  if (programme === "ielts_general") {
    return `IELTS General ${meta.name}`;
  }
  return `IELTS ${meta.name}`;
}

export function checkoutPaymentDescription(
  programme: PaidProgramme,
  track: AcceleratorTrackId
): string {
  const meta = ACCELERATOR_TRACKS[track];
  if (programme === "ielts_general") {
    return `Speakify IELTS General ${meta.name}`;
  }
  return `Speakify IELTS ${meta.name}`;
}
