export type GtReadingSectionKey = "A" | "B" | "C";

export type GtReadingQuestionType =
  | "true_false_not_given"
  | "short_answer"
  | "sentence_completion"
  | "matching"
  | "matching_headings"
  | "multiple_choice"
  | "summary_completion"
  | "matching_features";

export type GtReadingQuestion = {
  id: string;
  number: number;
  type: GtReadingQuestionType;
  question: string;
  answer: string;
  explanation: string;
  options?: string[];
};

export type GtReadingPassage = {
  id: string;
  section: GtReadingSectionKey;
  title: string;
  text: string;
  questions: GtReadingQuestion[];
  saudiContext?: boolean;
};

export const GT_READING_SECTIONS = {
  sectionA: {
    label: "Section A",
    description: "Everyday short texts — notices, advertisements, timetables",
    questionRange: "Questions 1–14",
    timeTarget: "18 minutes",
    difficulty: "easiest",
    textTypes: [
      "hotel or restaurant advertisements",
      "public transport timetables",
      "workplace notices and signs",
      "product labels and instructions",
      "event announcements",
      "library or gym membership information",
      "job vacancy advertisements",
      "supermarket or shop promotions",
    ],
    questionTypes: [
      "matching",
      "true_false_not_given",
      "short_answer",
      "sentence_completion",
    ],
    vocabulary: "everyday — B1 level",
    saudiContext: [
      "Saudi Vision 2030 promotional notices",
      "Riyadh Metro timetables",
      "Saudi Aramco workplace safety notices",
      "Hajj and Umrah travel information",
      "Saudi supermarket promotions",
      "University of Riyadh event announcements",
    ],
  },
  sectionB: {
    label: "Section B",
    description: "Work-related texts — job descriptions, contracts, training materials",
    questionRange: "Questions 15–27",
    timeTarget: "22 minutes",
    difficulty: "intermediate",
    textTypes: [
      "job descriptions and person specifications",
      "employment contracts and terms",
      "workplace health and safety documents",
      "staff training manuals",
      "company policy documents",
      "professional development materials",
      "workplace communication guidelines",
    ],
    questionTypes: [
      "matching_headings",
      "multiple_choice",
      "summary_completion",
      "sentence_completion",
    ],
    vocabulary: "professional and workplace — B2 level",
    saudiContext: [
      "Saudi government ministry job descriptions",
      "Oil and gas industry contracts",
      "Hospital staff training manuals",
      "Vision 2030 project workplace policies",
      "Banking and finance employment terms",
    ],
  },
  sectionC: {
    label: "Section C",
    description: "General interest text — longer article or essay",
    questionRange: "Questions 28–40",
    timeTarget: "20 minutes",
    difficulty: "most challenging",
    textTypes: [
      "general interest magazine articles",
      "opinion pieces on social topics",
      "historical or cultural essays",
      "science for general audience",
      "technology and society articles",
      "environment and lifestyle pieces",
    ],
    questionTypes: [
      "matching_features",
      "multiple_choice",
      "short_answer",
      "summary_completion",
    ],
    vocabulary: "general academic — B2 level",
    saudiContext: [
      "Saudi heritage and culture articles",
      "Middle East technology development",
      "Gulf region environmental topics",
      "Arabic culture and global influence",
      "Saudi youth and modern society",
    ],
  },
} as const;

