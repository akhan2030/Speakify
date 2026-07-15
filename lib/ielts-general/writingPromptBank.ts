/**
 * Pre-validated GT Writing prompt bank.
 * GT Task 1 = letters only. GT Task 2 = everyday-topic essays.
 */
import type {
  GeneralEssayType,
  GeneralLetterQuestion,
  GeneralTask2Question,
  LetterType,
} from "./writingTaskData.ts";

function buildLetterPrompt(q: {
  situation: string;
  bulletPoints: string[];
  writeTo: string;
  beginAs: string;
}): string {
  const bullets = q.bulletPoints.map((b) => `- ${b}`).join("\n");
  return `${q.situation}\n\nWrite a letter to ${q.writeTo}. In your letter,\n${bullets}\n\nWrite at least 150 words. You do NOT need to write any addresses.\nBegin your letter as follows:\n\n${q.beginAs}`;
}

export type LetterCategory = {
  id: LetterType;
  label: string;
  description: string;
};

export type GtEssayCategory = {
  id: GeneralEssayType;
  label: string;
  description: string;
};

export const GT_LETTER_CATEGORIES: LetterCategory[] = [
  { id: "formal", label: "Formal Letter", description: "Companies, authorities, strangers" },
  { id: "semi_formal", label: "Semi-formal Letter", description: "Landlords, colleagues, familiar contacts" },
  { id: "informal", label: "Informal Letter", description: "Friends and family" },
];

export const GT_TASK2_CATEGORIES: GtEssayCategory[] = [
  { id: "Opinion", label: "Opinion Essay", description: "Agree / disagree with a statement" },
  { id: "Discussion", label: "Discussion", description: "Both views + your opinion" },
  { id: "Cause & Effect", label: "Cause & Effect", description: "Reasons why + consequences" },
  { id: "Problem & Solution", label: "Problem-Solution", description: "Problems and how to fix them" },
  {
    id: "Advantages & Disadvantages",
    label: "Advantages / Disadvantages",
    description: "Weigh up pros and cons",
  },
  { id: "Two-Part Question", label: "Two-Part Question", description: "Two related questions to answer" },
];

function makeLetter(
  id: string,
  letterType: LetterType,
  title: string,
  summary: string,
  writeTo: string,
  situation: string,
  bulletPoints: string[],
  beginAs: string
): GeneralLetterQuestion {
  const base = {
    id,
    letterType,
    label: title,
    title,
    summary,
    writeTo,
    situation,
    bulletPoints,
    beginAs,
  };
  return { ...base, prompt: buildLetterPrompt(base) };
}

