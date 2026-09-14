import type { ListeningQuestion } from "@/components/ListeningQuestions";
import type { ListeningExamPart } from "@/lib/mock-test/listeningExam";
import type { ListeningQuestion as MockListeningQuestion } from "@/lib/mock-test/types";
import type { AcademicListeningScript } from "@/lib/listening/academicListeningScript";
import s1 from "../../listening/academic/ielts-academic-listening-test2-s1-v1.json";
import s2 from "../../listening/academic/ielts-academic-listening-test2-s2-v1.json";
import s3 from "../../listening/academic/ielts-academic-listening-test2-s3-v1.json";
import s4 from "../../listening/academic/ielts-academic-listening-test2-s4-v1.json";
import answerKey from "../../listening/academic/test2-v1-answer-key.json";
import type { AcademicTest1SectionPayload } from "./academicTest1Pack";

export const ACADEMIC_LISTENING_TEST2_ID = "ielts-academic-listening-test2-v1";

export const TEST2_SECTION_AUDIO: Record<1 | 2 | 3 | 4, string> = {
  1: "/audio/ielts-academic-listening-test2/ielts-academic-listening-s1-v1.mp3",
  2: "/audio/ielts-academic-listening-test2/ielts-academic-listening-s2-v1.mp3",
  3: "/audio/ielts-academic-listening-test2/ielts-academic-listening-s3-v1.mp3",
  4: "/audio/ielts-academic-listening-test2/ielts-academic-listening-s4-v1.mp3",
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
const THREE_WORDS = "NO MORE THAN THREE WORDS";

const FLOOR_OPTIONS = [
  { label: "A", text: "Ground floor" },
  { label: "B", text: "First floor" },
  { label: "C", text: "Second floor" },
];

const SECTION_QUESTIONS: Record<1 | 2 | 3 | 4, ListeningQuestion[]> = {
  1: [
    skillQ(1, "form-completion", "Surname", THREE),
    skillQ(2, "form-completion", "Dates", THREE),
    skillQ(3, "form-completion", "Room type", THREE),
    skillQ(4, "form-completion", "Number of guests", THREE),
    skillQ(5, "form-completion", "Arrival time", THREE),
    skillQ(6, "form-completion", "Payment", THREE),
    skillQ(7, "form-completion", "Breakfast included", THREE),
    skillQ(8, "form-completion", "Parking needed", THREE),
    skillQ(9, "form-completion", "Mobile number", THREE),
    skillQ(10, "form-completion", "Confirmation code", THREE),
  ],
  2: [
    skillQ(11, "note-completion", "Opening hours", TWO),
    skillQ(12, "note-completion", "General admission", TWO),
    skillQ(13, "note-completion", "Next guided tour", TWO),
    skillQ(14, "note-completion", "Café location", TWO),
    skillQ(15, "note-completion", "Member gift-shop discount", TWO),
    skillQ(16, "matching", "Dinosaur hall", undefined, { options: FLOOR_OPTIONS }),
    skillQ(17, "matching", "Art gallery", undefined, { options: FLOOR_OPTIONS }),
    skillQ(18, "matching", "Planetarium", undefined, { options: FLOOR_OPTIONS }),
    skillQ(19, "matching", "Marine life exhibit", undefined, { options: FLOOR_OPTIONS }),
    skillQ(20, "matching", "Temporary exhibits hall", undefined, {
      options: FLOOR_OPTIONS,
    }),
  ],
  3: [
    skillQ(
      21,
      "sentence-completion",
      "The project focuses on solar adoption in __________.",
      THREE_WORDS
    ),
    skillQ(
      22,
      "sentence-completion",
      "They chose this because of the __________.",
      THREE_WORDS
    ),
    skillQ(
      23,
      "sentence-completion",
      "Data will come from interviews with about __________.",
      THREE_WORDS
    ),
    skillQ(
      24,
      "sentence-completion",
      "They have about __________ to prepare their questions.",
      THREE_WORDS
    ),
    skillQ(25, "summary-completion", "Sofia's main concern is __________.", ONE),
    skillQ(26, "summary-completion", "Ben is more worried about __________.", ONE),
    skillQ(
      27,
      "summary-completion",
      "If people are busy, they will try interviewing in the __________.",
      ONE
    ),
    skillQ(28, "note-completion", "Sofia writes", THREE_WORDS),
    skillQ(29, "note-completion", "Ben writes", THREE_WORDS),
    skillQ(30, "note-completion", "Full draft due", THREE_WORDS),
  ],
  4: [
    skillQ(
      31,
      "summary-completion",
      "Microplastics are fragments smaller than __________.",
      TWO
    ),
    skillQ(
      32,
      "summary-completion",
      "A significant portion comes from __________ fibres.",
      TWO
    ),
    skillQ(
      33,
      "summary-completion",
      "About __________ of plastic enter the ocean each year.",
      TWO
    ),
    skillQ(
      34,
      "summary-completion",
      "They appear in about __________ of seabird species studied.",
      TWO
    ),
    skillQ(35, "multiple-choice", "What early legal measure does the lecturer mention?", undefined, {
      options: [
        { label: "A", text: "banning all plastic packaging" },
        { label: "B", text: "banning microbeads in cosmetics" },
        { label: "C", text: "taxing plastic manufacturers" },
      ],
    }),
    skillQ(
      36,
      "multiple-choice",
      "Which approach has shown the most measurable real-world reduction so far?",
      undefined,
      {
        options: [
          { label: "A", text: "ship-based nets" },
          { label: "B", text: "beach clean-up volunteers" },
          { label: "C", text: "floating river barriers" },
        ],
      }
    ),
    skillQ(37, "note-completion", "Case study: the", THREE),
    skillQ(38, "note-completion", "Area: roughly __________ the size of France", THREE),
    skillQ(39, "note-completion", "Organisation (since 2018)", THREE),
    skillQ(40, "note-completion", "Researchers prefer __________ at the source", THREE),
  ],
};

const TOPICS: Record<1 | 2 | 3 | 4, string> = {
  1: "Hotel room booking",
  2: "Museum visitor talk",
  3: "Renewable energy group project",
  4: "Ocean microplastics lecture",
};

const TITLES: Record<1 | 2 | 3 | 4, string> = {
  1: "Section 1 — Lakeview Hotel",
  2: "Section 2 — Riverside Natural History Museum",
  3: "Section 3 — Renewable energy project",
  4: "Section 4 — Ocean microplastics",
};

const SCRIPTS: Record<1 | 2 | 3 | 4, AcademicListeningScript> = {
  1: s1 as unknown as AcademicListeningScript,
  2: s2 as unknown as AcademicListeningScript,
  3: s3 as unknown as AcademicListeningScript,
  4: s4 as unknown as AcademicListeningScript,
};

export function getAcademicListeningTest2Section(
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
            answerText: "Room booking",
          }
        : null,
    formGivenRows:
      section === 1 ? [{ label: "First name", value: "Marco" }] : undefined,
    audioUrl: TEST2_SECTION_AUDIO[section],
    cannedExam: true,
  };
}

