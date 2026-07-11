import { getListeningPartsForMock } from "../lib/mock-test/academicMockSkillVariants.ts";
import {
  parseTranscriptIntoSegments,
  getVoiceForSpeaker,
} from "../lib/listeningTranscriptParse.js";
import { getSpeakerProfileByLabel } from "../lib/listeningSpeakerProfiles.js";

const parts = getListeningPartsForMock(1);
const s1 = parts[0];
console.log("speakers", JSON.stringify(s1.speakers, null, 2));
const block = s1.blocks[0];
const segs = parseTranscriptIntoSegments(block.transcript, 1).filter(
  (s) => s.type === "speech"
);
const unique = [...new Set(segs.map((s) => s.speaker))];
console.log("labels in transcript", unique);
for (const lab of unique) {
  const profile = getSpeakerProfileByLabel(lab, 1, s1.speakers);
  const voice = getVoiceForSpeaker(lab, 1, s1.speakers);
  console.log(
    lab,
    "-> profile",
    profile?.label,
    profile?.name,
    profile?.gender,
    profile?.voice,
    "| resolved voice",
    voice
  );
}

const s3 = parts[2];
console.log("\n--- Section 3 ---");
console.log("speakers", JSON.stringify(s3.speakers, null, 2));
const b3 = s3.blocks[0];
const segs3 = parseTranscriptIntoSegments(b3.transcript, 3).filter(
  (s) => s.type === "speech"
);
const unique3 = [...new Set(segs3.map((s) => s.speaker))];
console.log("labels", unique3);
for (const lab of unique3) {
  const profile = getSpeakerProfileByLabel(lab, 3, s3.speakers);
  const voice = getVoiceForSpeaker(lab, 3, s3.speakers);
  console.log(lab, "->", profile?.name, profile?.gender, voice);
}
