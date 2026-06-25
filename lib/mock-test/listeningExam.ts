import type { ListeningQuestion } from "./types";

export type ListeningAudioBlock = {
  questionStart: number;
  questionEnd: number;
  prepMessage?: string;
  breakMessage?: string;
  transcript: string;
  sectionNumber: 1 | 2 | 3 | 4;
  voice: string;
};

export type ListeningExamPart = {
  partNumber: 1 | 2 | 3 | 4;
  introText: string;
  blocks: ListeningAudioBlock[];
  questions: ListeningQuestion[];
};

function q(
  num: number,
  section: 1 | 2 | 3 | 4,
  type: ListeningQuestion["type"],
  prompt: string,
  correct: string,
  options?: string[]
): ListeningQuestion {
  return {
    id: `l-q${num}`,
    number: num,
    section,
    type,
    prompt,
    correct,
    options,
  };
}

/** Original Speakify mock listening — 40 questions, 4 parts */
export const LISTENING_EXAM_PARTS: ListeningExamPart[] = [
  {
    partNumber: 1,
    introText:
      "Section 1 of 4 — Listening. You will now hear a conversation between two people. First, you have 30 seconds to look at Questions 1 to 5.",
    blocks: [
      {
        questionStart: 1,
        questionEnd: 5,
        prepMessage: "You have 30 seconds to look at Questions 1 to 5.",
        transcript: `Receptionist: Good afternoon, Seaside Hotel. How may I help you today?
Guest: Hello, I'd like to book a room for two nights, please — arriving on the twelfth of April.
Receptionist: Certainly. May I have your full name?
Guest: Yes, it's Omar Al-Harbi.
Receptionist: Thank you, Mr Al-Harbi. And a contact number in case we need to reach you?
Guest: Sure — zero five five, one two three, four five six seven.
Receptionist: Perfect. We have a standard double room available at one hundred and eighty riyals per night, including breakfast.
Guest: That sounds good. I'll probably arrive quite late — around ten in the evening. Is that okay?
Receptionist: Of course. Late check-in is no problem. May I take an email address for the confirmation?
Guest: Yes — omar dot harbi at email dot com.`,
        sectionNumber: 1,
        voice: "onyx",
      },
      {
        questionStart: 6,
        questionEnd: 10,
        breakMessage: "You now have 30 seconds to look at Questions 6 to 10.",
        transcript: `Receptionist: Will you need parking during your stay?
Guest: Yes, we'll have one car.
Receptionist: Parking is complimentary for hotel guests. Is there anything else I can help with?
Guest: Does the hotel have a gym?
Receptionist: Yes — the fitness centre opens at six in the morning and closes at ten at night.
Guest: Great. Could we request a quiet room, preferably on a higher floor away from the lift?
Receptionist: I'll add that to your booking. Standard check-out is at twelve noon.
Guest: One last thing — do you offer airport transfers?
Receptionist: We do. The shuttle costs seventy-five riyals each way and should be booked at least twenty-four hours in advance.`,
        sectionNumber: 1,
        voice: "onyx",
      },
    ],
    questions: [
      q(1, 1, "form", "Guest name:", "Omar Al-Harbi"),
      q(2, 1, "form", "Arrival date:", "12 April"),
      q(3, 1, "form", "Phone number:", "0551234567"),
      q(4, 1, "form", "Room rate per night:", "180"),
      q(5, 1, "form", "Email:", "omar.harbi@email.com"),
      q(6, 1, "note", "Parking:", "complimentary"),
      q(7, 1, "note", "Gym opening time:", "6 AM"),
      q(8, 1, "note", "Room preference:", "high floor"),
      q(9, 1, "note", "Check-out time:", "noon"),
      q(10, 1, "note", "Shuttle cost (one way):", "75"),
    ],
  },
  {
    partNumber: 2,
    introText:
      "Section 2 of 4 — Listening. You will hear one speaker giving a talk about a city museum and community facilities. First, look at Questions 11 to 15.",
    blocks: [
      {
        questionStart: 11,
        questionEnd: 15,
        prepMessage: "You have 30 seconds to look at Questions 11 to 15.",
        transcript: `Good morning, and welcome to the Heritage City Museum. I'm your guide for today's community facilities tour.
The museum opens daily from nine AM to six PM, except Mondays when we close for maintenance.
Admission is twenty riyals for adults and ten riyals for students with a valid ID. Children under eight enter free.
Our special exhibition on traditional Gulf architecture runs until the end of August on the second floor.
The museum café serves light meals until four thirty PM, and the gift shop is located beside the main entrance.
Free guided tours in English and Arabic begin at eleven AM and three PM from the information desk.`,
        sectionNumber: 2,
        voice: "fable",
      },
      {
        questionStart: 16,
        questionEnd: 20,
        breakMessage: "You now have 30 seconds to look at Questions 16 to 20.",
        transcript: `Now I'll describe facilities you can match to the map in your question booklet.
The children's discovery room is in the west wing, next to the courtyard garden.
The lecture theatre is on the ground floor, directly opposite the ticket office.
Wheelchair access is available through the south entrance, where lifts connect all three floors.
The city archive collection is housed in the basement reading room, open by appointment only.
Finally, the outdoor sculpture park extends behind the east wing and closes at sunset each evening.`,
        sectionNumber: 2,
        voice: "fable",
      },
    ],
    questions: [
      q(11, 2, "mcq", "Museum opening time:", "9 AM", ["8 AM", "9 AM", "10 AM", "11 AM"]),
      q(12, 2, "mcq", "Adult admission:", "20 SAR", ["10 SAR", "15 SAR", "20 SAR", "25 SAR"]),
      q(13, 2, "mcq", "Free entry for children under:", "8", ["6", "7", "8", "10"]),
      q(14, 2, "mcq", "Special exhibition location:", "Second floor", ["Ground floor", "First floor", "Second floor", "Basement"]),
      q(15, 2, "mcq", "Guided tours start at:", "11 AM and 3 PM", ["10 AM and 2 PM", "11 AM and 3 PM", "12 PM and 4 PM", "1 PM and 5 PM"]),
      q(16, 2, "matching", "Children's discovery room:", "west wing"),
      q(17, 2, "matching", "Lecture theatre:", "opposite ticket office"),
      q(18, 2, "matching", "Wheelchair access:", "south entrance"),
      q(19, 2, "matching", "City archive:", "basement reading room"),
      q(20, 2, "matching", "Sculpture park:", "behind east wing"),
    ],
  },
  {
    partNumber: 3,
    introText:
      "Section 3 of 4 — Listening. You will hear a discussion between students and a tutor. Look at Questions 21 to 25.",
    blocks: [
      {
        questionStart: 21,
        questionEnd: 25,
        prepMessage: "You have 30 seconds to look at Questions 21 to 25.",
        transcript: `Tutor: For your urban agriculture project, what's your research focus?
Layla: We're comparing rooftop gardens with vertical farms in three districts.
Sam: I suggested surveying residents about food prices and access.
Tutor: Good. Which districts?
Layla: Downtown, Al-Naseem, and the university quarter.
Sam: We hypothesise vertical farms use forty percent less water.
Tutor: Cite the Singapore vertical farming study. Presentation is on the eighteenth.`,
        sectionNumber: 3,
        voice: "nova",
      },
      {
        questionStart: 26,
        questionEnd: 30,
        breakMessage: "You have 30 seconds to look at Questions 26 to 30.",
        transcript: `Tutor: Match each feature to the correct site type.
Layla: Soil-based growing suits rooftop gardens best.
Sam: Controlled LED lighting is mainly used in vertical farms.
Layla: Community workshops happen at the university quarter pilot.
Sam: Rainwater harvesting is standard downtown.
Layla: Produce delivery by bicycle serves Al-Naseem residents.`,
        sectionNumber: 3,
        voice: "alloy",
      },
    ],
    questions: [
      q(21, 3, "mcq", "The project compares:", "Two farming methods", ["Two farming methods", "Three districts only", "Food prices only", "Transport costs"]),
      q(22, 3, "mcq", "Sam proposed collecting data via:", "Resident surveys", ["Soil samples", "Resident surveys", "Traffic counts", "Satellite only"]),
      q(23, 3, "mcq", "Which district is NOT included?", "Industrial zone", ["Downtown", "Al-Naseem", "Industrial zone", "University quarter"]),
      q(24, 3, "mcq", "Expected water reduction:", "40%", ["20%", "30%", "40%", "50%"]),
      q(25, 3, "mcq", "Presentation date:", "The eighteenth", ["The eighth", "The fifteenth", "The eighteenth", "The twenty-second"]),
      q(26, 3, "matching-features", "Soil-based growing →", "rooftop gardens"),
      q(27, 3, "matching-features", "LED lighting →", "vertical farms"),
      q(28, 3, "matching-features", "Community workshops →", "university quarter"),
      q(29, 3, "matching-features", "Rainwater harvesting →", "downtown"),
      q(30, 3, "matching-features", "Bicycle delivery →", "Al-Naseem"),
    ],
  },
  {
    partNumber: 4,
    introText:
      "Section 4 of 4 — Listening. You will hear an academic lecture. Look at Questions 31 to 40.",
    blocks: [
      {
        questionStart: 31,
        questionEnd: 40,
        prepMessage: "You have 30 seconds to look at Questions 31 to 40.",
        transcript: `Today's lecture examines renewable energy storage. Lithium-ion batteries dominate portable applications but face resource limits.
Pumped hydro storage accounts for over ninety percent of global grid storage capacity. Flow batteries offer longer cycle life for stationary use.
Thermal storage using molten salt supports concentrated solar plants. Hydrogen electrolysis enables seasonal energy banking when coupled with renewables.
Solid-state batteries promise higher energy density but remain commercially limited. Grid-scale deployment requires balancing cost, lifespan, and geographic constraints.
Policy incentives in several Gulf states now prioritise hybrid solar-battery microgrids for remote communities.`,
        sectionNumber: 4,
        voice: "shimmer",
      },
    ],
    questions: [
      q(31, 4, "summary", "Dominant portable storage technology:", "lithium-ion"),
      q(32, 4, "summary", "Largest grid storage type:", "pumped hydro"),
      q(33, 4, "summary", "Flow batteries suit _____ use", "stationary"),
      q(34, 4, "summary", "Molten salt supports _____ solar", "concentrated"),
      q(35, 4, "summary", "Hydrogen enables _____ energy banking", "seasonal"),
      q(36, 4, "summary", "Solid-state batteries: higher energy _____", "density"),
      q(37, 4, "summary", "Deployment must balance cost and _____", "lifespan"),
      q(38, 4, "summary", "Gulf policy favours solar-_____ microgrids", "battery"),
      q(39, 4, "summary", "Pumped hydro share exceeds _____ percent", "ninety"),
      q(40, 4, "summary", "Thermal storage material:", "molten salt"),
    ],
  },
];

export function getAllListeningExamQuestions(): ListeningQuestion[] {
  return LISTENING_EXAM_PARTS.flatMap((p) => p.questions);
}

export function getListeningQuestionByNumber(n: number): ListeningQuestion | undefined {
  return getAllListeningExamQuestions().find((q) => q.number === n);
}
