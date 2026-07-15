import { getTask1PromptById } from "@/lib/ielts/writingTaskData";
import type { SpeakingPart, WritingTaskDef } from "./types";
import {
  buildListeningPartsFromVariant,
  type CompactListeningVariant,
} from "./listeningVariantBuilder";
import type { ListeningExamPart } from "./listeningExam";
import { LISTENING_VARIANTS_3_TO_5 } from "./academicListeningVariants3to5";
import { writingTask1FromQuestion } from "./academicWritingTask1";

function mockTask1(promptId: string, taskId: string): WritingTaskDef {
  const question = getTask1PromptById(promptId);
  if (!question) {
    throw new Error(`Academic mock Task 1 prompt not found: ${promptId}`);
  }
  return writingTask1FromQuestion(question, taskId);
}

const LISTENING_VARIANTS: CompactListeningVariant[] = [
  {
    mockNumber: 1,
    introTexts: [
      "Section 1 of 4 — Listening. You will hear a conversation about booking a holiday cottage. First, look at Questions 1 to 5.",
      "Section 2 of 4 — Listening. You will hear a talk about a riverside sports centre. Look at Questions 11 to 17.",
      "Section 3 of 4 — Listening. You will hear students discussing a journal submission. Look at Questions 21 to 25.",
      "Section 4 of 4 — Listening. You will hear a lecture on soil science. Look at Questions 31 to 33.",
    ],
    blocks: [
      {
        questionStart: 1,
        questionEnd: 5,
        formTitle: "Seaside Cottage — Booking Form",
        prepMessage: "You have 30 seconds to look at Questions 1 to 5.",
        transcript: `Coordinator: Good morning, Cornwall Cottages. How can I help you?
Caller: Hello, I'd like to book Seaside Cottage for the weekend of the fifteenth of March.
Coordinator: Of course. Can I take your first name?
Caller: James.
Coordinator: And your surname?
Caller: Henderson — that's H-E-N-D-E-R-S-O-N.
Coordinator: Thank you, Mr Henderson. And a contact telephone number?
Caller: Oh seven seven, zero zero, nine zero zero, one two three.
Coordinator: The weekend rate is three hundred and eighty pounds.
Caller: Three hundred and eighty?
Coordinator: Sorry — actually three hundred and fifty. I was looking at the bank-holiday tariff.
Caller: Three hundred and fifty — fine.
Coordinator: May I have your email for the confirmation?
Caller: james dot henderson at outlook dot com.`,
        voice: "onyx",
      },
      {
        questionStart: 6,
        questionEnd: 10,
        breakMessage: "You now have 30 seconds to look at Questions 6 to 10.",
        transcript: `Coordinator: A few more details about the property, then.
Caller: What's the kitchen worktop made of?
Coordinator: It's solid oak — not laminate, though some online photos look like that.
Caller: And the dining table seats how many?
Coordinator: Six normally. People sometimes ask for eight; we don't have that extension.
Caller: Deposit?
Coordinator: Sixty-five pounds — sixty-five — held until checkout.
Caller: Colour of the bedroom curtains?
Coordinator: Cream. A few guests say beige, but the inventory lists cream.
Caller: And the nearest shop?
Coordinator: On Harbour Street — that's Harbour, one word.`,
        voice: "onyx",
      },
      {
        questionStart: 11,
        questionEnd: 17,
        prepMessage: "You have 30 seconds to look at Questions 11 to 17.",
        transcript: `Welcome to the Riverside Sports Centre. If you look at the map in your booklet, I'll point out the main facilities.
Start at the south entrance. Directly opposite the ticket barriers you'll see the bike racks — that's letter A on your plan. Don't confuse them with the overflow car park further west.
Moving clockwise, the café sits beside the atrium fountain — letter B. It's popular after morning classes.
The swimming pool occupies the whole east wing — letter C. Changing rooms are next door to the west of the pool, letter E — not beside reception.
Reception itself is letter D, just inside the main doors, next to the information screen.
Tennis courts are outdoors on the north edge of the site — letter F. The climbing wall is indoors in the far north-west corner — letter J — and the gym faces the river on the west side — letter I.
Finally, the first-aid room is marked H, behind reception. The large car park on the west boundary is letter G if you need it later.`,
        voice: "fable",
      },
      {
        questionStart: 18,
        questionEnd: 20,
        breakMessage: "You now have 30 seconds to look at Questions 18 to 20.",
        transcript: `A few practical points about opening times and weekend services.
The centre opens at seven AM on weekdays. On Sundays we open later — at nine AM, not eight as some old posters still say.
Membership includes unlimited gym access. If you're asking which extra services run on Sundays, note carefully: the café stays open, and the swimming pool has public lanes all day. Tennis coaching does not run on Sundays, and the climbing wall is staffed only on Saturdays. Bike hire is weekdays only.
So for Sunday services, remember café and pool — those two.`,
        voice: "fable",
      },
      {
        questionStart: 21,
        questionEnd: 25,
        prepMessage: "You have 30 seconds to look at Questions 21 to 25.",
        transcript: `Tutor: Before you submit to the journal, let's check your manuscript checklist.
Hannah: We've finished the abstract — one hundred and fifty words.
Patrick: And we still need better key words — sorry, keywords — for the online form.
Tutor: Good. Have you attached the final draft?
Hannah: Yes, the final draft is in the shared folder.
Patrick: Style guide — which one?
Tutor: Use the journal style guide, not the faculty handbook. The handbook is for essays only.
Hannah: Er — wait. Patrick, didn't we say the word limit was eight thousand?
Patrick: Oh — sorry, actually six thousand. Eight thousand was last year's special issue.
Tutor: Also include a short cover letter with author affiliations.`,
        voice: "nova",
      },
      {
        questionStart: 26,
        questionEnd: 30,
        breakMessage: "You have 30 seconds to look at Questions 26 to 30.",
        transcript: `Tutor: Now the submission flow-chart — follow each box in order.
Patrick: First we submit the manuscript online.
Hannah: Then we check email for the acknowledgment — usually within twenty-four hours.
Tutor: After that comes peer review. Reviewers may request major changes.
Patrick: Possible outcomes are accept, revise, or reject. We shouldn't assume accept.
Hannah: If we get revise, we revise the paper and upload a response letter.
Tutor: Exactly. Don't skip the response letter — editors look for it.
Patrick: And if it's reject?
Tutor: Then you may submit elsewhere, but that's outside this chart.`,
        voice: "alloy",
      },
      {
        questionStart: 31,
        questionEnd: 33,
        prepMessage: "You have 30 seconds to look at Questions 31 to 33.",
        transcript: `Today's lecture examines soil science for sustainable farming. Healthy soil supports plant roots and stores water during dry periods.
Organic matter improves structure and feeds microorganisms. Farmers who ignore soil health often see declining yields within a decade.
We will also compare conventional and organic systems later in the hour.`,
        voice: "shimmer",
      },
      {
        questionStart: 34,
        questionEnd: 36,
        breakMessage: "You now have 30 seconds to look at Questions 34 to 36.",
        transcript: `Look at the soil-profile diagram. The top layer is the topsoil, rich in organic matter — label that clearly.
Below it lies the subsoil, which holds minerals but fewer living organisms.
At the base of the diagram is the bedrock, the weathered parent material. Some textbooks call the middle layer \"mineral soil\"; in this course we use subsoil.`,
        voice: "shimmer",
      },
      {
        questionStart: 37,
        questionEnd: 40,
        breakMessage: "You now have 30 seconds to look at Questions 37 to 40.",
        transcript: `Finally, problems and comparisons. Compaction from heavy machinery reduces aeration — that is a major problem on clay soils.
Nutrient runoff after heavy rain pollutes nearby streams.
Conventional systems often rely on synthetic fertiliser, while organic systems favour compost and crop rotation.
One further note: erosion on steep slopes remains a shared risk for both systems if ground cover is removed.`,
        voice: "shimmer",
      },
    ],
    questions: [
      [1, "form", "First name:", "James"],
      [2, "form", "Surname:", "Henderson"],
      [3, "form", "Phone number:", "07700900123"],
      [4, "form", "Arrival date:", "15 March/(the) 15(th) March"],
      [5, "form", "Weekend rate:", "£350/350 pounds/three hundred and fifty"],
      [6, "note", "Worktop material:", "oak"],
      [7, "note", "Dining seats:", "6/six"],
      [8, "note", "Deposit:", "65/sixty-five"],
      [9, "note", "Curtain colour:", "cream"],
      [10, "note", "Shop location:", "Harbour Street/Harbour St"],
      [11, "matching", "Bike racks:", "A", ["bike racks", "café", "swimming pool", "reception", "changing rooms", "tennis courts", "car park", "first-aid room", "gym", "climbing wall"]],
      [12, "matching", "Café:", "B", ["bike racks", "café", "swimming pool", "reception", "changing rooms", "tennis courts", "car park", "first-aid room", "gym", "climbing wall"]],
      [13, "matching", "Swimming pool:", "C", ["bike racks", "café", "swimming pool", "reception", "changing rooms", "tennis courts", "car park", "first-aid room", "gym", "climbing wall"]],
      [14, "matching", "Reception:", "D", ["bike racks", "café", "swimming pool", "reception", "changing rooms", "tennis courts", "car park", "first-aid room", "gym", "climbing wall"]],
      [15, "matching", "Changing rooms:", "E", ["bike racks", "café", "swimming pool", "reception", "changing rooms", "tennis courts", "car park", "first-aid room", "gym", "climbing wall"]],
      [16, "matching", "Tennis courts:", "F", ["bike racks", "café", "swimming pool", "reception", "changing rooms", "tennis courts", "car park", "first-aid room", "gym", "climbing wall"]],
      [17, "matching", "Climbing wall:", "J", ["bike racks", "café", "swimming pool", "reception", "changing rooms", "tennis courts", "car park", "first-aid room", "gym", "climbing wall"]],
      [18, "mcq", "Sunday opening time:", "9 AM", ["7 AM", "8 AM", "9 AM"]],
      [19, "mcq", "Which TWO Sunday services are available?", "D", ["tennis coaching", "climbing wall", "bike hire", "café", "swimming pool"], { chooseCount: 2, eitherOrderGroup: "mock1-s2-19-20" }],
      [20, "mcq", "Which TWO Sunday services are available?", "E", ["tennis coaching", "climbing wall", "bike hire", "café", "swimming pool"], { chooseCount: 2, eitherOrderGroup: "mock1-s2-19-20" }],
      [21, "note", "Checklist — short summary:", "abstract"],
      [22, "note", "Online form needs:", "key words/keywords"],
      [23, "note", "Upload the:", "(the) final draft/final draft"],
      [24, "note", "Follow the journal:", "style guide"],
      [25, "note", "Maximum words:", "6000/six thousand"],
      [26, "flowchart", "1. _____ the manuscript online", "submit"],
      [27, "flowchart", "2. Check _____ for acknowledgment", "email"],
      [28, "flowchart", "3. Stage of expert reading:", "peer review"],
      [29, "flowchart", "4. Possible results: accept / _____ / reject", "revise"],
      [30, "flowchart", "5. If revise → _____ the paper", "revise"],
      [31, "summary", "Healthy soil stores:", "water"],
      [32, "summary", "Organic matter feeds:", "microorganisms"],
      [33, "summary", "Ignoring soil health → falling:", "yields"],
      [34, "diagram", "Top layer:", "topsoil"],
      [35, "diagram", "Middle layer:", "subsoil"],
      [36, "diagram", "Base layer:", "bedrock"],
      [37, "note", "Machinery problem:", "compaction"],
      [38, "note", "Rain causes nutrient:", "runoff"],
      [39, "note", "Conventional systems use synthetic:", "fertiliser/fertilizer"],
      [40, "note", "Organic systems favour:", "compost"],
    ],
  },
  {
    mockNumber: 2,
    introTexts: [
      "Section 1 of 4 — Listening. You will hear a call to a psychology clinic. Look at Questions 1 to 5.",
      "Section 2 of 4 — Listening. You will hear a talk about a community wellbeing centre. Look at Questions 11 to 17.",
      "Section 3 of 4 — Listening. You will hear students planning a research ethics submission. Look at Questions 21 to 25.",
      "Section 4 of 4 — Listening. You will hear a lecture on memory systems. Look at Questions 31 to 33.",
    ],
    blocks: [
      {
        questionStart: 1, questionEnd: 5,
        formTitle: "MindWell Clinic — Appointment Form",
        prepMessage: "You have 30 seconds to look at Questions 1 to 5.",
        transcript: `Receptionist: MindWell Clinic in Manchester, good afternoon.
Caller: I'd like to book an initial counselling session for the third of May.
Receptionist: May I take your first name?
Caller: Emily.
Receptionist: And your surname?
Caller: Ward — that's W-A-R-D.
Receptionist: A contact number, please?
Caller: Oh seven nine, one two three, four five six seven eight nine.
Receptionist: The first session fee is ninety-five pounds.
Caller: Ninety-five?
Receptionist: Sorry — actually eighty-five pounds for new clients. I quoted the follow-up rate by mistake.
Caller: Eighty-five — thank you.
Receptionist: Your email for confirmation?
Caller: emily dot ward at gmail dot com.`,
        voice: "nova",
      },
      {
        questionStart: 6, questionEnd: 10,
        breakMessage: "You now have 30 seconds to look at Questions 6 to 10.",
        transcript: `Receptionist: A couple of practical points before we confirm.
Caller: This is my first visit.
Receptionist: Noted. Parking?
Receptionist: Client parking is free for ninety minutes underground. Street meters nearby cost about two pounds an hour.
Caller: Arrival?
Receptionist: Come fifteen minutes early for forms — fifteen.
Caller: Therapist preference?
Receptionist: We can offer a female therapist on Thursdays.
Caller: Address for the clinic?
Receptionist: Fourteen Willow Lane — Willow Lane.
Caller: Cancellation?
Receptionist: Twenty-four hours' notice or you pay half the fee.`,
        voice: "nova",
      },
      {
        questionStart: 11, questionEnd: 17,
        prepMessage: "You have 30 seconds to look at Questions 11 to 17.",
        transcript: `Welcome to the Riverside Wellbeing Centre. Please look at the site map.
Accessible toilets are letter A — beside the lift on each floor. Reception has a drinking fountain opposite the desk; that is not the toilets.
The occupational therapy gym is letter B, in the west annex facing the car park.
Youth counselling is letter C, upstairs on the second floor above reception.
The meditation garden is letter D, behind the main building near the river path.
The staff rest area is letter E in the basement — not for clients, though visitors sometimes ask for a \"quiet room\".
Family support meets in letter F, Room 4 on the ground floor east corridor.
The resource library is letter G on the first floor. Mindfulness studio 2 is letter H next to the courtyard doors.
Roof terrace — letter I — is staff-only now. The main car park entrance is letter J on the west boundary.`,
        voice: "echo",
      },
      {
        questionStart: 18, questionEnd: 20,
        breakMessage: "You now have 30 seconds to look at Questions 18 to 20.",
        transcript: `Opening hours and weekend programmes next.
We're open Monday to Saturday, nine AM to seven PM — closed Sundays for deep cleaning, not for private hire as some websites claim.
Which two drop-in activities run without booking? Mindfulness in Studio 2, and the self-help library browsing hour. Family support needs a referral, youth counselling is appointment-only, and the therapy gym requires staff induction first.
So the two no-booking options are mindfulness and the library hour.`,
        voice: "echo",
      },
      {
        questionStart: 21, questionEnd: 25,
        prepMessage: "You have 30 seconds to look at Questions 21 to 25.",
        transcript: `Supervisor: Walk me through your ethics checklist before filming.
Oliver: We've written the participant information sheet.
Claire: And the consent form — adults only for this pilot.
Supervisor: Data storage?
Oliver: Encrypted drive on the department server.
Claire: Um — Oliver, the proposal said cloud backup was optional.
Oliver: Oh — sorry, actually encrypted drive only. Cloud was last year's method.
Claire: We still need the risk assessment signed.
Supervisor: And cite the university ethics code in the appendix.`,
        voice: "onyx",
      },
      {
        questionStart: 26, questionEnd: 30,
        breakMessage: "You have 30 seconds to look at Questions 26 to 30.",
        transcript: `Supervisor: Here's the approval flow-chart.
Claire: First, complete the online form.
Oliver: Then upload supporting documents — information sheet and consent form.
Supervisor: The committee screens for completeness. Incomplete packs are returned.
Claire: After screening comes the panel meeting.
Oliver: Outcomes are approve, revise, or defer. We hope for approve.
Claire: If revise, we amend the protocol and resubmit within two weeks.
Supervisor: Don't skip the resubmit box on the chart.`,
        voice: "alloy",
      },
      {
        questionStart: 31, questionEnd: 33,
        prepMessage: "You have 30 seconds to look at Questions 31 to 33.",
        transcript: `This lecture introduces memory systems in cognitive psychology. Working memory holds limited information briefly during problem solving.
Long-term memory stores schemas that shape how we interpret new events. Attention acts as a gatekeeper before encoding begins.`,
        voice: "shimmer",
      },
      {
        questionStart: 34, questionEnd: 36,
        breakMessage: "You now have 30 seconds to look at Questions 34 to 36.",
        transcript: `On the multi-store diagram, sensory memory is the first box — fleeting visual or auditory traces.
The middle box is short-term memory, often called working memory in newer models; label it short-term for this diagram.
The final store is long-term memory, with effectively unlimited capacity.`,
        voice: "shimmer",
      },
      {
        questionStart: 37, questionEnd: 40,
        breakMessage: "You now have 30 seconds to look at Questions 37 to 40.",
        transcript: `Common problems: interference from similar material can block retrieval.
Decay over time weakens unused traces.
Rehearsal strengthens short-term items; elaborative rehearsal helps long-term learning.
Finally, context cues — such as returning to the original room — often improve recall in experiments.`,
        voice: "shimmer",
      },
    ],
    questions: [
      [1, "form", "First name:", "Emily"],
      [2, "form", "Surname:", "Ward"],
      [3, "form", "Appointment date:", "3 May/(the) 3(rd) May"],
      [4, "form", "Phone number:", "079123456789"],
      [5, "form", "Session fee:", "£85/85 pounds/eighty-five"],
      [6, "note", "First visit:", "yes"],
      [7, "note", "Arrive early (minutes):", "15/fifteen"],
      [8, "note", "Therapist preference:", "female"],
      [9, "note", "Clinic street:", "Willow Lane"],
      [10, "note", "Cancellation notice (hours):", "24/twenty-four"],
      [11, "matching", "Accessible toilets:", "A", ["beside the lift", "west annex", "second floor", "behind main building", "basement", "Room 4", "first-floor library", "Studio 2", "roof terrace", "west car park"]],
      [12, "matching", "Therapy gym:", "B", ["beside the lift", "west annex", "second floor", "behind main building", "basement", "Room 4", "first-floor library", "Studio 2", "roof terrace", "west car park"]],
      [13, "matching", "Youth counselling:", "C", ["beside the lift", "west annex", "second floor", "behind main building", "basement", "Room 4", "first-floor library", "Studio 2", "roof terrace", "west car park"]],
      [14, "matching", "Meditation garden:", "D", ["beside the lift", "west annex", "second floor", "behind main building", "basement", "Room 4", "first-floor library", "Studio 2", "roof terrace", "west car park"]],
      [15, "matching", "Staff rest area:", "E", ["beside the lift", "west annex", "second floor", "behind main building", "basement", "Room 4", "first-floor library", "Studio 2", "roof terrace", "west car park"]],
      [16, "matching", "Family support room:", "F", ["beside the lift", "west annex", "second floor", "behind main building", "basement", "Room 4", "first-floor library", "Studio 2", "roof terrace", "west car park"]],
      [17, "matching", "Resource library:", "G", ["beside the lift", "west annex", "second floor", "behind main building", "basement", "Room 4", "first-floor library", "Studio 2", "roof terrace", "west car park"]],
      [18, "mcq", "Sunday status:", "Closed", ["Open 9–7", "Open until noon", "Closed"]],
      [19, "mcq", "Which TWO activities need no booking?", "D", ["family support", "youth counselling", "therapy gym", "mindfulness", "library hour"], { chooseCount: 2, eitherOrderGroup: "mock2-s2-19-20" }],
      [20, "mcq", "Which TWO activities need no booking?", "E", ["family support", "youth counselling", "therapy gym", "mindfulness", "library hour"], { chooseCount: 2, eitherOrderGroup: "mock2-s2-19-20" }],
      [21, "note", "Checklist — participant:", "information sheet"],
      [22, "note", "Adults sign a:", "consent form"],
      [23, "note", "Data kept on:", "encrypted drive"],
      [24, "note", "Must complete a:", "risk assessment"],
      [25, "note", "Cite the ethics:", "code"],
      [26, "flowchart", "1. Complete the online _____", "form"],
      [27, "flowchart", "2. Upload supporting _____", "documents"],
      [28, "flowchart", "3. Committee _____ for completeness", "screens/screening"],
      [29, "flowchart", "4. Attend the panel _____", "meeting"],
      [30, "flowchart", "5. If revise → _____ the protocol", "amend/resubmit"],
      [31, "summary", "Brief store during problem solving:", "working memory"],
      [32, "summary", "Long-term stores:", "schemas"],
      [33, "summary", "Gatekeeper before encoding:", "attention"],
      [34, "diagram", "First store:", "sensory memory/sensory"],
      [35, "diagram", "Middle store:", "short-term memory/short-term"],
      [36, "diagram", "Final store:", "long-term memory/long-term"],
      [37, "note", "Similar material causes:", "interference"],
      [38, "note", "Unused traces undergo:", "decay"],
      [39, "note", "Strengthens short-term items:", "rehearsal"],
      [40, "note", "Returning to a room provides:", "context cues"],
    ],
  },
  ...LISTENING_VARIANTS_3_TO_5,
];