export const SAMPLE_GT_PASSAGES = {
  sectionA_sample: {
    id: "gt_a_001",
    section: "A" as const,
    title: "Riyadh Public Library — Membership Information",
    text: `RIYADH PUBLIC LIBRARY

MEMBERSHIP INFORMATION

Who can join?
The library is open to all residents of Riyadh aged 16 and above. Children under 16 must be accompanied by a parent or guardian who holds a valid library membership.

How to register
Bring your national ID or resident permit (Iqama) to the main desk on the ground floor. Registration takes approximately 15 minutes. There is no registration fee for standard membership.

Borrowing rules
Standard members may borrow up to 5 items at one time. Items may be kept for 21 days and renewed once by visiting the library or calling 800-LIBRARY. A fine of 0.50 SAR per day applies to overdue items.

Opening hours
The library is open Saturday to Thursday from 9:00 AM to 9:00 PM. On Fridays, the library opens at 2:00 PM and closes at 8:00 PM. The library is closed on public holidays.

Special services
A quiet study room is available on the second floor for members only. Bookings can be made at the main desk up to 3 days in advance. Maximum booking is 2 hours per session per member.`,
    questions: [
      {
        id: "gt_a_001_q1",
        number: 1,
        type: "true_false_not_given" as const,
        question: "Children under 16 are not permitted to enter the library.",
        answer: "FALSE",
        explanation:
          "Children under 16 can enter but must be with a parent or guardian who holds membership.",
      },
      {
        id: "gt_a_001_q2",
        number: 2,
        type: "true_false_not_given" as const,
        question: "There is a charge for registering as a standard member.",
        answer: "FALSE",
        explanation: "The text states there is no registration fee for standard membership.",
      },
      {
        id: "gt_a_001_q3",
        number: 3,
        type: "short_answer" as const,
        question: "How many items can a standard member borrow at one time?",
        answer: "5",
        explanation: "Standard members may borrow up to 5 items at one time.",
      },
      {
        id: "gt_a_001_q4",
        number: 4,
        type: "short_answer" as const,
        question: "What is the fine for each day an item is overdue?",
        answer: "0.50 SAR",
        explanation: "A fine of 0.50 SAR per day applies to overdue items.",
      },
      {
        id: "gt_a_001_q5",
        number: 5,
        type: "true_false_not_given" as const,
        question: "The quiet study room can be booked up to a week in advance.",
        answer: "FALSE",
        explanation: "Bookings can only be made up to 3 days in advance.",
      },
    ],
    saudiContext: true,
  },
};