// ── Formal letters (6) ─────────────────────────────────────────────────────
const FORMAL_LETTERS: GeneralLetterQuestion[] = [
  makeLetter(
    "formal-hotel-complaint",
    "formal",
    "Incorrect minibar charge",
    "Disputed minibar bill after a wedding stay in Jeddah",
    "the hotel manager",
    "You recently stayed at a hotel in Jeddah for a friend's wedding. When you checked out, the reception charged your room for minibar items you did not consume. You disputed the charge at the desk, but the staff said the bill could not be changed.",
    [
      "explain when you stayed at the hotel and why you were there",
      "describe the minibar charge and what happened when you complained",
      "say what you would like the manager to do about the bill",
    ],
    "Dear Sir or Madam,"
  ),
  makeLetter(
    "formal-council-recycling",
    "formal",
    "Recycling information",
    "Request details about a new local recycling scheme",
    "the local council",
    "Your city has introduced a new household recycling programme and you would like more information.",
    [
      "explain why you are writing",
      "ask for details about what can and cannot be recycled",
      "request a response before the scheme starts next month",
    ],
    "Dear Sir or Madam,"
  ),
  makeLetter(
    "formal-job-application",
    "formal",
    "Job application",
    "Apply for a part-time customer service role",
    "the manager of the company",
    "You saw an advertisement for a part-time customer service position at a local company.",
    [
      "say which job you are applying for",
      "describe your relevant experience",
      "explain why you would be suitable for the role",
    ],
    "Dear Sir or Madam,"
  ),
  makeLetter(
    "formal-train-delay",
    "formal",
    "Train service complaint",
    "Regular delays on your daily commute",
    "the customer service manager of the railway company",
    "You take the same train to work every day, but over the past month it has frequently been delayed, causing you problems at work.",
    [
      "describe your usual journey",
      "explain how the delays have affected you",
      "say what you would like the company to do about the situation",
    ],
    "Dear Sir or Madam,"
  ),
  makeLetter(
    "formal-luggage-claim",
    "formal",
    "Damaged luggage",
    "Claim for suitcase damaged at the airport",
    "the airline's customer service department",
    "On your recent flight, your suitcase was damaged when you collected it at the airport.",
    [
      "describe your flight and what happened to your luggage",
      "explain what damage was caused",
      "say what compensation you would like to receive",
    ],
    "Dear Sir or Madam,"
  ),
  makeLetter(
    "formal-college-enquiry",
    "formal",
    "Course enquiry",
    "Request information about an evening language course",
    "the admissions officer at a local college",
    "You are interested in enrolling in an evening language course at a college near your home.",
    [
      "explain which course you are interested in",
      "ask for details about fees and class times",
      "request information about how to apply",
    ],
    "Dear Sir or Madam,"
  ),
];

// ── Semi-formal letters (6) ──────────────────────────────────────────────────
const SEMI_FORMAL_LETTERS: GeneralLetterQuestion[] = [
  makeLetter(
    "semi-formal-landlord-repair",
    "semi_formal",
    "Request a repair",
    "Heating system broken during winter",
    "your landlord",
    "You rent a flat and the heating system has stopped working during winter.",
    [
      "explain the problem",
      "say how it is affecting you",
      "request that the issue be fixed soon",
    ],
    "Dear Mr Ahmed,"
  ),
  makeLetter(
    "semi-formal-teacher-reference",
    "semi_formal",
    "Reference request",
    "Ask a former teacher for a job reference",
    "your former teacher",
    "You are applying for a new job and need a reference from a teacher who taught you several years ago.",
    [
      "remind your teacher who you are",
      "explain what job you are applying for",
      "ask whether they would be willing to provide a reference",
    ],
    "Dear Ms Patel,"
  ),
  makeLetter(
    "semi-formal-neighbour-noise",
    "semi_formal",
    "Neighbour noise",
    "Ongoing noise from the flat above",
    "your neighbour",
    "The people living in the flat above yours often play loud music late at night.",
    [
      "explain how long the problem has been going on",
      "describe how it affects you",
      "suggest a reasonable solution",
    ],
    "Dear Mr and Mrs Khan,"
  ),
  makeLetter(
    "semi-formal-colleague-event",
    "semi_formal",
    "Colleague leaving",
    "A work colleague is moving to another city",
    "your colleague",
    "A colleague is leaving your workplace to move to another city.",
    [
      "say how you feel about their departure",
      "mention a positive memory from working together",
      "wish them well for the future",
    ],
    "Dear Sarah,"
  ),
  makeLetter(
    "semi-formal-apology-meeting",
    "semi_formal",
    "Missed meeting",
    "Apologise to a colleague for missing a work meeting",
    "your colleague",
    "You were unable to attend an important meeting at work yesterday because of a family emergency.",
    [
      "apologise for missing the meeting",
      "briefly explain what happened",
      "say what you will do to catch up on what was discussed",
    ],
    "Dear James,"
  ),
  makeLetter(
    "semi-formal-invite-speaker",
    "semi_formal",
    "Invite a speaker",
    "Invite a former teacher to speak at a community event",
    "your former teacher",
    "Your local community centre is organising an event for young people and you would like your former teacher to give a short talk.",
    [
      "describe the event",
      "explain why you think they would be a good speaker",
      "ask if they would be available on the proposed date",
    ],
    "Dear Mr Lewis,"
  ),
];

