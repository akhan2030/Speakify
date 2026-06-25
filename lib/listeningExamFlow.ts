import { getGlobalQuestionRange } from "./listeningIeltsInstructions";

export const PREP_SECONDS = 30;

export const CHECK_SECONDS_SECTIONS_1_3 = 30;

export const CHECK_SECONDS_SECTION_4 = 60;

/** @deprecated — no longer used; section starts with TTS announcement instead */
export const SECTION_TRANSITION_SECONDS = 0;

/** @deprecated */
export const PREVIEW_SECONDS = PREP_SECONDS;

/** @deprecated */
export const BREAK_PREVIEW_SECONDS = PREP_SECONDS;

export type ExamFlowPhase =
  | "announcement"
  | "prep"
  | "playing"
  | "checking"
  | "submitting"
  | "results";

import { getSectionQuestionBlocks } from "./listeningSectionTypes";
import {
  assertNoQuestionZeroInUserText,
  formatSpokenQuestionRange,
  normalizeUserFacingRange,
  toUserQuestionNumber,
} from "./listeningUserFacingValidation.js";

export {
  assertNoQuestionZeroInUserText,
  formatSpokenQuestionRange,
  toUserQuestionNumber,
};

/** Display headers: "1–5" */
export function formatQuestionRange(start: number, end: number) {
  const { start: s, end: e } = normalizeUserFacingRange(start, end);
  return `${s}–${e}`;
}

/** Official IELTS examiner script (voice: alloy) — ranges match question blocks on screen */
export function getOfficialSectionStartAnnouncement(
  sectionNumber: number
): string {
  const blocks = getSectionQuestionBlocks(sectionNumber);
  const first = blocks[0];
  const last = blocks[blocks.length - 1];
  const firstRange = first
    ? formatSpokenQuestionRange(first.start, first.end)
    : "the questions";
  const fullRange = last
    ? formatSpokenQuestionRange(first?.start ?? 1, last.end)
    : firstRange;

  let script: string;
  switch (sectionNumber) {
    case 1:
      script = `This is the IELTS Listening test. Section 1. You will hear a conversation between two people. First, you have some time to look at ${firstRange}.`;
      break;
    case 2:
      script = `Section 2. You will hear a talk by one person. First, you have some time to look at ${firstRange}.`;
      break;
    case 3:
      script = `Section 3. You will hear a conversation among up to three people. First, you have some time to look at ${firstRange}.`;
      break;
    case 4:
      script = `Section 4. You will hear a university lecture. You now have some time to look at ${fullRange}. As you listen, answer ${fullRange}.`;
      break;
    default:
      script = `Section ${sectionNumber}. Look at ${firstRange}.`;
  }

  assertNoQuestionZeroInUserText(script);
  return script;
}

export function getCheckSeconds(sectionNumber: number) {
  return sectionNumber === 4
    ? CHECK_SECONDS_SECTION_4
    : CHECK_SECONDS_SECTIONS_1_3;
}

/** Sections 1–3 use prep between question-type groups */
export function sectionUsesGroupPrep(sectionNumber: number) {
  return sectionNumber >= 1 && sectionNumber <= 3;
}

/** @deprecated */
export function usesTwoPartFlow(sectionNumber: number) {
  return sectionUsesGroupPrep(sectionNumber);
}

export function getPrepAnnouncement(
  sectionNumber: number,
  rangeStart: number,
  rangeEnd: number,
  isFirstGroupInSection: boolean
) {
  if (isFirstGroupInSection) {
    const lead = getOfficialSectionStartAnnouncement(sectionNumber);
    return { lead, detail: "" };
  }

  const lead = `Now, you have some time to look at ${formatSpokenQuestionRange(
    rangeStart,
    rangeEnd
  )}.`;
  assertNoQuestionZeroInUserText(lead);
  return { lead, detail: "" };
}

export function getSection4PreviewAnnouncement() {
  const global = getGlobalQuestionRange(4);
  return {
    lead: "You will now hear Section 4.",
    detail: `Answer questions ${global.start} to ${global.end} as you listen.`,
  };
}

export function getCheckAnnouncement(sectionNumber: number) {
  if (sectionNumber === 4) {
    return {
      lead: "That is the end of Section 4.",
      detail: "You now have one minute to check your answers.",
    };
  }

  return {
    lead: `You now have ${CHECK_SECONDS_SECTIONS_1_3} seconds to check your answers to Section ${sectionNumber}.`,
    detail: "",
  };
}

/** @deprecated */
export function getSectionTransitionAnnouncement(sectionNumber: number) {
  return {
    lead: `You will now hear Section ${sectionNumber}.`,
    detail: "",
  };
}

/** @deprecated */
export function getPreviewAnnouncement(
  sectionNumber: number,
  rangeStart: number,
  rangeEnd: number
) {
  if (sectionNumber === 4) {
    return getSection4PreviewAnnouncement();
  }
  return getPrepAnnouncement(sectionNumber, rangeStart, rangeEnd, true);
}

/** @deprecated */
export function getBreakAnnouncement(rangeStart: number, rangeEnd: number) {
  return getPrepAnnouncement(1, rangeStart, rangeEnd, false);
}
