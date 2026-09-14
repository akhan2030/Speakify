import { getAcademicListeningTest1ExamParts, getAcademicListeningTest1SkillMock } from "./academicTest1Pack";
import { getAcademicListeningTest2ExamParts, getAcademicListeningTest2SkillMock } from "./academicTest2Pack";
import { getAcademicListeningTest3ExamParts, getAcademicListeningTest3SkillMock } from "./academicTest3Pack";
import { getAcademicListeningTest4ExamParts, getAcademicListeningTest4SkillMock } from "./academicTest4Pack";
import { getAcademicListeningTest5ExamParts, getAcademicListeningTest5SkillMock } from "./academicTest5Pack";
import { isAcademicListeningTestNumber } from "./academicListeningTestList";
import type { ListeningExamPart } from "@/lib/mock-test/listeningExam";

export function getCannedAcademicListeningExamParts(
  testNumber: number
): ListeningExamPart[] {
  switch (testNumber) {
    case 1:
      return getAcademicListeningTest1ExamParts();
    case 2:
      return getAcademicListeningTest2ExamParts();
    case 3:
      return getAcademicListeningTest3ExamParts();
    case 4:
      return getAcademicListeningTest4ExamParts();
    case 5:
      return getAcademicListeningTest5ExamParts();
    default:
      return getAcademicListeningTest1ExamParts();
  }
}

export function getCannedAcademicListeningSkillMock(testNumber: number) {
  const n = isAcademicListeningTestNumber(testNumber) ? testNumber : 1;
  switch (n) {
    case 1:
      return getAcademicListeningTest1SkillMock();
    case 2:
      return getAcademicListeningTest2SkillMock();
    case 3:
      return getAcademicListeningTest3SkillMock();
    case 4:
      return getAcademicListeningTest4SkillMock();
    case 5:
      return getAcademicListeningTest5SkillMock();
  }
}