const GT_PASSAGE_BANK: GtReadingPassage[] = [
  SAMPLE_GT_PASSAGES.sectionA_sample,
  {
    id: "gt_a_002",
    section: "A",
    title: "Riyadh Metro — Blue Line Weekend Service",
    text: `RIYADH METRO — BLUE LINE
WEEKEND SERVICE UPDATE

From 1 March, Blue Line trains will run every 8 minutes between King Abdullah Financial District and Olaya from 6:00 AM until midnight on Fridays and Saturdays.

Single-journey tickets cost 4 SAR and can be purchased at station machines or through the Riyadh Metro app. Children under 6 travel free when accompanied by a fare-paying adult.

Park-and-ride facilities at Qiddiya station remain open until 11:30 PM. Vehicles left after closing will be towed at the owner's expense.

Passengers carrying large suitcases must use the designated luggage carriage at the rear of each train. Bicycles are not permitted on weekends.

For travel to King Khalid International Airport, passengers should change to the Yellow Line at King Abdullah Station. The airport shuttle bus from Metro stations is no longer operating.`,
    saudiContext: true,
    questions: [
      {
        id: "gt_a_002_q1",
        number: 1,
        type: "true_false_not_given",
        question: "Blue Line weekend trains run until midnight.",
        answer: "TRUE",
        explanation: "The notice says trains run until midnight on Fridays and Saturdays.",
      },
      {
        id: "gt_a_002_q2",
        number: 2,
        type: "short_answer",
        question: "How much does a single-journey ticket cost?",
        answer: "4 SAR",
        explanation: "Single-journey tickets cost 4 SAR.",
      },
      {
        id: "gt_a_002_q3",
        number: 3,
        type: "true_false_not_given",
        question: "Bicycles may be taken on trains at weekends.",
        answer: "FALSE",
        explanation: "Bicycles are not permitted on weekends.",
      },
      {
        id: "gt_a_002_q4",
        number: 4,
        type: "short_answer",
        question: "Which line should passengers use for the airport?",
        answer: "Yellow Line",
        explanation:
          "Passengers should change to the Yellow Line at King Abdullah Station for the airport.",
      },
      {
        id: "gt_a_002_q5",
        number: 5,
        type: "true_false_not_given",
        question: "The airport shuttle bus from Metro stations is still operating.",
        answer: "FALSE",
        explanation: "The airport shuttle bus from Metro stations is no longer operating.",
      },
    ],
  },
  {
    id: "gt_a_003",
    section: "A",
    title: "Al Noor Supermarket — Ramadan Promotion",
    text: `AL NOOR SUPERMARKET — RAMADAN PROMOTION
Valid: 10–30 Ramadan | All Riyadh branches

Buy any two family-size dates packages and receive a 20% discount on a third item of equal or lower value. Loyalty card holders receive an additional 5% off the total bill on purchases over 200 SAR.

Free home delivery is available for orders placed through the Al Noor app before 4:00 PM on the same day. A minimum order of 150 SAR applies.

The bakery section will open one hour before the main store on weekdays during Ramadan. Hot meals from the deli counter are not available for delivery.

Returns on promotional items are accepted within 48 hours with a receipt. Gift vouchers cannot be used together with this promotion.`,
    saudiContext: true,
    questions: [
      {
        id: "gt_a_003_q1",
        number: 1,
        type: "true_false_not_given",
        question: "Loyalty card holders always receive 5% off every purchase.",
        answer: "FALSE",
        explanation: "The extra 5% applies only on purchases over 200 SAR.",
      },
      {
        id: "gt_a_003_q2",
        number: 2,
        type: "short_answer",
        question: "What is the minimum order value for free same-day delivery?",
        answer: "150 SAR",
        explanation: "A minimum order of 150 SAR applies for free delivery.",
      },
      {
        id: "gt_a_003_q3",
        number: 3,
        type: "sentence_completion",
        question: "The bakery opens one hour before the main store on ______ during Ramadan.",
        answer: "weekdays",
        explanation: "The bakery opens one hour before the main store on weekdays.",
      },
      {
        id: "gt_a_003_q4",
        number: 4,
        type: "true_false_not_given",
        question: "Hot deli meals can be delivered to your home.",
        answer: "FALSE",
        explanation: "Hot meals from the deli counter are not available for delivery.",
      },
      {
        id: "gt_a_003_q5",
        number: 5,
        type: "short_answer",
        question: "How long are returns on promotional items accepted?",
        answer: "48 hours",
        explanation: "Returns are accepted within 48 hours with a receipt.",
      },
    ],
  },
  {
    id: "gt_b_001",
    section: "B",
    title: "Ministry of Human Resources — Administrative Assistant Vacancy",
    text: `MINISTRY OF HUMAN RESOURCES AND SOCIAL DEVELOPMENT
VACANCY: ADMINISTRATIVE ASSISTANT (Grade 6)

Location: Riyadh — headquarters, Government District
Contract: Permanent, subject to six-month probation

Main responsibilities
• Prepare correspondence in Arabic and English for senior officials
• Maintain confidential personnel files and update the internal records system daily
• Coordinate meeting schedules and arrange travel for department directors
• Process incoming enquiries from the public within two working days

Person specification
Candidates must hold a bachelor's degree in business administration or a related field. At least two years of experience in a government or large corporate office is required. Proficiency in Microsoft Office and the government's Etimad platform is essential.

Salary and benefits
Monthly salary band: 9,500–11,200 SAR plus transport allowance. Annual leave is 30 days. Medical insurance is provided for the employee and up to two dependents.

Application process
Submit CV and national ID copy through the ministry careers portal by 15 April. Shortlisted candidates will complete a written Arabic test and an interview. Start date is expected in June.`,
    saudiContext: true,
    questions: [
      {
        id: "gt_b_001_q1",
        number: 1,
        type: "multiple_choice",
        question: "What is the probation period for this role?",
        options: ["Three months", "Six months", "One year", "None"],
        answer: "Six months",
        explanation: "The contract is subject to six-month probation.",
      },
      {
        id: "gt_b_001_q2",
        number: 2,
        type: "true_false_not_given",
        question: "Applicants need a master's degree.",
        answer: "FALSE",
        explanation: "A bachelor's degree is required, not a master's.",
      },
      {
        id: "gt_b_001_q3",
        number: 3,
        type: "short_answer",
        question: "How quickly must public enquiries be processed?",
        answer: "two working days",
        explanation: "Enquiries must be processed within two working days.",
      },
      {
        id: "gt_b_001_q4",
        number: 4,
        type: "sentence_completion",
        question: "Candidates must be proficient in Microsoft Office and the ______ platform.",
        answer: "Etimad",
        explanation: "Proficiency in the Etimad platform is essential.",
      },
      {
        id: "gt_b_001_q5",
        number: 5,
        type: "multiple_choice",
        question: "When is the application deadline?",
        options: ["15 March", "15 April", "15 May", "15 June"],
        answer: "15 April",
        explanation: "Applications must be submitted by 15 April.",
      },
      {
        id: "gt_b_001_q6",
        number: 6,
        type: "short_answer",
        question: "How many days of annual leave are offered?",
        answer: "30",
        explanation: "Annual leave is 30 days.",
      },
      {
        id: "gt_b_001_q7",
        number: 7,
        type: "true_false_not_given",
        question: "Medical insurance covers the employee only.",
        answer: "FALSE",
        explanation: "Insurance covers the employee and up to two dependents.",
      },
    ],
  },
  {
    id: "gt_b_002",
    section: "B",
    title: "Saudi Aramco — Contractor Site Safety Briefing",
    text: `SAUDI ARAMCO — CONTRACTOR SITE SAFETY BRIEFING
All personnel must read before entering Zone C

Personal protective equipment
Hard hats, safety boots, and high-visibility vests are mandatory at all times. Gloves and eye protection are required in the maintenance yard. Failure to wear PPE will result in immediate removal from site.

Reporting incidents
All injuries, near misses, and equipment faults must be reported to the site supervisor within one hour. Use form HS-14 available at security checkpoints. Do not restart machinery until clearance is given.

Restricted areas
Zone C laboratories may be entered only with an authorised access card and a valid hot-work permit. Photography is prohibited throughout the facility.

Emergency procedures
When the alarm sounds, proceed to Assembly Point 3 north of the admin block. Do not use the main vehicle gate during evacuation. First-aid officers wear orange armbands.

Working hours
Standard shifts are 07:00–15:00 or 15:00–23:00. Overtime requires written approval from the project manager at least 24 hours in advance.`,
    saudiContext: true,
    questions: [
      {
        id: "gt_b_002_q1",
        number: 1,
        type: "true_false_not_given",
        question: "Gloves are required everywhere on site.",
        answer: "FALSE",
        explanation: "Gloves are required in the maintenance yard, not everywhere.",
      },
      {
        id: "gt_b_002_q2",
        number: 2,
        type: "short_answer",
        question: "Which form is used to report incidents?",
        answer: "HS-14",
        explanation: "Incidents are reported using form HS-14.",
      },
      {
        id: "gt_b_002_q3",
        number: 3,
        type: "multiple_choice",
        question: "Where should staff assemble during an evacuation?",
        options: [
          "Assembly Point 1",
          "Assembly Point 2",
          "Assembly Point 3",
          "The main vehicle gate",
        ],
        answer: "Assembly Point 3",
        explanation: "Staff proceed to Assembly Point 3 north of the admin block.",
      },
      {
        id: "gt_b_002_q4",
        number: 4,
        type: "sentence_completion",
        question: "Overtime requires written approval at least ______ hours in advance.",
        answer: "24",
        explanation: "Overtime needs approval 24 hours in advance.",
      },
      {
        id: "gt_b_002_q5",
        number: 5,
        type: "true_false_not_given",
        question: "Photography is allowed in some parts of the facility.",
        answer: "FALSE",
        explanation: "Photography is prohibited throughout the facility.",
      },
      {
        id: "gt_b_002_q6",
        number: 6,
        type: "short_answer",
        question: "What colour armbands do first-aid officers wear?",
        answer: "orange",
        explanation: "First-aid officers wear orange armbands.",
      },
    ],
  },
  {
    id: "gt_c_001",
    section: "C",
    title: "Preserving Saudi Heritage in a Digital Age",
    text: `Preserving Saudi Heritage in a Digital Age

Saudi Arabia's cultural heritage spans thousands of years, from Nabataean tombs at Hegra to the mud-brick architecture of Diriyah. As Vision 2030 accelerates urban development and international tourism, heritage experts face a delicate balance: how to protect the past while welcoming the future.

Digital documentation has become a cornerstone of this effort. Teams from the Heritage Commission use 3D laser scanning to create precise records of archaeological sites before restoration work begins. These models allow researchers worldwide to study structures remotely and help planners avoid accidental damage during nearby construction.

Community involvement is equally important. In Al-Ula, local guides now lead visitors through heritage trails that combine oral history with smartphone apps. Young Saudis trained as cultural ambassadors report higher pride in regional identity, suggesting that tourism can strengthen rather than weaken tradition when managed carefully.

Critics argue that mass tourism risks commercialising sacred sites. To address this, authorities have introduced visitor caps at sensitive locations and require advance booking during peak seasons. Revenue from tourism fees is partly reinvested in conservation programmes and scholarships for Saudi students studying archaeology and museum studies.

Technology alone cannot preserve culture. Elderly residents in historic neighbourhoods still hold knowledge that no scanner can capture. Interview projects led by universities in Riyadh and Jeddah record memories of traditional crafts, festivals, and family life before they disappear. Policymakers increasingly treat these oral archives as valuable as physical monuments.

The challenge ahead is integration. Heritage must inform school curricula, city planning, and digital entertainment so that younger generations see the past as relevant rather than remote. Saudi Arabia's experiment — blending high-tech tools with community storytelling — may offer lessons for other rapidly developing nations.`,
    saudiContext: true,
    questions: [
      {
        id: "gt_c_001_q1",
        number: 1,
        type: "multiple_choice",
        question: "What technology does the Heritage Commission use for site records?",
        options: [
          "Satellite imaging only",
          "3D laser scanning",
          "Hand-drawn architectural plans",
          "Drone photography alone",
        ],
        answer: "3D laser scanning",
        explanation: "Teams use 3D laser scanning to create precise records.",
      },
      {
        id: "gt_c_001_q2",
        number: 2,
        type: "true_false_not_given",
        question: "All heritage sites in Saudi Arabia allow unlimited visitors.",
        answer: "FALSE",
        explanation: "Visitor caps exist at sensitive locations.",
      },
      {
        id: "gt_c_001_q3",
        number: 3,
        type: "short_answer",
        question: "Which ancient site is mentioned alongside Diriyah?",
        answer: "Hegra",
        explanation: "Nabataean tombs at Hegra are mentioned in the opening paragraph.",
      },
      {
        id: "gt_c_001_q4",
        number: 4,
        type: "matching_features",
        question: "Who leads interview projects recording traditional crafts and festivals?",
        options: ["Local guides", "Universities", "Tourism companies", "The Heritage Commission"],
        answer: "Universities",
        explanation: "Interview projects are led by universities in Riyadh and Jeddah.",
      },
      {
        id: "gt_c_001_q5",
        number: 5,
        type: "sentence_completion",
        question: "In Al-Ula, visitors use heritage trails combined with ______ apps.",
        answer: "smartphone",
        explanation: "Trails combine oral history with smartphone apps.",
      },
      {
        id: "gt_c_001_q6",
        number: 6,
        type: "true_false_not_given",
        question: "The author believes technology is sufficient on its own to preserve culture.",
        answer: "FALSE",
        explanation: "The text states technology alone cannot preserve culture.",
      },
      {
        id: "gt_c_001_q7",
        number: 7,
        type: "multiple_choice",
        question: "What is partly funded by tourism fees?",
        options: [
          "Metro construction",
          "Conservation programmes",
          "Private hotels only",
          "International flights",
        ],
        answer: "Conservation programmes",
        explanation: "Revenue from tourism fees is partly reinvested in conservation programmes.",
      },
      {
        id: "gt_c_001_q8",
        number: 8,
        type: "short_answer",
        question: "Which national development plan is mentioned in the first paragraph?",
        answer: "Vision 2030",
        explanation: "Vision 2030 is mentioned in the opening paragraph.",
      },
      {
        id: "gt_c_001_q9",
        number: 9,
        type: "sentence_completion",
        question: "Young Saudis trained as cultural ambassadors report higher pride in ______ identity.",
        answer: "regional",
        explanation: "They report higher pride in regional identity.",
      },
      {
        id: "gt_c_001_q10",
        number: 10,
        type: "true_false_not_given",
        question: "Critics support unlimited tourism at all heritage sites.",
        answer: "FALSE",
        explanation: "Critics argue mass tourism risks commercialising sacred sites.",
      },
      {
        id: "gt_c_001_q11",
        number: 11,
        type: "matching_features",
        question: "Who uses 3D laser scanning before restoration work?",
        options: [
          "Local guides",
          "The Heritage Commission",
          "Tourism companies",
          "School teachers",
        ],
        answer: "The Heritage Commission",
        explanation: "Teams from the Heritage Commission use 3D laser scanning.",
      },
      {
        id: "gt_c_001_q12",
        number: 12,
        type: "short_answer",
        question: "Besides physical monuments, what other archives are now valued by policymakers?",
        answer: "oral archives",
        explanation: "Oral archives are treated as valuable as physical monuments.",
      },
      {
        id: "gt_c_001_q13",
        number: 13,
        type: "multiple_choice",
        question: "What is the main challenge described in the final paragraph?",
        options: [
          "Building more hotels",
          "Integration of heritage into modern life",
          "Banning all tourism",
          "Replacing oral history with apps",
        ],
        answer: "Integration of heritage into modern life",
        explanation: "The challenge ahead is integration into curricula, planning, and entertainment.",
      },
    ],
  },
];

