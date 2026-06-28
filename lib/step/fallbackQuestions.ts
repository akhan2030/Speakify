import type {
  StepCompositionalItem,
  StepListeningRecording,
  StepReadingPassage,
  StepStructureItem,
} from "./types";

const READING_PASSAGE_1: StepReadingPassage = {
  id: "fb-r1",
  paragraphs: [
    {
      number: 1,
      text: "Across Saudi Arabia, universities are expanding programs that prepare students for international study and professional careers. English proficiency has become a gateway skill, not only for admission abroad but also for competitive jobs in technology, healthcare, and engineering. The Standardized Test of English Proficiency (STEP), administered by Qiyas, measures whether candidates can understand academic texts, apply grammar accurately, follow spoken English, and analyze sentence structure under timed conditions.",
    },
    {
      number: 2,
      text: "Many students begin preparation months before their test date. They divide study time according to section weight: reading receives the largest share because it represents forty percent of the total score. Effective readers preview questions before reading the passage, underline key terms, and distinguish between facts stated directly and ideas that must be inferred. Vocabulary-in-context items often test words that have everyday meanings but carry a specialized sense in the passage.",
    },
    {
      number: 3,
      text: "Coaching centers in Riyadh, Jeddah, and Dammam report that consistent daily practice outperforms last-minute cramming. Students who review their mistakes—especially in structure and compositional analysis—tend to improve faster than those who only take full mocks. The author of several popular STEP guides argues that understanding why an answer is wrong matters as much as memorizing rules. This reflective approach builds the analytical habits required for university-level reading lists and workplace communication.",
    },
    {
      number: 4,
      text: "Despite widespread preparation, anxiety remains common on test day. Examiners remind candidates that the exam is computer-based, that all items are multiple-choice, and that there is no speaking or essay section. Pacing is critical: spending too long on a single reading passage can reduce time for later sections. Students who simulate real conditions—timed blocks, no dictionary, single-play listening—often report higher confidence when they sit for the official exam at an authorized center.",
    },
  ],
  boldTerms: ["meticulous", "inferred", "gateway"],
  questions: [
    {
      id: "fb-r1-q1",
      section: "reading",
      questionType: "main_idea",
      stem: "What is the main purpose of this passage?",
      options: {
        A: "To advertise a specific coaching center in Riyadh",
        B: "To explain how STEP fits into student preparation and effective study habits",
        C: "To argue that STEP should include a writing section",
        D: "To compare STEP with IELTS and TOEFL in detail",
      },
      correct: "B",
      explanation:
        "The passage discusses STEP's role, section weights, and how students prepare effectively.",
    },
    {
      id: "fb-r1-q2",
      section: "reading",
      questionType: "vocabulary_in_context",
      stem: 'The word "gateway" in paragraph 1 most nearly means:',
      options: {
        A: "a physical door",
        B: "an entry point or essential first step",
        C: "a type of university scholarship",
        D: "a failing grade",
      },
      correct: "B",
      explanation:
        "Gateway skill means a skill that opens access to further opportunities.",
    },
    {
      id: "fb-r1-q3",
      section: "reading",
      questionType: "detail",
      stem: "According to the passage, which of the following is true?",
      options: {
        A: "Reading is worth forty percent of the STEP score",
        B: "STEP includes a mandatory speaking interview",
        C: "Students should avoid timed practice",
        D: "Compositional analysis is the largest section",
      },
      correct: "A",
      explanation: "Paragraph 2 states reading represents forty percent of the total score.",
    },
    {
      id: "fb-r1-q4",
      section: "reading",
      questionType: "inference",
      stem: "It can be inferred from the passage that students who only take full mocks without reviewing errors:",
      options: {
        A: "always score above 90",
        B: "may improve more slowly than reflective learners",
        C: "are not allowed to take STEP",
        D: "perform best on the listening section",
      },
      correct: "B",
      explanation:
        "Paragraph 3 says reviewing mistakes leads to faster improvement than mocks alone.",
    },
    {
      id: "fb-r1-q5",
      section: "reading",
      questionType: "authors_purpose",
      stem: "Why does the author mention single-play listening practice?",
      options: {
        A: "To warn that STEP listening audio plays only once",
        B: "To recommend using a dictionary during listening",
        C: "To explain how to cancel a test registration",
        D: "To describe a new section added in 2026",
      },
      correct: "A",
      explanation:
        "The final paragraph links single-play listening to simulating real exam conditions.",
    },
    {
      id: "fb-r1-q6",
      section: "reading",
      questionType: "detail",
      stem: "Which cities are named as having coaching centers?",
      options: {
        A: "Riyadh, Jeddah, and Dammam",
        B: "Mecca, Medina, and Tabuk",
        C: "Dubai, Abu Dhabi, and Manama",
        D: "Cairo, Amman, and Beirut",
      },
      correct: "A",
      explanation: "Paragraph 3 explicitly lists Riyadh, Jeddah, and Dammam.",
    },
    {
      id: "fb-r1-q7",
      section: "reading",
      questionType: "inference",
      stem: "It can be inferred that vocabulary-in-context questions often test words that:",
      options: {
        A: "appear only in Arabic",
        B: "change meaning depending on the passage",
        C: "are always technical scientific terms",
        D: "never appear in paragraph 2",
      },
      correct: "B",
      explanation:
        "Paragraph 2 says such items test words with everyday meanings but specialized passage senses.",
    },
    {
      id: "fb-r1-q8",
      section: "reading",
      questionType: "authors_purpose",
      stem: "Why does the author mention that STEP has no speaking or essay section?",
      options: {
        A: "To criticize the exam format",
        B: "To reduce test-day anxiety by clarifying the format",
        C: "To prove the exam is easy",
        D: "To encourage students to skip preparation",
      },
      correct: "B",
      explanation:
        "This appears in a paragraph about anxiety and what to expect on test day.",
    },
  ],
};