// ── Informal letters (6) ───────────────────────────────────────────────────
const INFORMAL_LETTERS: GeneralLetterQuestion[] = [
  makeLetter(
    "informal-friend-visit",
    "informal",
    "Farewell dinner",
    "Organise a goodbye meal before a friend moves to Dammam",
    "your friend Nadia",
    "Your close friend Nadia is moving from Riyadh to Dammam next month to start a new job. You want to organise a farewell dinner for her before she leaves.",
    [
      "suggest having a dinner together and propose a date",
      "explain why you want to celebrate before she moves",
      "ask Nadia which restaurant she would prefer",
    ],
    "Dear Nadia,"
  ),
  makeLetter(
    "informal-friend-new-job",
    "informal",
    "Share good news",
    "Tell a friend you got a new job",
    "your friend",
    "You have just been offered a new job and want to tell your friend about it.",
    [
      "tell your friend about the job",
      "explain why you are pleased about it",
      "suggest celebrating together soon",
    ],
    "Dear Sam,"
  ),
  makeLetter(
    "informal-friend-advice",
    "informal",
    "Give advice",
    "A friend is thinking of changing jobs",
    "your friend",
    "A friend has written to you because they are thinking of changing jobs.",
    [
      "acknowledge their situation",
      "give your opinion about changing jobs",
      "offer practical suggestions",
    ],
    "Dear Jamie,"
  ),
  makeLetter(
    "informal-friend-borrow",
    "informal",
    "Borrow equipment",
    "Ask to borrow a friend's camera for a trip",
    "your friend",
    "You are going on a short holiday and would like to borrow your friend's camera.",
    [
      "explain why you need the camera",
      "say when you will return it",
      "offer to help your friend in return",
    ],
    "Dear Chris,"
  ),
  makeLetter(
    "informal-friend-wedding",
    "informal",
    "Wedding congratulations",
    "Congratulate a friend who recently got married",
    "your friend",
    "A close friend has recently got married and you were unable to attend the wedding.",
    [
      "congratulate your friend on their marriage",
      "explain why you could not attend the wedding",
      "suggest meeting up soon to celebrate",
    ],
    "Dear Taylor,"
  ),
  makeLetter(
    "informal-friend-apology",
    "informal",
    "Missed birthday",
    "Apologise to a friend for missing their birthday party",
    "your friend",
    "You promised to attend your friend's birthday party but did not go because you were unwell.",
    [
      "apologise for not attending",
      "explain why you could not come",
      "suggest another time to meet and make it up to them",
    ],
    "Dear Morgan,"
  ),
];

export const GT_LETTER_PROMPT_BANK: GeneralLetterQuestion[] = [
  ...FORMAL_LETTERS,
  ...SEMI_FORMAL_LETTERS,
  ...INFORMAL_LETTERS,
];