export type GtReadingTestBundle = {
  passages: GtReadingPassage[];
  questions: GtReadingQuestion[];
  sectionMeta: typeof GT_READING_SECTIONS;
};

function renumberQuestions(
  passages: GtReadingPassage[],
  startNumber: number
): { passages: GtReadingPassage[]; questions: GtReadingQuestion[]; next: number } {
  let n = startNumber;
  const outPassages: GtReadingPassage[] = [];
  const allQuestions: GtReadingQuestion[] = [];

  for (const passage of passages) {
    const questions = passage.questions.map((q) => {
      const numbered = { ...q, number: n };
      n += 1;
      allQuestions.push(numbered);
      return numbered;
    });
    outPassages.push({ ...passage, questions });
  }

  return { passages: outPassages, questions: allQuestions, next: n };
}

/** All built-in GT passages, Saudi-context first within each section. */
export function getBuiltinPassages(section?: GtReadingSectionKey): GtReadingPassage[] {
  const list = section
    ? GT_PASSAGE_BANK.filter((p) => p.section === section)
    : [...GT_PASSAGE_BANK];

  return list.sort((a, b) => {
    const saudi = Number(Boolean(b.saudiContext)) - Number(Boolean(a.saudiContext));
    if (saudi !== 0) return saudi;
    return a.id.localeCompare(b.id);
  });
}