const READING_PASSAGE_2: StepReadingPassage = {
  id: "fb-r2",
  paragraphs: [
    {
      number: 1,
      text: "Renewable energy projects are transforming rural communities in the Gulf region. Solar farms that once seemed experimental now supply electricity to schools and hospitals in remote areas. Engineers note that maintenance costs have fallen sharply over the past decade, making large-scale deployment economically viable. Governments have set ambitious targets to diversify energy sources away from oil dependence while creating technical jobs for young graduates.",
    },
    {
      number: 2,
      text: "Local training programs teach technicians how to install panels, monitor inverters, and troubleshoot grid connections. Participants often combine classroom instruction with apprenticeships at active project sites. Employers value candidates who can read technical manuals in English and communicate safety procedures clearly to mixed-language teams. For many graduates, these skills bridge the gap between vocational certificates and university engineering degrees.",
    },
    {
      number: 3,
      text: "Environmental groups praise the reduction in carbon emissions, though they urge faster adoption of battery storage to handle peak demand. Critics point out that manufacturing solar equipment still relies on global supply chains. Nevertheless, community leaders report improved quality of life when reliable power replaces diesel generators that were noisy, expensive, and polluting.",
    },
  ],
  questions: [
    {
      id: "fb-r2-q1",
      section: "reading",
      questionType: "main_idea",
      stem: "What is the main topic of the passage?",
      options: {
        A: "How diesel generators are manufactured",
        B: "The impact of renewable energy on Gulf communities and workers",
        C: "Why oil prices fluctuate globally",
        D: "University admission requirements in engineering",
      },
      correct: "B",
      explanation: "The passage focuses on solar projects, jobs, and community benefits.",
    },
    {
      id: "fb-r2-q2",
      section: "reading",
      questionType: "detail",
      stem: "According to the passage, maintenance costs for solar farms have:",
      options: {
        A: "increased every year",
        B: "fallen sharply over the past decade",
        C: "remained exactly the same",
        D: "made projects impossible to fund",
      },
      correct: "B",
      explanation: "Paragraph 1 states maintenance costs have fallen sharply.",
    },
    {
      id: "fb-r2-q3",
      section: "reading",
      questionType: "vocabulary_in_context",
      stem: 'The phrase "bridge the gap" in paragraph 2 most nearly means:',
      options: {
        A: "build a physical bridge",
        B: "connect two different levels or paths",
        C: "cancel a job offer",
        D: "reduce solar panel efficiency",
      },
      correct: "B",
      explanation: "Bridge the gap means connect vocational training with degree-level paths.",
    },
    {
      id: "fb-r2-q4",
      section: "reading",
      questionType: "inference",
      stem: "It can be inferred that environmental groups believe:",
      options: {
        A: "battery storage should expand more quickly",
        B: "solar power should be abandoned",
        C: "diesel is cleaner than solar",
        D: "training programs are unnecessary",
      },
      correct: "A",
      explanation: "They urge faster adoption of battery storage for peak demand.",
    },
    {
      id: "fb-r2-q5",
      section: "reading",
      questionType: "authors_purpose",
      stem: "Why does the author mention diesel generators?",
      options: {
        A: "To contrast older power sources with cleaner solar supply",
        B: "To explain STEP registration fees",
        C: "To describe a new government tax",
        D: "To argue against all forms of electricity",
      },
      correct: "A",
      explanation: "Diesel generators are described as noisy and polluting compared to solar.",
    },
    {
      id: "fb-r2-q6",
      section: "reading",
      questionType: "detail",
      stem: "Training programs combine classroom work with:",
      options: {
        A: "apprenticeships at project sites",
        B: "full-time university study only",
        C: "unpaid vacations",
        D: "speaking tests in Arabic",
      },
      correct: "A",
      explanation: "Paragraph 2 mentions apprenticeships at active project sites.",
    },
  ],
};

