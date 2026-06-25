import { getNextLevelSlug } from "@/lib/course/cefrLevels";
import { getNextProgramTrackSlug, getProgramTrack } from "@/lib/course/programTracks";

export function generateCertificateCode(studentId: string, cefrSubLevel: string) {
  const year = new Date().getFullYear();
  let hash = 0;
  const seed = `${studentId}|${cefrSubLevel}|${Date.now()}`;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return `SPK-${cefrSubLevel.replace(".", "")}-${year}-${String(Math.abs(hash % 100000)).padStart(5, "0")}`;
}

export type GraduationCertificate = {
  certificateCode: string;
  title: string;
  cefrSubLevel: string;
  levelName: string;
  studentName: string;
  score: number;
  issuedDate: string;
  nextLevel: string | null;
  nextLevelSlug: string | null;
};

export function buildGraduationCertificate(input: {
  studentId: string;
  studentName: string;
  cefrSubLevel: string;
  levelName: string;
  levelSlug: string;
  score: number;
}) {
  const code = generateCertificateCode(input.studentId, input.cefrSubLevel);
  const nextSlug = getProgramTrack(input.levelSlug)
    ? getNextProgramTrackSlug(input.levelSlug)
    : getNextLevelSlug(input.levelSlug);

  return {
    certificateCode: code,
    title: `${input.cefrSubLevel} Graduation Certificate`,
    cefrSubLevel: input.cefrSubLevel,
    levelName: input.levelName,
    studentName: input.studentName,
    score: input.score,
    issuedDate: new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    nextLevel: nextSlug
      ? getProgramTrack(nextSlug)?.code ?? nextSlug.toUpperCase().replace("-", ".")
      : null,
    nextLevelSlug: nextSlug,
  } satisfies GraduationCertificate;
}