// ── GT Task 2 essays (6 per type) ───────────────────────────────────────────
export const GT_TASK2_PROMPT_BANK: GeneralTask2Question[] = [
  // Opinion (6)
  {
    id: "gt-free-public-transport",
    label: "Opinion Essay",
    essayType: "Opinion",
    title: "Free public transport",
    summary: "Should buses and trains be free for everyone?",
    prompt:
      "Some people believe that public transport should be free for everyone. To what extent do you agree or disagree?",
  },
  {
    id: "gt-plastic-bags-ban",
    label: "Opinion Essay",
    essayType: "Opinion",
    title: "Plastic bag ban",
    summary: "Should single-use plastic bags be banned?",
    prompt:
      "Some people think that single-use plastic bags should be banned completely. To what extent do you agree or disagree?",
  },
  {
    id: "gt-foreign-language",
    label: "Opinion Essay",
    essayType: "Opinion",
    title: "Learning languages",
    summary: "Should all children learn a foreign language at school?",
    prompt:
      "Some people believe that all school children should learn at least one foreign language. To what extent do you agree or disagree?",
  },
  {
    id: "gt-sports-facilities",
    label: "Opinion Essay",
    essayType: "Opinion",
    title: "Sports facilities",
    summary: "Should governments spend more on public sports facilities?",
    prompt:
      "Some people think governments should spend more money on public sports facilities. To what extent do you agree or disagree?",
  },
  {
    id: "gt-retirement-age",
    label: "Opinion Essay",
    essayType: "Opinion",
    title: "Later retirement",
    summary: "Should people work until an older age?",
    prompt:
      "In many countries, people are working until a later age than in the past. To what extent is this a positive development?",
  },
  {
    id: "gt-television-waste",
    label: "Opinion Essay",
    essayType: "Opinion",
    title: "Television",
    summary: "Is watching TV a waste of time?",
    prompt:
      "Some people believe that watching television is a waste of time. To what extent do you agree or disagree?",
  },

  // Discussion (6)
  {
    id: "gt-community-volunteering",
    label: "Discussion Essay",
    essayType: "Discussion",
    title: "Community volunteering",
    summary: "Should young people do voluntary work locally?",
    prompt:
      "Some people think young people should do voluntary work in their community. Others believe they should focus on their career or studies. Discuss both views and give your own opinion.",
  },
  {
    id: "gt-city-vs-countryside-children",
    label: "Discussion Essay",
    essayType: "Discussion",
    title: "Where to raise children",
    summary: "City vs countryside for families with children",
    prompt:
      "Some people believe it is better to raise children in the countryside. Others think cities offer more opportunities for young people. Discuss both views and give your own opinion.",
  },
  {
    id: "gt-gap-year",
    label: "Discussion Essay",
    essayType: "Discussion",
    title: "Gap year",
    summary: "Taking a year off before university",
    prompt:
      "Some students take a gap year before starting university. Others go straight into higher education. Discuss both views and give your own opinion.",
  },
  {
    id: "gt-university-vs-vocational",
    label: "Discussion Essay",
    essayType: "Discussion",
    title: "University vs vocational training",
    summary: "Academic degrees vs practical skills training",
    prompt:
      "Some people think university education is essential for a good career. Others believe vocational training is more useful. Discuss both views and give your own opinion.",
  },
  {
    id: "gt-retirement-age-policy",
    label: "Discussion Essay",
    essayType: "Discussion",
    title: "State pension age",
    summary: "Should governments raise the retirement age?",
    prompt:
      "Some people think governments should raise the age at which people can receive a state pension. Others believe the retirement age should stay the same. Discuss both views and give your own opinion.",
  },
  {
    id: "gt-homework-schools",
    label: "Discussion Essay",
    essayType: "Discussion",
    title: "Homework",
    summary: "Should schools assign homework?",
    prompt:
      "Some people believe homework is important for students' learning. Others think homework puts too much pressure on young people. Discuss both views and give your own opinion.",
  },

  // Cause & Effect (6)
  {
    id: "gt-living-alone",
    label: "Cause & Effect",
    essayType: "Cause & Effect",
    title: "Living alone",
    summary: "Why more people live alone and the effects on society",
    prompt:
      "In many countries, more people are choosing to live alone. What are the causes of this trend? What effects does it have on society?",
  },
  {
    id: "gt-traffic-congestion",
    label: "Cause & Effect",
    essayType: "Cause & Effect",
    title: "Traffic congestion",
    summary: "Why city traffic is worsening and its effects",
    prompt:
      "Traffic congestion is a growing problem in many cities. What are the causes of this problem? What effects does it have on people's daily lives?",
  },
  {
    id: "gt-workplace-stress",
    label: "Cause & Effect",
    essayType: "Cause & Effect",
    title: "Workplace stress",
    summary: "Why workers feel more stressed and the consequences",
    prompt:
      "Many workers today report higher levels of stress than in the past. What are the causes of this? What effects does workplace stress have on individuals and families?",
  },
  {
    id: "gt-fast-food-popularity",
    label: "Cause & Effect",
    essayType: "Cause & Effect",
    title: "Fast food",
    summary: "Why fast food is popular and its effects on health",
    prompt:
      "Fast food has become increasingly popular in many countries. What are the causes of this trend? What effects does it have on people's health?",
  },
  {
    id: "gt-declining-newspapers",
    label: "Cause & Effect",
    essayType: "Cause & Effect",
    title: "Fewer newspaper readers",
    summary: "Why fewer people read print newspapers",
    prompt:
      "Fewer people today read newspapers than in previous decades. What are the causes of this change? What effects does it have on society?",
  },
  {
    id: "gt-urbanisation",
    label: "Cause & Effect",
    essayType: "Cause & Effect",
    title: "Moving to cities",
    summary: "Why people migrate to urban areas",
    prompt:
      "In many countries, people are moving from rural areas to cities. What are the causes of this? What effects does it have on both rural and urban communities?",
  },

  // Problem & Solution (6)
  {
    id: "gt-children-technology",
    label: "Problem & Solution",
    essayType: "Problem & Solution",
    title: "Children and screens",
    summary: "Young children spending too much time on devices",
    prompt:
      "Many young children today spend several hours a day using smartphones and tablets. What problems does this cause? What solutions can parents and schools offer?",
  },
  {
    id: "gt-litter-public-places",
    label: "Problem & Solution",
    essayType: "Problem & Solution",
    title: "Litter problem",
    summary: "Rubbish left in streets and parks",
    prompt:
      "In many towns and cities, litter is a serious problem in public places. What problems does this cause? What measures can be taken to reduce littering?",
  },
  {
    id: "gt-cyberbullying",
    label: "Problem & Solution",
    essayType: "Problem & Solution",
    title: "Cyberbullying",
    summary: "Online bullying among teenagers",
    prompt:
      "Cyberbullying is a growing problem among young people. What problems does it cause? What can parents, schools and governments do to address it?",
  },
  {
    id: "gt-housing-shortage",
    label: "Problem & Solution",
    essayType: "Problem & Solution",
    title: "Housing shortage",
    summary: "Not enough affordable homes in cities",
    prompt:
      "Many cities do not have enough affordable housing for their residents. What problems does this cause? What solutions could help address the housing shortage?",
  },
  {
    id: "gt-elderly-loneliness",
    label: "Problem & Solution",
    essayType: "Problem & Solution",
    title: "Elderly loneliness",
    summary: "Older people living alone without support",
    prompt:
      "An increasing number of elderly people live alone without regular contact from family or friends. What problems does this cause? What can be done to help them?",
  },
  {
    id: "gt-road-accidents",
    label: "Problem & Solution",
    essayType: "Problem & Solution",
    title: "Road accidents",
    summary: "High number of traffic accidents",
    prompt:
      "Many countries have a high number of road accidents each year. What are the main causes of this problem? What measures could governments and individuals take to improve road safety?",
  },

  // Advantages & Disadvantages (6)
  {
    id: "gt-local-shops",
    label: "Advantages & Disadvantages",
    essayType: "Advantages & Disadvantages",
    title: "Local shops closing",
    summary: "Small shops vs large supermarkets in towns",
    prompt:
      "In many towns, small local shops are closing because people prefer shopping in large supermarkets. What are the advantages and disadvantages of this development?",
  },
  {
    id: "gt-cars-in-cities",
    label: "Advantages & Disadvantages",
    essayType: "Advantages & Disadvantages",
    title: "Cars in cities",
    summary: "Owning and using a car in urban areas",
    prompt:
      "Many people depend on cars for daily travel in cities. What are the advantages and disadvantages of widespread car use in urban areas?",
  },
  {
    id: "gt-tourism-local",
    label: "Advantages & Disadvantages",
    essayType: "Advantages & Disadvantages",
    title: "Tourism locally",
    summary: "Tourists visiting small towns and rural areas",
    prompt:
      "Tourism is increasing in many small towns and rural areas. What are the advantages and disadvantages of this for local communities?",
  },
  {
    id: "gt-working-while-studying",
    label: "Advantages & Disadvantages",
    essayType: "Advantages & Disadvantages",
    title: "Working while studying",
    summary: "Students taking part-time jobs during their studies",
    prompt:
      "Many students work part-time while they are studying. What are the advantages and disadvantages of this?",
  },
  {
    id: "gt-social-media-communication",
    label: "Advantages & Disadvantages",
    essayType: "Advantages & Disadvantages",
    title: "Social media",
    summary: "Using social media to stay in touch with others",
    prompt:
      "Social media has become a common way for people to communicate with friends and family. What are the advantages and disadvantages of this?",
  },
  {
    id: "gt-retiring-abroad",
    label: "Advantages & Disadvantages",
    essayType: "Advantages & Disadvantages",
    title: "Retiring abroad",
    summary: "Older people moving to another country after retirement",
    prompt:
      "An increasing number of people choose to retire in a different country. What are the advantages and disadvantages of retiring abroad?",
  },

  // Two-Part Question (6)
  {
    id: "gt-online-shopping-local",
    label: "Two-Part Question",
    essayType: "Two-Part Question",
    title: "Online shopping",
    summary: "Why online shopping is popular and its effect on high streets",
    prompt:
      "Online shopping has become very popular in recent years. Why do people prefer shopping online? How has this affected local shops and town centres?",
  },
  {
    id: "gt-cinema-attendance",
    label: "Two-Part Question",
    essayType: "Two-Part Question",
    title: "Cinema attendance",
    summary: "Fewer people going to cinemas",
    prompt:
      "Fewer people are going to cinemas than in the past. Why is this happening? What can cinemas do to attract more visitors?",
  },
  {
    id: "gt-pet-ownership",
    label: "Two-Part Question",
    essayType: "Two-Part Question",
    title: "Pet ownership",
    summary: "More households owning pets",
    prompt:
      "More people today own pets than in previous generations. Why is this trend growing? What are the benefits of having a pet?",
  },
  {
    id: "gt-career-changes",
    label: "Two-Part Question",
    essayType: "Two-Part Question",
    title: "Changing careers",
    summary: "People switching jobs mid-career",
    prompt:
      "Many people now change careers several times during their working life. Why do people change careers? Is this a positive or negative development?",
  },
  {
    id: "gt-family-time",
    label: "Two-Part Question",
    essayType: "Two-Part Question",
    title: "Less family time",
    summary: "Families spending less time together",
    prompt:
      "Many families today spend less time together than in the past. Why is this happening? What can families do to spend more quality time together?",
  },
  {
    id: "gt-practical-skills-school",
    label: "Two-Part Question",
    essayType: "Two-Part Question",
    title: "Practical skills",
    summary: "Teaching cooking and budgeting at school",
    prompt:
      "Some people think schools should teach practical life skills such as cooking and managing money. Why are these skills important? How could schools teach them effectively?",
  },
];

export function getGtLettersByCategory(letterType: LetterType): GeneralLetterQuestion[] {
  return GT_LETTER_PROMPT_BANK.filter((q) => q.letterType === letterType);
}

export function getGtTask2ByCategory(essayType: GeneralEssayType): GeneralTask2Question[] {
  return GT_TASK2_PROMPT_BANK.filter((q) => q.essayType === essayType);
}

export function getGtLetterById(id: string): GeneralLetterQuestion | undefined {
  return GT_LETTER_PROMPT_BANK.find((q) => q.id === id);
}

export function getGtTask2ById(id: string): GeneralTask2Question | undefined {
  return GT_TASK2_PROMPT_BANK.find((q) => q.id === id);
}