/** Authentic Academic Task 1 visuals — UK / Australia / Canada / USA contexts from the validated prompt bank. */
const WRITING_VARIANTS: Array<{ task1: WritingTaskDef; task2: WritingTaskDef }> = [
  {
    task1: mockTask1("library-membership", "mock-w1-t1"),
    task2: {
      id: "mock-w1-t2",
      title: "Task 2",
      prompt: `Some people believe that university education should be free for all students. To what extent do you agree or disagree?

Write at least 250 words.`,
      minWords: 250,
    },
  },
  {
    task1: mockTask1("housing-england-wales", "mock-w2-t1"),
    task2: {
      id: "mock-w2-t2",
      title: "Task 2",
      prompt: `Many young people experience stress and anxiety. What causes this, and what solutions can schools and families offer?

Write at least 250 words.`,
      minWords: 250,
    },
  },
  {
    task1: mockTask1("renewable-energy", "mock-w3-t1"),
    task2: {
      id: "mock-w3-t2",
      title: "Task 2",
      prompt: `Some argue that online learning is as effective as classroom teaching. Others disagree.

Discuss both views and give your opinion. Write at least 250 words.`,
      minWords: 250,
    },
  },
  {
    task1: mockTask1("museum-visitors", "mock-w4-t1"),
    task2: {
      id: "mock-w4-t2",
      title: "Task 2",
      prompt: `Governments should spend more money on the arts (museums, theatres, music). To what extent do you agree or disagree?

Write at least 250 words.`,
      minWords: 250,
    },
  },
  {
    task1: mockTask1("town-development", "mock-w5-t1"),
    task2: {
      id: "mock-w5-t2",
      title: "Task 2",
      prompt: `In many countries, more people are choosing to live in large cities. Do the advantages of living in a big city outweigh the disadvantages?

Write at least 250 words.`,
      minWords: 250,
    },
  },
];

