import type { ListeningQuestion } from "@/components/ListeningQuestions";
import type { ListeningExamPart } from "@/lib/mock-test/listeningExam";
import type { ListeningQuestion as MockListeningQuestion } from "@/lib/mock-test/types";
import type { AcademicListeningScript } from "@/lib/listening/academicListeningScript";
import s1 from "../../listening/academic/ielts-academic-listening-test3-s1-v1.json";
import s2 from "../../listening/academic/ielts-academic-listening-test3-s2-v1.json";
import s3 from "../../listening/academic/ielts-academic-listening-test3-s3-v1.json";
import s4 from "../../listening/academic/ielts-academic-listening-test3-s4-v1.json";
import answerKey from "../../listening/academic/test3-v1-answer-key.json";
import type { AcademicTest1SectionPayload } from "./academicTest1Pack";

export const ACADEMIC_LISTENING_TEST3_ID = "ielts-academic-listening-test3-v1";

export const TEST3_SECTION_AUDIO: Record<1 | 2 | 3 | 4, string> = {
  1: "/audio/ielts-academic-listening-test3/ielts-academic-listening-s1-v1.mp3",
  2: "/audio/ielts-academic-listening-test3/ielts-academic-listening-s2-v1.mp3",
  3: "/audio/ielts-academic-listening-test3/ielts-academic-listening-s3-v1.mp3",
  4: "/audio/ielts-academic-listening-test3/ielts-academic-listening-s4-v1.mp3",
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

const PERSON_OPTIONS = [
  { label: "A", text: "Emma" },
  { label: "B", text: "Noah" },
];

const SECTION_QUESTIONS: Record<1 | 2 | 3 | 4, ListeningQuestion[]> = {
  1: [
    skillQ(1, "form-completion", "Surname", THREE),
    skillQ(2, "form-completion", "Contact number", THREE),
    skillQ(3, "form-completion", "Pick-up date", THREE),
    skillQ(4, "form-completion", "Type of car", THREE),
    skillQ(5, "form-completion", "Return location", THREE),
    skillQ(6, "form-completion", "Hire period", THREE),
    skillQ(7, "form-completion", "Insurance", THREE),
    skillQ(8, "form-completion", "Additional driver", THREE),
    skillQ(9, "form-completion", "Payment", THREE),
    skillQ(10, "form-completion", "Booking reference", THREE),
  ],
  2: [
    skillQ(11, "note-completion", "Opening hours (Mon–Sat)", TWO),
    skillQ(12, "note-completion", "Membership for local residents", TWO),
    skillQ(13, "note-completion", "Maximum items to borrow", TWO),
    skillQ(14, "note-completion", "Standard loan period", TWO),
    skillQ(15, "note-completion", "Late fine per day", TWO),
    skillQ(16, "multiple-choice", "What does the speaker say about Saturday story time?", undefined, {
      options: [
        { label: "A", text: "Story time has no time limit" },
        { label: "B", text: "Story time slots fill up quickly" },
        { label: "C", text: "Story time is for adults only" },
      ],
    }),
    skillQ(17, "multiple-choice", "What does she recommend for the upstairs study room?", undefined, {
      options: [
        { label: "A", text: "The study room is always empty" },
        { label: "B", text: "The study room cannot be booked" },
        { label: "C", text: "Booking ahead is strongly advised" },
      ],
    }),
    skillQ(18, "multiple-choice", "Who is given priority in the computer lab when it is busy?", undefined, {
      options: [
        { label: "A", text: "Job-seekers get priority when busy" },
        { label: "B", text: "Only members can use the computers" },
        { label: "C", text: "The lab is for children only" },
      ],
    }),
    skillQ(19, "multiple-choice", "What is true of the meeting room?", undefined, {
      options: [
        { label: "A", text: "The meeting room is never free" },
        { label: "B", text: "Commercial bookings need a separate arrangement" },
        { label: "C", text: "Only staff can use the meeting room" },
      ],
    }),
    skillQ(20, "multiple-choice", "What does the speaker say about staff help?", undefined, {
      options: [
        { label: "A", text: "Staff prefer not to be disturbed" },
        { label: "B", text: "Only the front desk can help" },
        { label: "C", text: "Staff are happy to help with any request" },
      ],
    }),
  ],
  3: [
    skillQ(21, "flowchart-completion", "Survey process step 1", TWO_WORDS),
    skillQ(22, "flowchart-completion", "Survey process step 2", TWO_WORDS),
    skillQ(23, "flowchart-completion", "Survey process step 3", TWO_WORDS),
    skillQ(24, "flowchart-completion", "Survey process step 4", TWO_WORDS),
    skillQ(25, "summary-completion", "The hardest stage so far has been", ONE),
    skillQ(26, "summary-completion", "They are offering a five-dollar", ONE),
    skillQ(27, "summary-completion", "The survey is being distributed mainly", ONE),
    skillQ(28, "matching", "data analysis", undefined, { options: PERSON_OPTIONS }),
    skillQ(29, "matching", "methodology section", undefined, { options: PERSON_OPTIONS }),
    skillQ(30, "matching", "conclusion", undefined, { options: PERSON_OPTIONS }),
  ],
  4: [
    skillQ(31, "summary-completion", "Vertical farms grow crops in", TWO),
    skillQ(32, "summary-completion", "Most systems use __________ rather than soil", TWO),
    skillQ(33, "summary-completion", "They can use up to __________ less water", TWO),
    skillQ(34, "summary-completion", "About __________ of people may live in cities by 2050", TWO),
    skillQ(35, "multiple-choice", "What has been the biggest obstacle to wider adoption?", undefined, {
      options: [
        { label: "A", text: "consumer demand" },
        { label: "B", text: "high upfront equipment cost" },
        { label: "C", text: "lack of suitable crops" },
      ],
    }),
    skillQ(36, "multiple-choice", "Why has Singapore become a leader in this area?", undefined, {
      options: [
        { label: "A", text: "government subsidies" },
        { label: "B", text: "cheap land" },
        { label: "C", text: "ideal climate" },
      ],
    }),
    skillQ(37, "note-completion", "Example facility", THREE),
    skillQ(38, "note-completion", "Main crops", THREE),
    skillQ(39, "note-completion", "System", THREE),
    skillQ(40, "note-completion", "Possible future use", THREE),
  ],
};

const TOPICS: Record<1 | 2 | 3 | 4, string> = {
  1: "Car rental booking",
  2: "Library orientation talk",
  3: "Transport survey project",
  4: "Vertical farming lecture",
};

const TITLES: Record<1 | 2 | 3 | 4, string> = {
  1: "Section 1 — DriveEasy Car Rentals",
  2: "Section 2 — Library orientation",
  3: "Section 3 — Transport survey",
  4: "Section 4 — Vertical farming",
};

const SCRIPTS: Record<1 | 2 | 3 | 4, AcademicListeningScript> = {
  1: s1 as unknown as AcademicListeningScript,
  2: s2 as unknown as AcademicListeningScript,
  3: s3 as unknown as AcademicListeningScript,
  4: s4 as unknown as AcademicListeningScript,
};

export function getAcademicListeningTest3Section(
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
            answerText: "Car rental enquiry",
          }
        : null,
    formGivenRows:
      section === 1 ? [{ label: "First name", value: "Fraser" }] : undefined,
    audioUrl: TEST3_SECTION_AUDIO[section],
    cannedExam: true,
  };
}

