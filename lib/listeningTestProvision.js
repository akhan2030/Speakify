/**
 * On-demand listening test generation with validation (unlimited fallback when bank is empty).
 */

import { generateListeningSection, getRandomTopic, SECTION_CONFIG } from "./listeningGenerator.js";
import { getPrimaryQuestionType } from "./listeningSectionTypes.js";
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
import {
  normalizeListeningExample,
  validateListeningIntegrity,
} from "./listeningIntegrityValidator.js";

const SECTIONS = [1, 2, 3, 4];
const MAX_GENERATE_ATTEMPTS = 3;

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

  finalized.example = normalizeListeningExample(
    payload.example ?? finalized.example
  );

  const check = validateListeningSectionPayload(finalized, section, {
    ...context,
    logOnFailure: true,
    source: context.source ?? "finalize",
  });
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

  const integrity = validateListeningIntegrity(finalized, section, {
    requireExample: context.source === "live_generate" && section === 1,
  });
  if (!integrity.valid) {
    logListeningValidationFailure({
      ...context,
      sectionNumber: section,
      field: "integrity",
      errors: integrity.errors,
    });
    throw new Error(
      `Section ${section} integrity failed: ${integrity.errors.join("; ")}`
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

  console.info(`[listeningProvision] start section=${section}`);
  const resolvedTopic = topic?.trim() || getRandomTopic(section, []);
  let lastError = null;

  for (let attempt = 1; attempt <= MAX_GENERATE_ATTEMPTS; attempt += 1) {
    try {
      const generated = await generateListeningSection({
        sectionNumber: section,
        topic: resolvedTopic,
        primaryQuestionType:
          getPrimaryQuestionType(section) || config.primaryQuestionType,
        questionCount: 10,
      });

      const finalized = finalizeSectionPayload(generated, section, {
        source: "live_generate",
        topic: resolvedTopic,
        assignedSpeakers: generated.speakers,
        excludeSpeakerPairKeys: [],
      });
      console.info(
        `[listeningProvision] section=${section} generated ok (attempt ${attempt})`
      );
      return finalized;
    } catch (err) {
      lastError = err;
      console.warn(
        `[listeningProvision] section=${section} attempt ${attempt}/${MAX_GENERATE_ATTEMPTS} failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(`Failed to generate valid Section ${section}`);
}

/**
 * Generate a complete 4-section mock (40 questions) with validation.
 */
export async function generateValidatedFullMock() {
  const sections = {};

  for (const sectionNumber of SECTIONS) {
    console.info(`[listeningProvision] full mock — generating section ${sectionNumber}`);
    sections[sectionNumber] = await generateValidatedListeningSection(
      sectionNumber
    );
    console.info(`[listeningProvision] full mock — section ${sectionNumber} done`);
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

  console.info("[listeningProvision] full mock complete");
  return {
    testNumber: Date.now(),
    testId: `live:${Date.now()}`,
    contentType: "full_mock",
    fromBank: false,
    generatedLive: true,
    sections,
  };
}
