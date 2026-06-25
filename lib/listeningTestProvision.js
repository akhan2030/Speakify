/**
 * On-demand listening test generation with validation (unlimited fallback when bank is empty).
 */

import { generateListeningSection, getRandomTopic, SECTION_CONFIG } from "./listeningGenerator.js";
import {
  logListeningValidationFailure,
  validateFullMockPayload,
  validateListeningSectionPayload,
} from "./listeningUserFacingValidation.js";
import { prepareTranscriptForListening } from "./listeningSpeakerAlignment.js";
import { normalizeSpeakersFromPayload } from "./listeningSpeakerProfiles.js";
import { normalizeSectionQuestions } from "./listeningSectionNormalize.js";
import {
  applySpeakerIdentitiesToPayload,
  assertSpeakerIdentitiesValid,
} from "./listeningSpeakerIdentity.js";

const SECTIONS = [1, 2, 3, 4];

/**
 * @param {object} payload
 * @param {number} sectionNumber
 * @param {object} [context]
 */
export function finalizeSectionPayload(payload, sectionNumber, context = {}) {
  const section = Number(sectionNumber);
  const speakers = normalizeSpeakersFromPayload(
    payload.speakers ?? [],
    section,
    context.assignedSpeakers?.length
      ? { assignedSpeakers: context.assignedSpeakers }
      : {}
  );
  const questions = normalizeSectionQuestions(
    payload.questions ?? [],
    section
  );
  const testSeed =
    context.testSeed ??
    `finalize-s${section}-${context.source ?? "unknown"}-${Date.now()}`;

  let finalized = applySpeakerIdentitiesToPayload(
    {
      ...payload,
      section,
      speakers,
      questions,
      transcript: String(payload.transcript ?? ""),
    },
    {
      testSeed,
      source: context.source ?? "finalize",
      excludePairKeys: context.excludeSpeakerPairKeys ?? [],
    }
  );

  finalized.transcript = prepareTranscriptForListening(
    finalized.transcript,
    section,
    finalized.speakers
  );

  assertSpeakerIdentitiesValid(finalized, section);

  const check = validateListeningSectionPayload(finalized, section);
  if (!check.valid) {
    logListeningValidationFailure({
      ...context,
      sectionNumber: section,
      field: "section_payload",
      errors: check.errors,
    });
    throw new Error(
      `Section ${section} validation failed: ${check.errors.join("; ")}`
    );
  }

  return finalized;
}

/**
 * @param {number} sectionNumber
 * @param {string} [topic]
 */
export async function generateValidatedListeningSection(
  sectionNumber,
  topic
) {
  const section = Number(sectionNumber);
  const config = SECTION_CONFIG[section];
  if (!config) {
    throw new Error(`Invalid section: ${section}`);
  }

  const resolvedTopic = topic?.trim() || getRandomTopic(section, []);
  const generated = await generateListeningSection({
    sectionNumber: section,
    topic: resolvedTopic,
    primaryQuestionType: config.primaryQuestionType,
    questionCount: 10,
  });

  return finalizeSectionPayload(generated, section, {
    source: "live_generate",
    topic: resolvedTopic,
    assignedSpeakers: generated.speakers,
    excludeSpeakerPairKeys: [],
  });
}

/**
 * Generate a complete 4-section mock (40 questions) with validation.
 */
export async function generateValidatedFullMock() {
  const sections = {};

  for (const sectionNumber of SECTIONS) {
    sections[sectionNumber] = await generateValidatedListeningSection(
      sectionNumber
    );
  }

  const mockCheck = validateFullMockPayload(sections);
  if (!mockCheck.valid) {
    logListeningValidationFailure({
      source: "live_generate",
      contentType: "full_mock",
      field: "full_mock",
      errors: mockCheck.errors,
    });
    throw new Error(
      `Full mock validation failed: ${mockCheck.errors.join("; ")}`
    );
  }

  return {
    testNumber: Date.now(),
    testId: `live:${Date.now()}`,
    contentType: "full_mock",
    fromBank: false,
    generatedLive: true,
    sections,
  };
}