export const FALLBACK_READING_PASSAGES: StepReadingPassage[] = [
  READING_PASSAGE_1,
  READING_PASSAGE_2,
];

export const FALLBACK_STRUCTURE_ITEMS: StepStructureItem[] = [
  {
    id: "fb-s1",
    section: "structure",
    questionType: "subject_verb_agreement",
    grammarPoint: "Subject-verb agreement",
    stem: "The group of students from the engineering faculty _______ working on the solar project.",
    options: { A: "is", B: "are", C: "were", D: "have been" },
    correct: "A",
    explanation: "With 'group of,' the verb agrees with 'group' (singular): is.",
  },
  {
    id: "fb-s2",
    section: "structure",
    questionType: "tense_selection",
    grammarPoint: "Past perfect",
    stem: "By the time he arrived at the lecture hall, she _______ already.",
    options: { A: "left", B: "has left", C: "had left", D: "was leaving" },
    correct: "C",
    explanation: "Past perfect shows an action completed before another past action.",
  },
  {
    id: "fb-s3",
    section: "structure",
    questionType: "prepositions",
    grammarPoint: "Prepositions",
    stem: "She is interested _______ learning more about renewable energy.",
    options: { A: "on", B: "in", C: "at", D: "for" },
    correct: "B",
    explanation: "The collocation is 'interested in.'",
  },
  {
    id: "fb-s4",
    section: "structure",
    questionType: "modals",
    grammarPoint: "Modal verbs",
    stem: "You _______ submit your STEP registration form by Friday to secure your seat.",
    options: { A: "might", B: "would", C: "must", D: "could" },
    correct: "C",
    explanation: "Must expresses a strong requirement or obligation.",
  },
  {
    id: "fb-s5",
    section: "structure",
    questionType: "articles",
    grammarPoint: "Articles",
    stem: "He is _______ engineer at a company in Riyadh.",
    options: { A: "a", B: "an", C: "the", D: "—" },
    correct: "B",
    explanation: "Use 'an' before vowel sounds: an engineer.",
  },
  {
    id: "fb-s6",
    section: "structure",
    questionType: "conditional",
    grammarPoint: "Second conditional",
    stem: "If she _______ harder last month, she would pass the mock exam today.",
    options: { A: "studies", B: "studied", C: "had studied", D: "will study" },
    correct: "C",
    explanation: "Third conditional: If + past perfect, would + base verb.",
  },
  {
    id: "fb-s7",
    section: "structure",
    questionType: "relative_clauses",
    grammarPoint: "Relative clauses",
    stem: "The professor _______ called yesterday will visit the campus next week.",
    options: { A: "which", B: "who", C: "whose", D: "whom" },
    correct: "B",
    explanation: "Who refers to people (the professor).",
  },
  {
    id: "fb-s8",
    section: "structure",
    questionType: "parallel_structure",
    grammarPoint: "Parallel structure",
    stem: "She likes reading, writing, and _______ in the library after class.",
    options: { A: "to swim", B: "swim", C: "swimming", D: "swam" },
    correct: "C",
    explanation: "Parallel gerunds: reading, writing, swimming.",
  },
  {
    id: "fb-s9",
    section: "structure",
    questionType: "subject_verb_agreement",
    grammarPoint: "Subject-verb agreement",
    stem: "Neither the manager nor the employees _______ satisfied with the schedule.",
    options: { A: "was", B: "is", C: "are", D: "has been" },
    correct: "C",
    explanation: "With neither...nor, the verb agrees with the nearer subject (employees → are).",
  },
  {
    id: "fb-s10",
    section: "structure",
    questionType: "modals",
    grammarPoint: "Modal verbs",
    stem: "You _______ see a doctor if your fever continues, but it is not urgent.",
    options: { A: "must", B: "should", C: "might", D: "will" },
    correct: "B",
    explanation: "Should gives advice without absolute obligation.",
  },
  {
    id: "fb-s11",
    section: "structure",
    questionType: "tense_selection",
    grammarPoint: "Present perfect",
    stem: "They _______ in Jeddah since 2019.",
    options: { A: "live", B: "lived", C: "have lived", D: "are living" },
    correct: "C",
    explanation: "Since + point in time → present perfect.",
  },
  {
    id: "fb-s12",
    section: "structure",
    questionType: "prepositions",
    grammarPoint: "Prepositions",
    stem: "The meeting is scheduled _______ 3:00 p.m. on Thursday.",
    options: { A: "in", B: "on", C: "at", D: "by" },
    correct: "C",
    explanation: "Use 'at' with specific clock times.",
  },
];

