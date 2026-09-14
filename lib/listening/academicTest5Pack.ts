import type { ListeningQuestion } from "@/components/ListeningQuestions";
import type { ListeningExamPart } from "@/lib/mock-test/listeningExam";
import type { ListeningQuestion as MockListeningQuestion } from "@/lib/mock-test/types";
import type { AcademicListeningScript } from "@/lib/listening/academicListeningScript";
import s1 from "../../listening/academic/ielts-academic-listening-test5-s1-v1.json";
import s2 from "../../listening/academic/ielts-academic-listening-test5-s2-v1.json";
import s3 from "../../listening/academic/ielts-academic-listening-test5-s3-v1.json";
import s4 from "../../listening/academic/ielts-academic-listening-test5-s4-v1.json";
import answerKey from "../../listening/academic/test5-v1-answer-key.json";
import type { AcademicTest1SectionPayload } from "./academicTest1Pack";

export const ACADEMIC_LISTENING_TEST5_ID = "ielts-academic-listening-test5-v1";

export const TEST5_SECTION_AUDIO: Record<1 | 2 | 3 | 4, string> = {
  1: "/audio/ielts-academic-listening-test5/ielts-academic-listening-s1-v1.mp3",
  2: "/audio/ielts-academic-listening-test5/ielts-academic-listening-s2-v1.mp3",
  3: "/audio/ielts-academic-listening-test5/ielts-academic-listening-s3-v1.mp3",
  4: "/audio/ielts-academic-listening-test5/ielts-academic-listening-s4-v1.mp3",
};

function joinKey(values: string[]): string {
  return [...new Set(values.map((v) => String(v).trim()).filter(Boolean))].join(
    " / "
  );
}

function keyFor(num: number): string {
  const raw = (answerKey as { answers: Record<string, string[]> }).answers[
    String(num)
  ];
  if (!raw?.length) return "";
  return joinKey(raw);
}

function skillQ(
  n: number,
  type: string,
  text: string,
  wordLimit?: string,
  extra?: Partial<ListeningQuestion>
): ListeningQuestion {
  return {
    id: n,
    questionNumber: n,
    type,
    text,
    answer: keyFor(n),
    wordLimit,
    ...extra,
  };
}

