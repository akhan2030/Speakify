import type { SpeakingPart, WritingTaskDef } from "./types";
import {
  buildListeningPartsFromVariant,
  type CompactListeningVariant,
} from "./listeningVariantBuilder";
import type { ListeningExamPart } from "./listeningExam";
import { LISTENING_VARIANTS_3_TO_5 } from "./academicListeningVariants3to5";

const LISTENING_VARIANTS: CompactListeningVariant[] = [
  {
    mockNumber: 1,
    introTexts: [
      "Section 1 of 4 — Listening. You will hear a conversation about registering for a technology conference in London. First, look at Questions 1 to 5.",
      "Section 2 of 4 — Listening. You will hear a talk about a science museum robotics exhibition. Look at Questions 11 to 15.",
      "Section 3 of 4 — Listening. You will hear students discussing a machine-learning assignment. Look at Questions 21 to 25.",
      "Section 4 of 4 — Listening. You will hear a lecture on neural networks. Look at Questions 31 to 40.",
    ],
    blocks: [
      {
        questionStart: 1,
        questionEnd: 5,
        formTitle: "FutureTech Conference — Registration Form",
        prepMessage: "You have 30 seconds to look at Questions 1 to 5.",
        transcript: `Coordinator: Good morning, FutureTech Conference registration desk in London. How can I help you?
Caller: Hello, I'd like to register for the AI Research Summit on the fifteenth of March.
Coordinator: Of course. Can I take your first name?
Caller: James.
Coordinator: And your surname?
Caller: Henderson — that's H-E-N-D-E-R-S-O-N.
Coordinator: Thank you, Mr Henderson. And a contact telephone number?
Caller: Oh seven seven, zero zero, nine zero zero, one two three.
Coordinator: The registration fee is three hundred and fifty pounds, including lunch.
Coordinator: May I have your email address for the confirmation?
Caller: james dot henderson at outlook dot com.`,
        voice: "onyx",
      },
      {
        questionStart: 6,
        questionEnd: 10,
        breakMessage: "You now have 30 seconds to look at Questions 6 to 10.",
        transcript: `Coordinator: I'll complete the rest of the form with you now.
Caller: Will I need parking at the venue?
Coordinator: Parking is included for speakers — one vehicle.
Caller: Do you require accommodation?
Coordinator: A single room for the fourteenth and fifteenth, please.
Coordinator: The partner hotel offers rooms from one hundred and twenty pounds per night.
Caller: I'd prefer a quiet room on an upper floor.
Coordinator: Check-in is from three PM. Your badge can be collected at Gate B.
Caller: What time does the keynote begin on the fifteenth?
Coordinator: The opening keynote starts at nine thirty AM in the main auditorium.`,
        voice: "onyx",
      },
      {
        questionStart: 11,
        questionEnd: 15,
        prepMessage: "You have 30 seconds to look at Questions 11 to 15.",
        transcript: `Welcome to the National Science Centre robotics exhibition. The gallery opens at ten AM daily, except Tuesdays.
Adult tickets cost forty-five pounds; students with ID pay twenty-five pounds. Children under seven enter free.
The interactive AI demo zone is on the third floor, open until five PM.
Guided tours in English run at eleven AM and two PM from the main atrium.
The café closes at four thirty PM; the souvenir shop is beside the north exit.`,
        voice: "fable",
      },
      {
        questionStart: 16,
        questionEnd: 20,
        breakMessage: "You now have 30 seconds to look at Questions 16 to 20.",
        transcript: `Match each facility to its location on the map.
The coding workshop studio is in the east wing, next to the planetarium entrance.
The children's maker space is on the ground floor, opposite the ticket machines.
Wheelchair access is through the west entrance, where lifts serve all levels.
The historical computing archive is in the basement, open by appointment.
The outdoor drone demonstration area is behind the south pavilion and closes at sunset.`,
        voice: "fable",
      },
      {
        questionStart: 21,
        questionEnd: 25,
        prepMessage: "You have 30 seconds to look at Questions 21 to 25.",
        transcript: `Tutor: For your neural network project, what's your focus?
Hannah: We're comparing supervised and unsupervised models on medical imaging data.
Patrick: I suggested using the university GPU cluster for training.
Tutor: Which datasets?
Hannah: The public chest X-ray set and our anonymised local sample.
Patrick: We expect convolutional models to outperform by at least twelve percent.
Tutor: Submit your draft report by the twenty-second.`,
        voice: "nova",
      },
      {
        questionStart: 26,
        questionEnd: 30,
        breakMessage: "You have 30 seconds to look at Questions 26 to 30.",
        transcript: `Tutor: Match each project feature to the correct model type.
Hannah: Image classification suits convolutional networks best.
Patrick: Clustering patient groups uses unsupervised learning.
Hannah: The ethics review applies to the local dataset only.
Patrick: Hyperparameter tuning runs on the GPU cluster.
Hannah: Final presentations are scheduled in Lab C.`,
        voice: "alloy",
      },
      {
        questionStart: 31,
        questionEnd: 35,
        prepMessage: "You have 30 seconds to look at Questions 31 to 35.",
        transcript: `Today's lecture examines deep learning fundamentals. Artificial neural networks mimic biological neurons through layered nodes.
Backpropagation adjusts weights using gradient descent. Convolutional layers excel at spatial pattern recognition in images.
Recurrent networks handle sequential data such as speech and text. Transformers use attention mechanisms for long-range dependencies.
Overfitting occurs when models memorise training data; dropout and regularisation mitigate this.`,
        voice: "shimmer",
      },
      {
        questionStart: 36,
        questionEnd: 40,
        breakMessage: "You now have 30 seconds to look at Questions 36 to 40.",
        transcript: `Transfer learning reuses pretrained models on new tasks, saving time and data in specialised domains.
Ethical AI requires transparency, fairness, and careful validation before clinical deployment.
Researchers must document bias testing and maintain human oversight in high-stakes decisions.
Explainability tools help clinicians understand model recommendations.
International standards for medical AI are still evolving rapidly.`,
        voice: "shimmer",
      },
    ],
    questions: [
      [1, "form", "First name:", "James"],
      [2, "form", "Surname:", "Henderson"],
      [3, "form", "Phone number:", "07700900123"],
      [4, "form", "Event date:", "15 March"],
      [5, "form", "Registration fee:", "350"],
      [6, "note", "Parking:", "included for speakers"],
      [7, "note", "Room nights:", "2"],
      [8, "note", "Room rate from:", "120"],
      [9, "note", "Badge collection:", "Gate B"],
      [10, "note", "Keynote time:", "9:30 AM"],
      [11, "mcq", "Gallery opening time:", "10 AM", ["9 AM", "10 AM", "11 AM"]],
      [12, "mcq", "Adult ticket:", "45", ["25", "35", "45"]],
      [13, "mcq", "Free entry under age:", "7", ["5", "6", "7"]],
      [14, "mcq", "AI demo zone floor:", "Third floor", ["First floor", "Second floor", "Third floor"]],
      [15, "mcq", "Tour times:", "11 AM and 2 PM", ["10 AM and 1 PM", "11 AM and 2 PM", "12 PM and 3 PM"]],
      [16, "matching", "Coding workshop:", "east wing"],
      [17, "matching", "Maker space:", "opposite ticket machines"],
      [18, "matching", "Wheelchair access:", "west entrance"],
      [19, "matching", "Computing archive:", "basement"],
      [20, "matching", "Drone area:", "south pavilion"],
      [21, "mcq", "Project compares:", "Supervised and unsupervised models", ["Two hospitals only", "Supervised and unsupervised models", "Hardware costs", "Survey methods"]],
      [22, "mcq", "Training location:", "GPU cluster", ["Home laptops", "GPU cluster", "Library PCs", "Cloud only"]],
      [23, "mcq", "Dataset NOT used:", "Social media posts", ["Chest X-ray set", "Local sample", "Social media posts", "Anonymised data"]],
      [24, "mcq", "Expected improvement:", "12%", ["5%", "8%", "12%", "20%"]],
      [25, "mcq", "Report deadline:", "The twenty-second", ["The twelfth", "The eighteenth", "The twenty-second", "The twenty-eighth"]],
      [26, "matching-features", "Image classification →", "convolutional networks"],
      [27, "matching-features", "Clustering →", "unsupervised learning"],
      [28, "matching-features", "Ethics review →", "local dataset"],
      [29, "matching-features", "Hyperparameter tuning →", "GPU cluster"],
      [30, "matching-features", "Presentations →", "Lab C"],
      [31, "note", "Weight adjustment method:", "backpropagation"],
      [32, "note", "Layers for image patterns:", "convolutional"],
      [33, "note", "Networks for sequences:", "recurrent"],
      [34, "note", "Mechanism in transformers:", "attention"],
      [35, "note", "Problem when memorising data:", "overfitting"],
      [36, "summary", "Reusing pretrained models:", "transfer learning"],
      [37, "summary", "Ethical pillar mentioned:", "fairness"],
      [38, "summary", "Required before clinical use:", "validation"],
      [39, "summary", "Helps clinicians understand models:", "explainability"],
      [40, "summary", "Still evolving for medical AI:", "standards"],
    ],
  },
  {
    mockNumber: 2,
    introTexts: [
      "Section 1 of 4 — Listening. You will hear a call to a psychology clinic. Look at Questions 1 to 5.",
      "Section 2 of 4 — Listening. You will hear a talk about a community wellbeing centre. Look at Questions 11 to 15.",
      "Section 3 of 4 — Listening. You will hear students discussing a behaviour study. Look at Questions 21 to 25.",
      "Section 4 of 4 — Listening. You will hear a lecture on cognitive psychology. Look at Questions 31 to 40.",
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
Receptionist: The first session fee is eighty-five pounds.
Caller: Do you offer evening appointments?
Receptionist: Yes, Thursdays until eight PM. Your email for confirmation?
Caller: emily dot ward at gmail dot com.`,
        voice: "nova",
      },
      {
        questionStart: 6, questionEnd: 10,
        breakMessage: "You now have 30 seconds to look at Questions 6 to 10.",
        transcript: `Receptionist: Is this your first visit to our clinic?
Caller: Yes.
Receptionist: Please arrive fifteen minutes early to complete intake forms.
Caller: I prefer a female therapist if possible.
Receptionist: Dr Emily Ward has availability at four thirty PM.
Caller: Is parking available?
Receptionist: Underground parking is free for clients for ninety minutes.
Caller: What is your cancellation policy?
Receptionist: Please give twenty-four hours notice to avoid a fifty percent charge.`,
        voice: "nova",
      },
      {
        questionStart: 11, questionEnd: 15,
        prepMessage: "You have 30 seconds to look at Questions 11 to 15.",
        transcript: `Welcome to the Riverside Wellbeing Centre. We open Monday to Saturday, nine AM to seven PM.
Drop-in mindfulness sessions are free and run at ten AM and four PM in Studio 2.
Membership costs one hundred and twenty pounds per month and includes two group workshops.
The family support programme meets every Wednesday at six PM in Room 4.
Our library of self-help resources is on the first floor, open until six PM.`,
        voice: "echo",
      },
      {
        questionStart: 16, questionEnd: 20,
        breakMessage: "You now have 30 seconds to look at Questions 16 to 20.",
        transcript: `Now match each service to its location.
The meditation garden is behind the main building, near the river path.
The youth counselling suite is on the second floor, above the reception desk.
Accessible toilets are located beside the lift on each floor.
The occupational therapy gym is in the west annex, opposite the car park.
The staff rest area is in the basement and not open to visitors.`,
        voice: "echo",
      },
      {
        questionStart: 21, questionEnd: 25,
        prepMessage: "You have 30 seconds to look at Questions 21 to 25.",
        transcript: `Supervisor: Describe your observational study design.
Oliver: We're recording helping behaviour in campus common areas across three time blocks.
Claire: Participants don't know they're being observed from behind tinted glass.
Supervisor: Sample size?
Oliver: We aim for sixty interactions per location.
Claire: We'll code responses using the bystander framework from the textbook.
Supervisor: Ethics approval is required before you start filming.`,
        voice: "onyx",
      },
      {
        questionStart: 26, questionEnd: 30,
        breakMessage: "You have 30 seconds to look at Questions 26 to 30.",
        transcript: `Supervisor: Match each study element to the correct category.
Oliver: Time blocks represent the independent schedule variable.
Claire: Helping acts are the dependent behaviour measure.
Oliver: Tinted glass ensures participant anonymity.
Claire: The coding sheet comes from chapter seven.
Oliver: Pilot testing begins next Monday in Building D.`,
        voice: "alloy",
      },
      {
        questionStart: 31, questionEnd: 35,
        prepMessage: "You have 30 seconds to look at Questions 31 to 35.",
        transcript: `This lecture introduces cognitive psychology. Perception filters sensory input before conscious awareness.
Working memory holds limited information for brief periods during problem solving. Long-term memory stores schemas that influence interpretation.
Heuristics are mental shortcuts that can produce systematic biases. Confirmation bias leads people to favour evidence supporting existing beliefs.`,
        voice: "shimmer",
      },
      {
        questionStart: 36, questionEnd: 40,
        breakMessage: "You now have 30 seconds to look at Questions 36 to 40.",
        transcript: `Cognitive behavioural therapy targets unhelpful thought patterns to change emotional responses.
Neuroplasticity shows the brain can reorganise after experience and structured practice.
Mindfulness training may strengthen attention control in anxious populations.
Researchers debate how much unconscious processing shapes everyday decisions.
Evidence-based practice combines clinical judgement with replicated findings.`,
        voice: "shimmer",
      },
    ],
    questions: [
      [1, "form", "First name:", "Emily"],
      [2, "form", "Surname:", "Ward"],
      [3, "form", "Appointment date:", "3 May"],
      [4, "form", "Phone number:", "079123456789"],
      [5, "form", "Session fee:", "85"],
      [6, "note", "First visit:", "yes"],
      [7, "note", "Arrival time:", "15 minutes early"],
      [8, "note", "Therapist:", "Dr Emily Ward"],
      [9, "note", "Parking:", "free 90 minutes"],
      [10, "note", "Cancellation notice:", "24 hours"],
      [11, "mcq", "Centre hours:", "9 AM to 7 PM", ["8 AM to 6 PM", "9 AM to 7 PM", "10 AM to 8 PM"]],
      [12, "mcq", "Mindfulness sessions:", "Free", ["10", "25", "Free"]],
      [13, "mcq", "Monthly membership:", "120", ["80", "100", "120"]],
      [14, "mcq", "Family programme day:", "Wednesday", ["Monday", "Tuesday", "Wednesday"]],
      [15, "mcq", "Library floor:", "First floor", ["Ground floor", "First floor", "Second floor"]],
      [16, "matching", "Meditation garden:", "behind main building"],
      [17, "matching", "Youth counselling:", "second floor"],
      [18, "matching", "Accessible toilets:", "beside the lift"],
      [19, "matching", "Therapy gym:", "west annex"],
      [20, "matching", "Staff rest area:", "basement"],
      [21, "mcq", "Study measures:", "Helping behaviour", ["Exam scores", "Helping behaviour", "Sleep quality", "Diet choices"]],
      [22, "mcq", "Observation method:", "Behind tinted glass", ["Online surveys", "Phone interviews", "Behind tinted glass", "Public questionnaires"]],
      [23, "mcq", "Interactions per site:", "60", ["30", "45", "60", "90"]],
      [24, "mcq", "Coding framework:", "Bystander", ["Attachment", "Bystander", "Cognitive dissonance", "Maslow"]],
      [25, "mcq", "Required approval:", "Ethics", ["Funding", "Ethics", "Marketing", "Library"]],
      [26, "matching-features", "Time blocks →", "independent schedule"],
      [27, "matching-features", "Helping acts →", "dependent behaviour"],
      [28, "matching-features", "Tinted glass →", "anonymity"],
      [29, "matching-features", "Coding sheet →", "chapter seven"],
      [30, "matching-features", "Pilot testing →", "Building D"],
      [31, "summary", "Brief problem-solving store:", "working memory"],
      [32, "summary", "Mental shortcuts:", "heuristics"],
      [33, "summary", "Favouring existing beliefs:", "confirmation bias"],
      [34, "summary", "Therapy targeting thoughts:", "cognitive behavioural"],
      [35, "summary", "Brain reorganisation:", "neuroplasticity"],
      [36, "summary", "Influences interpretation:", "schemas"],
      [37, "summary", "Filters sensory input:", "perception"],
      [38, "summary", "Long-term store type:", "long-term memory"],
      [39, "summary", "Systematic bias source:", "heuristics"],
      [40, "summary", "Changes emotional responses:", "therapy"],
    ],
  },
  ...LISTENING_VARIANTS_3_TO_5,
];

const WRITING_VARIANTS: Array<{ task1: WritingTaskDef; task2: WritingTaskDef }> = [
  {
    task1: {
      id: "mock-w1-t1",
      title: "Task 1",
      prompt: `The table below shows AI research publications from four Saudi universities in 2022 and 2025.

King Saud University: 120 → 185
KAUST: 95 → 160
King Abdulaziz University: 88 → 142
Imam University: 45 → 78

Write a report of at least 150 words summarising the main trends.`,
      minWords: 150,
      chartData: {
        title: "AI research publications",
        countries: ["KSU", "KAUST", "KAU", "Imam"],
        years: [2022, 2025],
        values: [[120, 185], [95, 160], [88, 142], [45, 78]],
      },
    },
    task2: {
      id: "mock-w1-t2",
      title: "Task 2",
      prompt: `Some believe artificial intelligence will create more jobs than it destroys. Others fear widespread unemployment.

Discuss both views and give your own opinion. Write at least 250 words.`,
      minWords: 250,
    },
  },
  {
    task1: {
      id: "mock-w2-t1",
      title: "Task 1",
      prompt: `The chart shows average weekly hours spent on social media by age group in 2024.

Ages 16–24: 28 hours
Ages 25–34: 22 hours
Ages 35–44: 15 hours
Ages 45–54: 9 hours
Ages 55+: 5 hours

Write a report of at least 150 words describing the data.`,
      minWords: 150,
      chartData: {
        title: "Weekly social media hours by age",
        countries: ["16–24", "25–34", "35–44", "45–54", "55+"],
        years: [2024],
        values: [[28], [22], [15], [9], [5]],
      },
    },
    task2: {
      id: "mock-w2-t2",
      title: "Task 2",
      prompt: `Many young people experience stress and anxiety. What causes this, and what solutions can schools and families offer?

Write at least 250 words.`,
      minWords: 250,
    },
  },
  {
    task1: {
      id: "mock-w3-t1",
      title: "Task 1",
      prompt: `The graph shows student enrolment in online versus campus courses at a Saudi university (2019–2025).

Online: 1,200 → 4,800
Campus: 8,500 → 7,100

Write at least 150 words comparing the trends.`,
      minWords: 150,
      chartData: {
        title: "Course enrolment (online vs campus)",
        countries: ["Online", "Campus"],
        years: [2019, 2025],
        values: [[1200, 4800], [8500, 7100]],
      },
    },
    task2: {
      id: "mock-w3-t2",
      title: "Task 2",
      prompt: `Some argue that online learning is as effective as classroom teaching. Others disagree.

Discuss both views and give your opinion. Write at least 250 words.`,
      minWords: 250,
    },
  },
  {
    task1: {
      id: "mock-w4-t1",
      title: "Task 1",
      prompt: `The diagram data shows space-related research funding (million SAR) in four countries (2020 vs 2024).

Saudi Arabia: 180 → 320
UAE: 150 → 260
Qatar: 90 → 140
Kuwait: 60 → 95

Write at least 150 words.`,
      minWords: 150,
      chartData: {
        title: "Space research funding (M SAR)",
        countries: ["Saudi", "UAE", "Qatar", "Kuwait"],
        years: [2020, 2024],
        values: [[180, 320], [150, 260], [90, 140], [60, 95]],
      },
    },
    task2: {
      id: "mock-w4-t2",
      title: "Task 2",
      prompt: `Governments should spend more on space exploration. To what extent do you agree?

Write at least 250 words.`,
      minWords: 250,
    },
  },
  {
    task1: {
      id: "mock-w5-t1",
      title: "Task 1",
      prompt: `The bar chart shows annual visitors (thousands) to four Saudi cultural venues in 2023 and 2025.

National Museum: 420 → 580
Art Jameel: 180 → 310
Ithra: 350 → 490
Heritage Village: 260 → 340

Write at least 150 words.`,
      minWords: 150,
      chartData: {
        title: "Cultural venue visitors (thousands)",
        countries: ["National Museum", "Art Jameel", "Ithra", "Heritage Village"],
        years: [2023, 2025],
        values: [[420, 580], [180, 310], [350, 490], [260, 340]],
      },
    },
    task2: {
      id: "mock-w5-t2",
      title: "Task 2",
      prompt: `Art and culture are essential for modern society. Do you agree?

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