/** Practice set: one primary passage for the section (Saudi-context preferred). */
export function getSectionPracticeBundle(
  section: GtReadingSectionKey
): { passage: GtReadingPassage; meta: (typeof GT_READING_SECTIONS)[keyof typeof GT_READING_SECTIONS] } {
  const metaKey =
    section === "A" ? "sectionA" : section === "B" ? "sectionB" : "sectionC";
  const passage = getBuiltinPassages(section)[0];
  if (!passage) {
    throw new Error(`No GT reading passage for section ${section}`);
  }
  return { passage, meta: GT_READING_SECTIONS[metaKey] };
}

/** Full 60-minute mock: A (3 texts), B (2 texts), C (1 text) with global numbering. */
export function getFullGtReadingTest(): GtReadingTestBundle {
  const sectionA = getBuiltinPassages("A").slice(0, 3);
  const sectionB = getBuiltinPassages("B").slice(0, 2);
  const sectionC = getBuiltinPassages("C").slice(0, 1);

  const a = renumberQuestions(sectionA, 1);
  const b = renumberQuestions(sectionB, a.next);
  const c = renumberQuestions(sectionC, b.next);

  return {
    passages: [...a.passages, ...b.passages, ...c.passages],
    questions: [...a.questions, ...b.questions, ...c.questions],
    sectionMeta: GT_READING_SECTIONS,
  };
}

