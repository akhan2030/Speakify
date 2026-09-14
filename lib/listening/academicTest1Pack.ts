import type { ListeningQuestion } from "@/components/ListeningQuestions";
import type { ListeningExamPart } from "@/lib/mock-test/listeningExam";
import type { ListeningQuestion as MockListeningQuestion } from "@/lib/mock-test/types";
import type { AcademicListeningScript } from "@/lib/listening/academicListeningScript";
import s1 from "../../listening/academic/ielts-academic-listening-s1-v3.json";
import s2 from "../../listening/academic/ielts-academic-listening-s2-v3.json";
import s3 from "../../listening/academic/ielts-academic-listening-s3-v3.json";
import s4 from "../../listening/academic/ielts-academic-listening-s4-v3.json";
import answerKey from "../../listening/academic/test1-v3-answer-key.json";

export const ACADEMIC_LISTENING_TEST1_ID = "ielts-academic-listening-test1-v3";

export const TEST1_SECTION_AUDIO: Record<1 | 2 | 3 | 4, string> = {
  1: "/audio/ielts-academic-listening/ielts-academic-listening-s1-v4.mp3",
  2: "/audio/ielts-academic-listening/ielts-academic-listening-s2-v3.mp3",
  3: "/audio/ielts-academic-listening/ielts-academic-listening-s3-v3.mp3",
  4: "/audio/ielts-academic-listening/ielts-academic-listening-s4-v3.mp3",
};

export const TEST1_S2_FLOOR_PLAN =
  "/audio/ielts-academic-listening/section2-floor-plan.svg";

const MAP_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];

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

const PLAN_OPTIONS = MAP_LETTERS.map((label) => ({
  label,
  text: label === "A" ? "Entrance" : `Area ${label}`,
}));

const SECTION_QUESTIONS: Record<1 | 2 | 3 | 4, ListeningQuestion[]> = {
  1: [
    skillQ(1, "form-completion", "Surname", THREE),
    skillQ(2, "form-completion", "Contact number", THREE),
    skillQ(3, "form-completion", "Preferred start date", THREE),
    skillQ(4, "form-completion", "Membership for", THREE),
    skillQ(5, "note-completion", "Membership type", TWO),
    skillQ(6, "note-completion", "Emergency contact", TWO),
    skillQ(7, "note-completion", "Relationship", TWO),
    skillQ(8, "note-completion", "Class of interest", TWO),
    skillQ(9, "note-completion", "Email", TWO),
    skillQ(10, "note-completion", "Membership reference", TWO),
  ],
  2: [
    skillQ(11, "note-completion", "Weekday opening hours", TWO),
    skillQ(12, "note-completion", "Weekend closing time", TWO),
    skillQ(13, "note-completion", "Cost of a pottery session", TWO),
    skillQ(14, "note-completion", "Volunteering extension number", TWO),
    skillQ(15, "note-completion", "Annual garden event", TWO),
    skillQ(16, "plan-map-diagram", "Reception", undefined, {
      options: PLAN_OPTIONS,
    }),
    skillQ(17, "plan-map-diagram", "Oak Room", undefined, {
      options: PLAN_OPTIONS,
    }),
    skillQ(18, "plan-map-diagram", "Willow Room", undefined, {
      options: PLAN_OPTIONS,
    }),
    skillQ(19, "plan-map-diagram", "Reading Room", undefined, {
      options: PLAN_OPTIONS,
    }),
    skillQ(20, "plan-map-diagram", "Café", undefined, {
      options: PLAN_OPTIONS,
    }),
  ],
  3: [
    skillQ(21, "flowchart-completion", "effect of park access on residents'", TWO),
    skillQ(22, "flowchart-completion", "about ______ participants", TWO),
    skillQ(23, "flowchart-completion", "drawn from ______ neighbourhoods", TWO),
    skillQ(24, "flowchart-completion", "time left:", TWO),
    skillQ(
      25,
      "summary-completion",
      "Tom is mainly worried about the project ______.",
      ONE
    ),
    skillQ(
      26,
      "summary-completion",
      "Priya is more concerned about the ______.",
      ONE
    ),
    skillQ(
      27,
      "summary-completion",
      "The tutor suggests meeting again in a ______.",
      ONE
    ),
    skillQ(28, "note-completion", "Methodology", TWO_WORDS),
    skillQ(29, "note-completion", "Literature review", TWO_WORDS),
    skillQ(30, "note-completion", "Discussion", TWO_WORDS),
  ],
  4: [
    skillQ(
      31,
      "summary-completion",
      "Bee numbers have fallen by about ______ in twenty years.",
      TWO
    ),
    skillQ(
      32,
      "summary-completion",
      "A parasite called the ______ weakens bees'",
      TWO
    ),
    skillQ(33, "summary-completion", "weakens bees' ______.", TWO),
    skillQ(
      34,
      "summary-completion",
      "Bees pollinate roughly ______ of food crops.",
      TWO
    ),
    skillQ(35, "multiple-choice", "What is the main aim of the city schemes the lecturer describes?", undefined, {
      options: [
        { label: "A", text: "to replace wild bees with laboratory-bred insects" },
        { label: "B", text: "to encourage residents to keep bees in cities" },
        { label: "C", text: "to move all hives out of urban areas" },
      ],
    }),
    skillQ(36, "multiple-choice", "Why does the lecturer mention Manchester?", undefined, {
      options: [
        { label: "A", text: "it banned rooftop hives in 2015" },
        { label: "B", text: "it is used as a case study" },
        { label: "C", text: "it has the oldest environmental charity" },
      ],
    }),
    skillQ(37, "note-completion", "Rooftop ______ have tripled since 2015", TWO),
    skillQ(38, "note-completion", "Wildflower strips called ______", TWO),
    skillQ(39, "note-completion", "These give bees safe ______ between green spaces", TWO),
    skillQ(40, "note-completion", "Funding: the ______ Trust", TWO),
  ],
};