export function getAcademicListeningTest2SkillMock() {
  return {
    success: true,
    fromBank: true,
    generatedLive: false,
    cannedExam: true,
    testId: ACADEMIC_LISTENING_TEST2_ID,
    testNumber: 2,
    contentType: "full_mock",
    sections: {
      1: getAcademicListeningTest2Section(1),
      2: getAcademicListeningTest2Section(2),
      3: getAcademicListeningTest2Section(3),
      4: getAcademicListeningTest2Section(4),
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

export function getAcademicListeningTest2ExamParts(): ListeningExamPart[] {
  return ([1, 2, 3, 4] as const).map((partNumber) => {
    const section = getAcademicListeningTest2Section(partNumber);
    const questions: MockListeningQuestion[] = section.questions.map((q) => ({
      id: `test2-l${partNumber}-q${q.questionNumber}`,
      number: q.questionNumber,
      section: partNumber,
      type: mockType(q.type),
      prompt: q.text,
      correct: q.answer ?? "",
      options: q.options?.map((o) => o.text) ?? undefined,
    }));

    return {
      partNumber,
      introText: `Section ${partNumber} of 4 — Academic Listening Practice Test 2. The recording includes the examiner's instructions and look-at-questions pauses. You will hear it once only.`,
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
            partNumber === 1 ? "Lakeview Hotel — Booking Form" : undefined,
          contentTitle: section.title,
          example: section.example,
          maxWords: partNumber === 1 ? 3 : undefined,
          formGivenRows:
            partNumber === 1
              ? [{ label: "First name", value: "Marco" }]
              : undefined,
        },
      ],
      questions,
    };
  });
}