export const FALLBACK_LISTENING_RECORDINGS: StepListeningRecording[] = [
  {
    id: "fb-l1",
    recordingNumber: 1,
    setting: "University office — meeting reschedule",
    speakers: ["Student", "Administrator"],
    transcript: `Administrator: Good morning. Student Services, how may I help you?
Student: Hi, I need to reschedule my STEP information session. I had it booked for Tuesday at ten o'clock.
Administrator: Certainly. Let me pull up your file. Ah yes, I see it here. Tuesday at ten is no longer available because the room is under maintenance.
Student: Oh, I see. What other times do you have this week?
Administrator: We have Wednesday at two p.m., Thursday at nine a.m., or Friday at eleven thirty.
Student: Wednesday at two works best. How many people usually attend these sessions?
Administrator: Usually about twenty-five students attend, but last month thirty-two came because registration opened early.
Student: Great. And will I receive a confirmation email?
Administrator: Yes, within one hour. The session lasts forty-five minutes and covers registration steps and test-day rules.
Student: Perfect. One more thing — I heard the listening section plays only once. Is that true?
Administrator: Yes, just like the real STEP exam. We recommend practicing with single-play audio at home.
Student: Thank you. I was feeling a bit under the weather yesterday, so I appreciate your help today.
Administrator: You're welcome. Feel free to call if you need anything else.`,
    questions: [
      {
        id: "fb-l1-q1",
        section: "listening",
        questionType: "detail",
        stem: "What time did the student originally book the session?",
        options: {
          A: "Tuesday at 9:00 a.m.",
          B: "Tuesday at 10:00 a.m.",
          C: "Wednesday at 2:00 p.m.",
          D: "Friday at 11:30 a.m.",
        },
        correct: "B",
        explanation: "The student says the booking was for Tuesday at ten o'clock.",
      },
      {
        id: "fb-l1-q2",
        section: "listening",
        questionType: "numbers",
        stem: "How many students attended last month's session?",
        options: { A: "20", B: "25", C: "30", D: "32" },
        correct: "D",
        explanation: "The administrator says thirty-two students came last month.",
      },
      {
        id: "fb-l1-q3",
        section: "listening",
        questionType: "detail",
        stem: "How long does the information session last?",
        options: {
          A: "30 minutes",
          B: "45 minutes",
          C: "60 minutes",
          D: "90 minutes",
        },
        correct: "B",
        explanation: "The session lasts forty-five minutes.",
      },
      {
        id: "fb-l1-q4",
        section: "listening",
        questionType: "inference",
        stem: "What can be inferred about the Tuesday session?",
        options: {
          A: "It was cancelled because of room maintenance",
          B: "It had too many students",
          C: "It was moved to another city",
          D: "It did not cover listening rules",
        },
        correct: "A",
        explanation: "Tuesday at ten is unavailable because the room is under maintenance.",
      },
      {
        id: "fb-l1-q5",
        section: "listening",
        questionType: "attitude",
        stem: "How does the student feel about the listening section rule?",
        options: {
          A: "Indifferent — they did not mention it",
          B: "Concerned enough to ask for confirmation",
          C: "Angry about the policy",
          D: "Confused about reading section timing",
        },
        correct: "B",
        explanation: "The student asks specifically to confirm the single-play rule.",
      },
      {
        id: "fb-l1-q6",
        section: "listening",
        questionType: "idiom",
        stem: "What does the student mean by 'under the weather'?",
        options: {
          A: "Standing outside in the rain",
          B: "Feeling unwell or sick",
          C: "Checking the weather forecast",
          D: "Arriving late to the office",
        },
        correct: "B",
        explanation: "Under the weather is an idiom meaning feeling sick.",
      },
    ],
  },
  {
    id: "fb-l2",
    recordingNumber: 2,
    setting: "Car service centre",
    speakers: ["Customer", "Agent"],
    transcript: `Agent: Welcome to Gulf Auto Service. How can I help you today?
Customer: I'd like to book a full inspection. My odometer shows forty-eight thousand kilometers.
Agent: We can schedule you for Saturday morning. The standard package takes about two hours and costs eight hundred riyals.
Customer: Does that include an oil change?
Agent: Yes, plus brake fluid check and tire rotation. If we find anything beyond that, we'll call before proceeding.
Customer: Please call if the total exceeds two thousand riyals. I need to keep costs manageable this month.
Agent: Understood. By the way, you seem quite tall for a compact sedan. Are you comfortable in that model long-term?
Customer: It's fine for city driving, but long trips are tiring. Maybe I'll upgrade next year.
Agent: We also have a promotion: fifteen percent off your next visit if you refer a friend this month.
Customer: Good to know. Let's confirm Saturday at nine a.m.`,
    questions: [
      {
        id: "fb-l2-q1",
        section: "listening",
        questionType: "numbers",
        stem: "How many kilometers does the customer's car show?",
        options: {
          A: "38,000",
          B: "40,000",
          C: "48,000",
          D: "52,000",
        },
        correct: "C",
        explanation: "The customer says forty-eight thousand kilometers.",
      },
      {
        id: "fb-l2-q2",
        section: "listening",
        questionType: "detail",
        stem: "What time is the appointment?",
        options: {
          A: "Saturday at 8:00 a.m.",
          B: "Saturday at 9:00 a.m.",
          C: "Sunday at 9:00 a.m.",
          D: "Friday at 2:00 p.m.",
        },
        correct: "B",
        explanation: "They confirm Saturday at nine a.m.",
      },
      {
        id: "fb-l2-q3",
        section: "listening",
        questionType: "numbers",
        stem: "Above what amount will the agent call the customer?",
        options: {
          A: "SR 800",
          B: "SR 1,500",
          C: "SR 2,000",
          D: "SR 2,500",
        },
        correct: "C",
        explanation: "Call if the total exceeds two thousand riyals.",
      },
      {
        id: "fb-l2-q4",
        section: "listening",
        questionType: "inference",
        stem: "What can be inferred about the customer?",
        options: {
          A: "They want to avoid unexpected high charges",
          B: "They plan to sell the car immediately",
          C: "They refused all services",
          D: "They cannot drive in the city",
        },
        correct: "A",
        explanation: "They ask to be called before costs exceed two thousand riyals.",
      },
      {
        id: "fb-l2-q5",
        section: "listening",
        questionType: "detail",
        stem: "What discount promotion is mentioned?",
        options: {
          A: "10% off tires",
          B: "15% off the next visit with a referral",
          C: "Free oil change forever",
          D: "50% off on Sundays",
        },
        correct: "B",
        explanation: "Fifteen percent off the next visit if you refer a friend.",
      },
    ],
  },
];

