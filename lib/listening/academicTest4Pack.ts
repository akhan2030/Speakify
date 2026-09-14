import type { ListeningQuestion } from "@/components/ListeningQuestions";
import type { ListeningExamPart } from "@/lib/mock-test/listeningExam";
import type { ListeningQuestion as MockListeningQuestion } from "@/lib/mock-test/types";
import type { AcademicListeningScript } from "@/lib/listening/academicListeningScript";
import s1 from "../../listening/academic/ielts-academic-listening-test4-s1-v1.json";
import s2 from "../../listening/academic/ielts-academic-listening-test4-s2-v1.json";
import s3 from "../../listening/academic/ielts-academic-listening-test4-s3-v1.json";
import s4 from "../../listening/academic/ielts-academic-listening-test4-s4-v1.json";
import answerKey from "../../listening/academic/test4-v1-answer-key.json";
import type { AcademicTest1SectionPayload } from "./academicTest1Pack";

export const ACADEMIC_LISTENING_TEST4_ID = "ielts-academic-listening-test4-v1";

export const TEST4_SECTION_AUDIO: Record<1 | 2 | 3 | 4, string> = {
  1: "/audio/ielts-academic-listening-test4/ielts-academic-listening-s1-v1.mp3",
  2: "/audio/ielts-academic-listening-test4/ielts-academic-listening-s2-v1.mp3",
  3: "/audio/ielts-academic-listening-test4/ielts-academic-listening-s3-v1.mp3",
  4: "/audio/ielts-academic-listening-test4/ielts-academic-listening-s4-v1.mp3",
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
  { label: "A", text: "North yard" },
  { label: "B", text: "Main building" },
  { label: "C", text: "Shore path" },
];

const PERSON_OPTIONS = [
  { label: "A", text: "Maya" },
  { label: "B", text: "Leo" },
];

const SECTION_QUESTIONS: Record<1 | 2 | 3 | 4, ListeningQuestion[]> = {
  1: [
    skillQ(1, "form-completion", "Surname", THREE),
    skillQ(2, "form-completion", "Contact number", THREE),
    skillQ(3, "form-completion", "Animal", THREE),
    skillQ(4, "form-completion", "Appointment date", THREE),
    skillQ(5, "form-completion", "Appointment time", THREE),
    skillQ(6, "form-completion", "Pet's name", THREE),
    skillQ(7, "form-completion", "Age", THREE),
    skillQ(8, "form-completion", "Extra procedure", THREE),
    skillQ(9, "form-completion", "Parking street", THREE),
    skillQ(10, "form-completion", "Booking code", THREE),
  ],
  2: [
    skillQ(11, "note-completion", "Opening hours", TWO),
    skillQ(12, "note-completion", "Length of a volunteer shift", TWO),
    skillQ(13, "note-completion", "Minimum age without a parent", TWO),
    skillQ(14, "note-completion", "Bring", TWO),
    skillQ(15, "note-completion", "Free hot drinks: staff", TWO),
    skillQ(16, "matching", "Isolation kennels", undefined, { options: SITE_OPTIONS }),
    skillQ(17, "matching", "Shop", undefined, { options: SITE_OPTIONS }),
    skillQ(18, "matching", "Bird pools", undefined, { options: SITE_OPTIONS }),
    skillQ(19, "matching", "Training classroom", undefined, { options: SITE_OPTIONS }),
    skillQ(20, "matching", "Volunteer bike racks", undefined, { options: SITE_OPTIONS }),
  ],
  3: [
    skillQ(21, "flowchart-completion", "Design the", TWO_WORDS),
    skillQ(22, "flowchart-completion", "Run a", TWO_WORDS),
    skillQ(23, "flowchart-completion", "Collect the", TWO_WORDS),
    skillQ(24, "flowchart-completion", "the contents", TWO_WORDS),
    skillQ(25, "summary-completion", "The slowest stage at present is", ONE),
    skillQ(26, "summary-completion", "Staff will receive a five-pound", ONE),
    skillQ(27, "summary-completion", "Invitations are now sent by", ONE),
    skillQ(28, "matching", "data tables", undefined, { options: PERSON_OPTIONS }),
    skillQ(29, "matching", "literature review", undefined, { options: PERSON_OPTIONS }),
    skillQ(30, "matching", "oral presentation", undefined, { options: PERSON_OPTIONS }),
  ],
  4: [
    skillQ(31, "summary-completion", "The circadian system is often called the", TWO),
    skillQ(32, "summary-completion", "Darkness raises", TWO),
    skillQ(33, "summary-completion", "About __________ of employees in Britain regularly work nights", TWO),
    skillQ(34, "summary-completion", "Guidelines still recommend __________ of daytime sleep", TWO),
    skillQ(35, "multiple-choice", "What do night workers complain about most often?", undefined, {
      options: [
        { label: "A", text: "missing family and social events" },
        { label: "B", text: "poor cafeteria food" },
        { label: "C", text: "low pay" },
      ],
    }),
    skillQ(
      36,
      "multiple-choice",
      "Which countermeasure has the strongest field evidence so far?",
      undefined,
      {
        options: [
          { label: "A", text: "extra caffeine" },
          { label: "B", text: "experimental bright-light rooms" },
          { label: "C", text: "a timed nap during the night break" },
        ],
      }
    ),
    skillQ(37, "note-completion", "Case study", THREE),
    skillQ(38, "note-completion", "Higher diabetes risk after long-term nights", THREE),
    skillQ(39, "note-completion", "Issued for daytime sleep", THREE),
    skillQ(40, "note-completion", "Rosters to avoid", THREE),
  ],
};