const SPEAKING_VARIANTS: SpeakingPart[][] = [
  [
    { part: 1, answerSeconds: 60, questions: ["Do you enjoy learning about technology?", "How often do you read science news?", "Would you attend an AI conference? Why?", "Is innovation important in education?"] },
    { part: 2, prepSeconds: 60, answerSeconds: 120, questions: [], cueCard: { topic: "Describe a time technology helped you learn something.", bullets: ["what the technology was", "what you learned", "how it helped you", "and explain how you felt about the experience"] } },
    { part: 3, answerSeconds: 90, questions: ["How is AI changing workplaces?", "Should schools teach coding to all students?", "What risks come with rapid technological change?"] },
  ],
  [
    { part: 1, answerSeconds: 60, questions: ["Do you find it easy to talk about your feelings?", "How do you usually cope with stress?", "Have you ever spoken with a counsellor?", "Is mental health discussed openly in your culture?"] },
    { part: 2, prepSeconds: 60, answerSeconds: 120, questions: [], cueCard: { topic: "Describe a person who helped you through a difficult time.", bullets: ["who they were", "what the situation was", "how they helped you", "and explain why it mattered"] } },
    { part: 3, answerSeconds: 90, questions: ["Why is mental health awareness growing?", "How can employers support wellbeing?", "Will attitudes to therapy change in future?"] },
  ],
  [
    { part: 1, answerSeconds: 60, questions: ["Did you enjoy your school experience?", "What subject did you like most?", "Do you prefer studying alone or in groups?", "How has education changed since your parents' time?"] },
    { part: 2, prepSeconds: 60, answerSeconds: 120, questions: [], cueCard: { topic: "Describe a teacher who influenced you.", bullets: ["who they were", "what they taught", "what made them special", "and explain their impact on you"] } },
    { part: 3, answerSeconds: 90, questions: ["Is online education the future?", "How can governments improve literacy?", "What skills will graduates need in 2030?"] },
  ],
  [
    { part: 1, answerSeconds: 60, questions: ["Are you interested in astronomy?", "Did you visit a planetarium as a child?", "Would you travel to space if you could?", "How important is space research for Saudi Arabia?"] },
    { part: 2, prepSeconds: 60, answerSeconds: 120, questions: [], cueCard: { topic: "Describe an experience of stargazing or watching the night sky.", bullets: ["when and where it happened", "who you were with", "what you observed", "and explain how you felt"] } },
    { part: 3, answerSeconds: 90, questions: ["Should nations cooperate on space missions?", "What are the dangers of space debris?", "Will humans live on other planets?"] },
  ],
  [
    { part: 1, answerSeconds: 60, questions: ["Do you visit museums or galleries?", "What kind of art do you enjoy?", "Is traditional crafts important in your country?", "Would you like to learn a creative skill?"] },
    { part: 2, prepSeconds: 60, answerSeconds: 120, questions: [], cueCard: { topic: "Describe a cultural event you attended.", bullets: ["what the event was", "where it took place", "what you saw or did", "and explain why it was memorable"] } },
    { part: 3, answerSeconds: 90, questions: ["How does culture shape identity?", "Should governments fund the arts?", "How is globalisation affecting local traditions?"] },
  ],
];

export function getListeningPartsForMock(mockNumber: number): ListeningExamPart[] {
  const variant =
    LISTENING_VARIANTS.find((v) => v.mockNumber === mockNumber) ??
    LISTENING_VARIANTS[(Math.max(1, mockNumber) - 1) % LISTENING_VARIANTS.length];
  return buildListeningPartsFromVariant(variant);
}

export function getWritingTasksForMock(mockNumber: number): {
  task1: WritingTaskDef;
  task2: WritingTaskDef;
} {
  const index = (Math.max(1, mockNumber) - 1) % WRITING_VARIANTS.length;
  return WRITING_VARIANTS[index];
}

export function getSpeakingPartsForMock(mockNumber: number): SpeakingPart[] {
  const index = (Math.max(1, mockNumber) - 1) % SPEAKING_VARIANTS.length;
  return SPEAKING_VARIANTS[index];
}

export function getSkillVariantsForMock(mockNumber: number) {
  return {
    listening: getListeningPartsForMock(mockNumber),
    writing: getWritingTasksForMock(mockNumber),
    speaking: getSpeakingPartsForMock(mockNumber),
  };
}