export const FALLBACK_COMPOSITIONAL_ITEMS: StepCompositionalItem[] = [
  {
    id: "fb-c1",
    section: "compositional_analysis",
    questionType: "punctuation_accuracy",
    stem: "Choose the correctly punctuated sentence:",
    options: {
      A: "The student who studied hard passed the exam.",
      B: "The student, who studied hard, passed the exam.",
      C: "The student who studied hard, passed the exam.",
      D: "The student who studied hard passed, the exam.",
    },
    correct: "A",
    explanation:
      "Essential (restrictive) clauses do not use commas around 'who studied hard.'",
    tags: ["punctuation", "restrictive clause"],
  },
  {
    id: "fb-c2",
    section: "compositional_analysis",
    questionType: "correct_word_order",
    stem: "Choose the sentence with correct word order:",
    options: {
      A: "Never I have seen such a beautiful city.",
      B: "I have never seen such a beautiful city.",
      C: "Such a beautiful city I have never seen it.",
      D: "I never have seen such a beautiful city.",
    },
    correct: "B",
    explanation: "Standard order: subject + auxiliary + adverb + verb.",
    tags: ["word order"],
  },
  {
    id: "fb-c3",
    section: "compositional_analysis",
    questionType: "sentence_combining",
    stem: `Which option best combines these two sentences?
"She studied hard. She passed the exam."`,
    options: {
      A: "She studied hard, but she passed the exam.",
      B: "She studied hard, so she passed the exam.",
      C: "She studied hard although she passed the exam.",
      D: "She studied hard because she passed the exam.",
    },
    correct: "B",
    explanation: "So shows result: studying hard led to passing.",
    tags: ["sentence combining"],
  },
  {
    id: "fb-c4",
    section: "compositional_analysis",
    questionType: "identify_incorrect_underlined",
    stem: `Choose the underlined part that contains an error:
"The data (A) shows that (B) most of the students (C) has improved (D) their scores."`,
    options: { A: "shows", B: "that", C: "has improved", D: "their" },
    correct: "C",
    explanation:
      'Should be "have improved" — "most of the students" is plural.',
    tags: ["error identification", "subject-verb agreement"],
  },
  {
    id: "fb-c5",
    section: "compositional_analysis",
    questionType: "punctuation_accuracy",
    stem: "Choose the correctly punctuated sentence:",
    options: {
      A: "After the lecture the students discussed the main ideas.",
      B: "After the lecture, the students discussed the main ideas.",
      C: "After, the lecture the students discussed the main ideas.",
      D: "After the lecture the students, discussed the main ideas.",
    },
    correct: "B",
    explanation: "Introductory phrase needs a comma before the main clause.",
    tags: ["punctuation"],
  },
  {
    id: "fb-c6",
    section: "compositional_analysis",
    questionType: "sentence_combining",
    stem: `Which option best combines the ideas?
"The weather was bad. The flight was delayed."`,
    options: {
      A: "The weather was bad, so the flight was delayed.",
      B: "The weather was bad, but the flight was delayed.",
      C: "The weather was bad, or the flight was delayed.",
      D: "The weather was bad, yet the flight was on time.",
    },
    correct: "A",
    explanation: "So links cause (bad weather) to effect (delay).",
    tags: ["sentence combining"],
  },
  {
    id: "fb-c7",
    section: "compositional_analysis",
    questionType: "identify_incorrect_underlined",
    stem: `Choose the underlined part that contains an error:
"Each of the candidates (A) were asked (B) to bring (C) two forms of ID (D)."`,
    options: { A: "Each", B: "were asked", C: "to bring", D: "of ID" },
    correct: "B",
    explanation: '"Each" is singular → "was asked."',
    tags: ["error identification"],
  },
  {
    id: "fb-c8",
    section: "compositional_analysis",
    questionType: "correct_word_order",
    stem: "Choose the sentence with correct word order:",
    options: {
      A: "Only in Riyadh I have worked.",
      B: "I have worked only in Riyadh.",
      C: "In Riyadh only have I worked.",
      D: "Worked I have only in Riyadh.",
    },
    correct: "B",
    explanation: "Natural adverb placement: auxiliary + adverb + prepositional phrase.",
    tags: ["word order"],
  },
  {
    id: "fb-c9",
    section: "compositional_analysis",
    questionType: "punctuation_accuracy",
    stem: "Choose the correctly punctuated sentence:",
    options: {
      A: "However the results were encouraging.",
      B: "However, the results were encouraging.",
      C: "However the results, were encouraging.",
      D: "However the, results were encouraging.",
    },
    correct: "B",
    explanation: "However at the start of a sentence is followed by a comma.",
    tags: ["punctuation"],
  },
  {
    id: "fb-c10",
    section: "compositional_analysis",
    questionType: "sentence_combining",
    stem: `Which option best combines the sentences?
"He missed the bus. He arrived late to class."`,
    options: {
      A: "He missed the bus, so he arrived late to class.",
      B: "He missed the bus, although he arrived late to class.",
      C: "He missed the bus, unless he arrived late to class.",
      D: "He missed the bus, before he arrived late to class.",
    },
    correct: "A",
    explanation: "Missing the bus caused arriving late.",
    tags: ["sentence combining"],
  },
];