export function getAcademicListeningTest3SkillMock() {
  return {
    success: true,
    fromBank: true,
    generatedLive: false,
    cannedExam: true,
    testId: ACADEMIC_LISTENING_TEST3_ID,
    testNumber: 3,
    contentType: "full_mock",
    sections: {
      1: getAcademicListeningTest3Section(1),
      2: getAcademicListeningTest3Section(2),
      3: getAcademicListeningTest3Section(3),
      4: getAcademicListeningTest3Section(4),
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

export function getAcademicListeningTest3ExamParts(): ListeningExamPart[] {
  return ([1, 2, 3, 4] as const).map((partNumber) => {
    const section = getAcademicListeningTest3Section(partNumber);
    const questions: MockListeningQuestion[] = section.questions.map((q) => ({
      id: `test3-l${partNumber}-q${q.questionNumber}`,
      number: q.questionNumber,
      section: partNumber,
      type: mockType(q.type),
      prompt: q.text,
      correct: q.answer ?? "",
      options: q.options?.map((o) => o.text) ?? undefined,
    }));

    return {
      partNumber,
      introText: `Section ${partNumber} of 4 — Academic Listening Practice Test 3. The recording includes the examiner's instructions and look-at-questions pauses. You will hear it once only.`,
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
            partNumber === 1 ? "DriveEasy Car Rentals — Booking Form" : undefined,
          contentTitle: section.title,
          example: section.example,
          maxWords: partNumber === 1 ? 3 : undefined,
          formGivenRows:
            partNumber === 1
              ? [{ label: "First name", value: "Fraser" }]
              : undefined,
        },
      ],
      questions,
    };
  });
}