export function sectionKeyFromSlug(
  slug: string
): GtReadingSectionKey | null {
  const s = slug.toLowerCase();
  if (s === "section-a" || s === "a") return "A";
  if (s === "section-b" || s === "b") return "B";
  if (s === "section-c" || s === "c") return "C";
  return null;
}

export function mergeBankPassage(raw: unknown): GtReadingPassage | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const content = (row.content ?? row) as Record<string, unknown>;
  const id = String(content.id ?? row.id ?? "");
  const section = String(content.section ?? "A").toUpperCase() as GtReadingSectionKey;
  const title = String(content.title ?? row.title ?? "GT Reading passage");
  const text = String(content.text ?? "");
  const questionsRaw = Array.isArray(content.questions) ? content.questions : [];
  if (!id || !text || questionsRaw.length === 0) return null;

  const questions: GtReadingQuestion[] = questionsRaw.map((q, i) => {
    const item = q as Record<string, unknown>;
    return {
      id: String(item.id ?? `${id}_q${i + 1}`),
      number: Number(item.number ?? i + 1),
      type: String(item.type ?? "short_answer") as GtReadingQuestionType,
      question: String(item.question ?? ""),
      answer: String(item.answer ?? ""),
      explanation: String(item.explanation ?? ""),
      options: Array.isArray(item.options) ? item.options.map(String) : undefined,
    };
  });

  return {
    id,
    section: section === "B" || section === "C" ? section : "A",
    title,
    text,
    questions,
    saudiContext: Boolean(content.saudiContext),
  };
}