const TOPICS: Record<1 | 2 | 3 | 4, string> = {
  1: "Veterinary vaccination booking",
  2: "Wildlife rescue volunteer talk",
  3: "Campus food-waste audit",
  4: "Night-shift work lecture",
};

const TITLES: Record<1 | 2 | 3 | 4, string> = {
  1: "Section 1 — Northgate Animal Clinic",
  2: "Section 2 — Saltmarsh Wildlife Rescue",
  3: "Section 3 — Campus food-waste audit",
  4: "Section 4 — Night-shift work and the body clock",
};

const SCRIPTS: Record<1 | 2 | 3 | 4, AcademicListeningScript> = {
  1: s1 as unknown as AcademicListeningScript,
  2: s2 as unknown as AcademicListeningScript,
  3: s3 as unknown as AcademicListeningScript,
  4: s4 as unknown as AcademicListeningScript,
};

export function getAcademicListeningTest4Section(
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
            answerText: "Vaccination booking",
          }
        : null,
    formGivenRows:
      section === 1 ? [{ label: "First name", value: "Helen" }] : undefined,
    audioUrl: TEST4_SECTION_AUDIO[section],
    cannedExam: true,
  };
}

export function getAcademicListeningTest4SkillMock() {
  return {
    success: true,
    fromBank: true,
    generatedLive: false,
    cannedExam: true,
    testId: ACADEMIC_LISTENING_TEST4_ID,
    testNumber: 4,
    contentType: "full_mock",
    sections: {
      1: getAcademicListeningTest4Section(1),
      2: getAcademicListeningTest4Section(2),
      3: getAcademicListeningTest4Section(3),
      4: getAcademicListeningTest4Section(4),
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

export function getAcademicListeningTest4ExamParts(): ListeningExamPart[] {
  return ([1, 2, 3, 4] as const).map((partNumber) => {
    const section = getAcademicListeningTest4Section(partNumber);
    const questions: MockListeningQuestion[] = section.questions.map((q) => ({
      id: `test4-l${partNumber}-q${q.questionNumber}`,
      number: q.questionNumber,
      section: partNumber,
      type: mockType(q.type),
      prompt: q.text,
      correct: q.answer ?? "",
      options: q.options?.map((o) => o.text) ?? undefined,
    }));

    return {
      partNumber,
      introText: `Section ${partNumber} of 4 — Academic Listening Practice Test 4. The recording includes the examiner's instructions and look-at-questions pauses. You will hear it once only.`,
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
            partNumber === 1 ? "Northgate Animal Clinic — Appointment Form" : undefined,
          contentTitle: section.title,
          example: section.example,
          maxWords: partNumber === 1 ? 3 : undefined,
          formGivenRows:
            partNumber === 1
              ? [{ label: "First name", value: "Helen" }]
              : undefined,
        },
      ],
      questions,
    };
  });
}
