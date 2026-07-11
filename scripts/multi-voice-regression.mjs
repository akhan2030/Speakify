/**
 * Regression: multi-speaker listening must bind transcript labels to
 * gender-correct distinct OpenAI voices (Section 1 & 3).
 */
import { getListeningPartsForMock } from "../lib/mock-test/academicMockSkillVariants.ts";
import { bindSpeakersForMultiVoice } from "../lib/listeningMultiVoiceBind.js";
import { MALE_VOICES, FEMALE_VOICES } from "../lib/listeningSpeakerProfiles.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

function checkPart(mockNumber, partIndex, expectedMinSpeakers) {
  const parts = getListeningPartsForMock(mockNumber);
  const part = parts[partIndex];
  const transcript = part.blocks.map((b) => b.transcript).join("\n");
  const bound = bindSpeakersForMultiVoice(transcript, part.partNumber, part.speakers);

  assert(
    bound.length >= expectedMinSpeakers,
    `Mock ${mockNumber} S${part.partNumber}: expected >=${expectedMinSpeakers} speakers, got ${bound.length}`
  );

  const voices = new Set(bound.map((s) => s.voice));
  assert(
    voices.size === bound.length,
    `Mock ${mockNumber} S${part.partNumber}: voices must be distinct, got ${[...voices].join(",")}`
  );

  for (const sp of bound) {
    if (sp.gender === "male") {
      assert(
        MALE_VOICES.has(sp.voice),
        `${sp.label} (${sp.name}) male but voice=${sp.voice}`
      );
    }
    if (sp.gender === "female") {
      assert(
        FEMALE_VOICES.has(sp.voice),
        `${sp.label} (${sp.name}) female but voice=${sp.voice}`
      );
    }
  }

  return bound;
}

console.log("Multi-voice bind regression\n");

// Mock 1 Section 1 — James Henderson is Caller (male)
{
  const bound = checkPart(1, 0, 2);
  const caller = bound.find((s) => /caller/i.test(s.label));
  assert(caller, "Mock 1 S1 must include Caller label");
  assert(caller.gender === "male", `Caller must be male (James), got ${caller.gender}`);
  assert(MALE_VOICES.has(caller.voice), `Caller voice must be male TTS, got ${caller.voice}`);
  console.log("  ok Mock #1 S1: Caller=James →", caller.voice, `(${caller.gender})`);
  console.log(
    "     voices:",
    bound.map((s) => `${s.label}:${s.voice}/${s.gender}`).join(", ")
  );
}

// Mock 2 Section 1 — MindWell
{
  const bound = checkPart(2, 0, 2);
  console.log(
    "  ok Mock #2 S1:",
    bound.map((s) => `${s.label}:${s.voice}/${s.gender}`).join(", ")
  );
}

// Mock 1 Section 3 — Tutor + Hannah + Patrick
{
  const bound = checkPart(1, 2, 3);
  assert(bound.length >= 3, "Section 3 needs 3 speakers");
  const hannah = bound.find((s) => /hannah/i.test(s.label));
  const patrick = bound.find((s) => /patrick/i.test(s.label));
  assert(hannah?.gender === "female", "Hannah must be female");
  assert(patrick?.gender === "male", "Patrick must be male");
  console.log(
    "  ok Mock #1 S3:",
    bound.map((s) => `${s.label}:${s.voice}/${s.gender}`).join(", ")
  );
}

// Section 2 / 4 monologues stay single distinct voice
{
  const s2 = checkPart(1, 1, 1);
  assert(s2.length === 1, "Section 2 should bind to 1 speaker");
  console.log("  ok Mock #1 S2 monologue:", s2[0].label, s2[0].voice);

  const s4 = checkPart(1, 3, 1);
  assert(s4.length === 1, "Section 4 should bind to 1 speaker");
  console.log("  ok Mock #1 S4 monologue:", s4[0].label, s4[0].voice);
}

console.log("\nAll multi-voice checks passed.");