/** Saudi-specific tips keyed by question type / grammar point */
export const SAUDI_TIPS: Record<string, string> = {
  subject_verb_agreement:
    "Arabic does not always mark singular/plural on verbs — double-check the true subject in English.",
  articles:
    "Arabic has no articles equivalent to a/an/the — choose based on whether the noun is specific or first mention.",
  prepositions:
    "Prepositions rarely translate directly from Arabic; learn common collocations (interested in, good at).",
  correct_word_order:
    "Arabic allows flexible word order; English requires subject before verb in statements.",
  punctuation_accuracy:
    "Arabic punctuation rules differ — introductory clauses in English usually need a comma.",
  identify_incorrect_underlined:
    "Watch agreement with quantifiers like 'most of' and 'each of' — a common STEP trap.",
  sentence_combining:
    "Choose connectors by logic (cause, contrast, result), not by memorizing single Arabic equivalents.",
};

export function getFallbackReadingPassage(index = 0): StepReadingPassage {
  return FALLBACK_READING_PASSAGES[index % FALLBACK_READING_PASSAGES.length];
}

export function getFallbackStructureBatch(count = 10): StepStructureItem[] {
  const items = [...FALLBACK_STRUCTURE_ITEMS];
  for (let i = 0; i < items.length; i++) {
    items[i] = { ...items[i], id: `${items[i].id}-${i}` };
  }
  return items.slice(0, count);
}

export function getFallbackListeningRecording(index = 0): StepListeningRecording {
  return FALLBACK_LISTENING_RECORDINGS[
    index % FALLBACK_LISTENING_RECORDINGS.length
  ];
}

export function getFallbackCompositionalBatch(count = 5): StepCompositionalItem[] {
  return FALLBACK_COMPOSITIONAL_ITEMS.slice(0, count);
}