function transcriptFromScript(script: AcademicListeningScript): string {
  const names = new Map(
    script.speakers.map((sp) => [
      sp.speaker_id,
      sp.display_name?.replace(/\s*\(.*$/, "").trim() || sp.speaker_id,
    ])
  );
  return script.lines
    .map((line) => `${names.get(line.speaker_id) ?? line.speaker_id}: ${line.text}`)
    .join("\n");
}

function speakersFromScript(script: AcademicListeningScript) {
  return script.speakers
    .filter((sp) => sp.role !== "instructions")
    .map((sp) => ({
      label: sp.display_name ?? sp.speaker_id,
      name: sp.display_name,
    }));
}

const THREE = "NO MORE THAN THREE WORDS AND/OR A NUMBER";
const TWO = "NO MORE THAN TWO WORDS AND/OR A NUMBER";
const ONE = "ONE WORD ONLY";
const TWO_WORDS = "NO MORE THAN TWO WORDS";

const SITE_OPTIONS = [
  { label: "A", text: "East hall" },
  { label: "B", text: "West hall" },
  { label: "C", text: "Roof terrace" },
];

const PERSON_OPTIONS = [
  { label: "A", text: "Jade" },
  { label: "B", text: "Omar" },
];

const SECTION_QUESTIONS: Record<1 | 2 | 3 | 4, ListeningQuestion[]> = {
  1: [
    skillQ(1, "form-completion", "Surname", THREE),
    skillQ(2, "form-completion", "Contact number", THREE),
    skillQ(3, "form-completion", "Instrument", THREE),
    skillQ(4, "form-completion", "Lesson date", THREE),
    skillQ(5, "form-completion", "Lesson time", THREE),
    skillQ(6, "form-completion", "Student's name", THREE),
    skillQ(7, "form-completion", "Age", THREE),
    skillQ(8, "form-completion", "Extra item", THREE),
    skillQ(9, "form-completion", "Parking street", THREE),
    skillQ(10, "form-completion", "Booking code", THREE),
  ],
  2: [
    skillQ(11, "note-completion", "Opening hours", TWO),
    skillQ(12, "note-completion", "Length of first session", TWO),
    skillQ(13, "note-completion", "Minimum age without an adult", TWO),
    skillQ(14, "note-completion", "Bring", TWO),
    skillQ(15, "note-completion", "Free water: lobby", TWO),
    skillQ(16, "matching", "Beginner walls", undefined, { options: SITE_OPTIONS }),
    skillQ(17, "matching", "Shoe hire", undefined, { options: SITE_OPTIONS }),
    skillQ(18, "matching", "Outdoor boulders", undefined, { options: SITE_OPTIONS }),
    skillQ(19, "matching", "First-aid room", undefined, { options: SITE_OPTIONS }),
    skillQ(20, "matching", "Day lockers", undefined, { options: SITE_OPTIONS }),
  ],
  3: [
    skillQ(21, "flowchart-completion", "Design the", TWO_WORDS),
    skillQ(22, "flowchart-completion", "Run a", TWO_WORDS),
    skillQ(23, "flowchart-completion", "Log the", TWO_WORDS),
    skillQ(24, "flowchart-completion", "the damage", TWO_WORDS),
    skillQ(25, "summary-completion", "The slowest stage at present is", ONE),
    skillQ(26, "summary-completion", "Porters will receive a five-pound", ONE),
    skillQ(27, "summary-completion", "Invitations are now sent by", ONE),
    skillQ(28, "matching", "data tables", undefined, { options: PERSON_OPTIONS }),
    skillQ(29, "matching", "literature review", undefined, { options: PERSON_OPTIONS }),
    skillQ(30, "matching", "oral presentation", undefined, { options: PERSON_OPTIONS }),
  ],
  4: [
    skillQ(31, "summary-completion", "Wet peat is often called a", TWO),
    skillQ(32, "summary-completion", "The key moss is", TWO),
    skillQ(33, "summary-completion", "About __________ of Britain's land is peat", TWO),
    skillQ(34, "summary-completion", "Those bogs hold about __________ of the country's soil carbon", TWO),
    skillQ(35, "multiple-choice", "What do hill farmers complain about most often?", undefined, {
      options: [
        { label: "A", text: "lost grazing after restoration fences" },
        { label: "B", text: "extra paperwork" },
        { label: "C", text: "low peat prices" },
      ],
    }),
    skillQ(
      36,
      "multiple-choice",
      "Which restoration method has the strongest field evidence so far?",
      undefined,
      {
        options: [
          { label: "A", text: "planting trees on dry peat" },
          { label: "B", text: "visitor boardwalks" },
          { label: "C", text: "raising the water table" },
        ],
      }
    ),
    skillQ(37, "note-completion", "Case study", THREE),
    skillQ(38, "note-completion", "Lower cover of specialist plants on dry plots", THREE),
    skillQ(39, "note-completion", "Issued for water-level checks", THREE),
    skillQ(40, "note-completion", "Features to block", THREE),
  ],
};

const TOPICS: Record<1 | 2 | 3 | 4, string> = {
  1: "Music-school trial lesson",
  2: "Indoor climbing centre briefing",
  3: "Campus bicycle-theft mapping",
  4: "Peatland carbon lecture",
};

const TITLES: Record<1 | 2 | 3 | 4, string> = {
  1: "Section 1 — Westbridge Music School",
  2: "Section 2 — Ashfield Walls",
  3: "Section 3 — Bicycle-theft mapping",
  4: "Section 4 — Peat bogs and carbon storage",
};

const SCRIPTS: Record<1 | 2 | 3 | 4, AcademicListeningScript> = {
  1: s1 as unknown as AcademicListeningScript,
  2: s2 as unknown as AcademicListeningScript,
  3: s3 as unknown as AcademicListeningScript,
  4: s4 as unknown as AcademicListeningScript,
};

export function getAcademicListeningTest5Section(
  section: 1 | 2 | 3 | 4
): AcademicTest1SectionPayload {
  const script = SCRIPTS[section];
  const questions = SECTION_QUESTIONS[section];
  return {
    title: TITLES[section],
    section,
    topic: TOPICS[section],
    transcript: transcriptFromScript(script),
    speakers: speakersFromScript(script),
    questionType: questions[0]?.type ?? "note-completion",
    wordLimit: questions[0]?.wordLimit,
    questions,
    example:
      section === 1
        ? {
            questionText: "Reason for call",
            answerText: "Trial lesson",
          }
        : null,
    formGivenRows:
      section === 1 ? [{ label: "First name", value: "Yasmin" }] : undefined,
    audioUrl: TEST5_SECTION_AUDIO[section],
    cannedExam: true,
  };
}

export function getAcademicListeningTest5SkillMock() {
  return {
    success: true,
    fromBank: true,
    generatedLive: false,
    cannedExam: true,
    testId: ACADEMIC_LISTENING_TEST5_ID,
    testNumber: 5,
    contentType: "full_mock",
    sections: {
      1: getAcademicListeningTest5Section(1),
      2: getAcademicListeningTest5Section(2),
      3: getAcademicListeningTest5Section(3),
      4: getAcademicListeningTest5Section(4),
    },
  };
}

function mockType(type: string): MockListeningQuestion["type"] {
  switch (type) {
    case "form-completion":
      return "form";
    case "note-completion":
      return "note";
    case "flowchart-completion":
      return "flowchart";
    case "summary-completion":
      return "summary";
    case "multiple-choice":
      return "mcq";
    case "matching":
    case "plan-map-diagram":
      return "matching";
    default:
      return "note";
  }
}

export function getAcademicListeningTest5ExamParts(): ListeningExamPart[] {
  return ([1, 2, 3, 4] as const).map((partNumber) => {
    const section = getAcademicListeningTest5Section(partNumber);
    const questions: MockListeningQuestion[] = section.questions.map((q) => ({
      id: `test5-l${partNumber}-q${q.questionNumber}`,
      number: q.questionNumber,
      section: partNumber,
      type: mockType(q.type),
      prompt: q.text,
      correct: q.answer ?? "",
      options: q.options?.map((o) => o.text) ?? undefined,
    }));

    return {
      partNumber,
      introText: `Section ${partNumber} of 4 — Academic Listening Practice Test 5. The recording includes the examiner's instructions and look-at-questions pauses. You will hear it once only.`,
      speakers: section.speakers,
      blocks: [
        {
          questionStart: partNumber === 1 ? 1 : (partNumber - 1) * 10 + 1,
          questionEnd: partNumber * 10,
          transcript: section.transcript,
          sectionNumber: partNumber,
          voice: "onyx",
          audioUrl: section.audioUrl,
          cannedAudio: true,
          questionType: section.questions[0]?.type,
          formTitle:
            partNumber === 1 ? "Westbridge Music School — Booking Form" : undefined,
          contentTitle: section.title,
          example: section.example,
          maxWords: partNumber === 1 ? 3 : undefined,
          formGivenRows:
            partNumber === 1
              ? [{ label: "First name", value: "Yasmin" }]
              : undefined,
        },
      ],
      questions,
    };
  });
}