const TOPICS: Record<1 | 2 | 3 | 4, string> = {
  1: "Fitness centre membership enquiry",
  2: "Elmwood Community Centre talk and floor plan",
  3: "Research project discussion (Priya, Tom, Dr Bennett)",
  4: "Urban bee populations lecture",
};

const TITLES: Record<1 | 2 | 3 | 4, string> = {
  1: "Section 1 — Riverside Fitness Centre",
  2: "Section 2 — Elmwood Community Centre",
  3: "Section 3 — Park-access research project",
  4: "Section 4 — Urban bees",
};

const SCRIPTS: Record<1 | 2 | 3 | 4, AcademicListeningScript> = {
  1: s1 as unknown as AcademicListeningScript,
  2: s2 as unknown as AcademicListeningScript,
  3: s3 as unknown as AcademicListeningScript,
  4: s4 as unknown as AcademicListeningScript,
};

export type AcademicTest1SectionPayload = {
  title: string;
  section: number;
  topic: string;
  transcript: string;
  speakers: { label: string; name?: string }[];
  questionType: string;
  wordLimit?: string;
  questions: ListeningQuestion[];
  example?: { questionText: string; answerText: string } | null;
  formGivenRows?: Array<{ label: string; value: string }>;
  audioUrl: string;
  cannedExam: true;
  mapImageUrl?: string;
};

export function getAcademicListeningTest1Section(
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
            questionText: "Reason for enquiry",
            answerText: "New membership sign-up",
          }
        : null,
    formGivenRows:
      section === 1 ? [{ label: "First name", value: "Daniel" }] : undefined,
    audioUrl: TEST1_SECTION_AUDIO[section],
    cannedExam: true,
    mapImageUrl: section === 2 ? TEST1_S2_FLOOR_PLAN : undefined,
  };
}

export function getAcademicListeningTest1SkillMock() {
  return {
    success: true,
    fromBank: true,
    generatedLive: false,
    cannedExam: true,
    testId: ACADEMIC_LISTENING_TEST1_ID,
    testNumber: 1,
    contentType: "full_mock",
    sections: {
      1: getAcademicListeningTest1Section(1),
      2: getAcademicListeningTest1Section(2),
      3: getAcademicListeningTest1Section(3),
      4: getAcademicListeningTest1Section(4),
    },
  };
}

function mockType(
  type: string
): MockListeningQuestion["type"] {
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
    case "plan-map-diagram":
      return "matching";
    default:
      return "note";
  }
}

export function getAcademicListeningTest1ExamParts(): ListeningExamPart[] {
  return ([1, 2, 3, 4] as const).map((partNumber) => {
    const section = getAcademicListeningTest1Section(partNumber);
    const questions: MockListeningQuestion[] = section.questions.map((q) => ({
      id: `test1-l${partNumber}-q${q.questionNumber}`,
      number: q.questionNumber,
      section: partNumber,
      type: mockType(q.type),
      prompt: q.text,
      correct: q.answer ?? "",
      options: q.options?.map((o) => o.text) ?? undefined,
    }));

    return {
      partNumber,
      introText: `Section ${partNumber} of 4 — Academic Listening Practice Test 1. The recording includes the examiner's instructions and look-at-questions pauses. You will hear it once only.`,
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
          mapImageUrl: section.mapImageUrl,
          questionType: section.questions[0]?.type,
          formTitle:
            partNumber === 1
              ? "Riverside Fitness Centre — New Membership Enquiry Form"
              : undefined,
          contentTitle: section.title,
          example: section.example,
          formGivenRows:
            partNumber === 1 ? [{ label: "First name", value: "Daniel" }] : undefined,
          maxWords: partNumber === 1 ? 3 : undefined,
        },
      ],
      questions,
    };
  });
}
