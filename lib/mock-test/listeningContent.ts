import type { ListeningSectionContent } from "./types";

/** Multi-accent voices via OpenAI TTS */
export const LISTENING_VOICES = ["nova", "alloy", "onyx", "shimmer"] as const;

export const LISTENING_SECTIONS: ListeningSectionContent[] = [
  {
    section: 1,
    title: "Section 1",
    subtitle: "Social conversation — Form completion",
    voice: "nova",
    transcript: `Receptionist: Good morning, Riverside Language Centre. How can I help you?
Student: Hi, I'd like to register for the evening IELTS preparation course.
Receptionist: Certainly. Can I take your full name?
Student: Yes, it's Elena Vasquez.
Receptionist: And your contact number?
Student: Zero seven nine eight, four five six, two one nine zero.
Receptionist: Thank you. Which start date are you interested in?
Student: The course beginning on the fifteenth of March.
Receptionist: That's our six-week programme. The fee is two hundred and forty pounds, payable in two instalments.
Student: Fine. I'll pay the first instalment today by card.
Receptionist: Perfect. Classes are on Tuesdays and Thursdays from six thirty to eight thirty PM.
Student: Could I also get a student ID card?
Receptionist: Yes, we'll issue that on your first day. Please bring a passport photo.
Student: One more thing — is parking available?
Receptionist: There's a car park behind the building. Evening parking is free for students.
Student: Brilliant. My email is elena dot vasquez at mail dot com.`,
    questions: [
      { id: "l1-q1", number: 1, section: 1, type: "form", prompt: "Student name:", correct: "Elena Vasquez" },
      { id: "l1-q2", number: 2, section: 1, type: "form", prompt: "Phone number:", correct: "07984562190" },
      { id: "l1-q3", number: 3, section: 1, type: "form", prompt: "Course start date:", correct: "15 March" },
      { id: "l1-q4", number: 4, section: 1, type: "form", prompt: "Course length:", correct: "6 weeks" },
      { id: "l1-q5", number: 5, section: 1, type: "form", prompt: "Total course fee:", correct: "240" },
      { id: "l1-q6", number: 6, section: 1, type: "form", prompt: "Class days:", correct: "Tuesday and Thursday" },
      { id: "l1-q7", number: 7, section: 1, type: "form", prompt: "Class times:", correct: "6:30 to 8:30 PM" },
      { id: "l1-q8", number: 8, section: 1, type: "form", prompt: "Document needed for ID:", correct: "passport photo" },
      { id: "l1-q9", number: 9, section: 1, type: "form", prompt: "Parking location:", correct: "behind the building" },
      { id: "l1-q10", number: 10, section: 1, type: "form", prompt: "Email:", correct: "elena.vasquez@mail.com" },
    ],
  },
  {
    section: 2,
    title: "Section 2",
    subtitle: "Monologue — Note completion",
    voice: "alloy",
    transcript: `Welcome to the Green Valley Community Farm open day. I'm Marcus, the farm manager.
Our organic vegetable boxes are delivered every Friday within a ten-mile radius.
This season we're growing tomatoes, courgettes, kale, and heritage potatoes.
The children's activity barn opens at eleven AM with bread-making workshops.
Guided tractor tours depart from the main gate at noon and two PM — each tour lasts forty-five minutes.
The farm shop accepts cash and card; the café closes at five thirty.
Dogs are welcome on leads, but please keep them away from the poultry area near the lake.
Volunteers can sign up at the information desk for our Saturday planting sessions.
Parking is in field B — follow the signs past the orchard.`,
    questions: [
      { id: "l2-q1", number: 11, section: 2, type: "note", prompt: "Vegetable box delivery day:", correct: "Friday" },
      { id: "l2-q2", number: 12, section: 2, type: "note", prompt: "Delivery radius:", correct: "10 miles" },
      { id: "l2-q3", number: 13, section: 2, type: "note", prompt: "Activity barn opens at:", correct: "11 AM" },
      { id: "l2-q4", number: 14, section: 2, type: "note", prompt: "Workshop activity:", correct: "bread-making" },
      { id: "l2-q5", number: 15, section: 2, type: "note", prompt: "Tractor tour departure times:", correct: "noon and 2 PM" },
      { id: "l2-q6", number: 16, section: 2, type: "note", prompt: "Tour duration:", correct: "45 minutes" },
      { id: "l2-q7", number: 17, section: 2, type: "note", prompt: "Café closing time:", correct: "5:30" },
      { id: "l2-q8", number: 18, section: 2, type: "note", prompt: "Area to avoid with dogs:", correct: "poultry area" },
      { id: "l2-q9", number: 19, section: 2, type: "note", prompt: "Volunteer sessions day:", correct: "Saturday" },
      { id: "l2-q10", number: 20, section: 2, type: "note", prompt: "Parking location:", correct: "field B" },
    ],
  },
  {
    section: 3,
    title: "Section 3",
    subtitle: "Academic discussion — Multiple choice",
    voice: "onyx",
    transcript: `Tutor: So for your group project on urban heat islands, have you decided on a methodology?
Aisha: We're comparing satellite surface temperatures with ground sensor data from three districts.
Ben: I suggested adding a questionnaire for residents about perceived heat stress during summer.
Tutor: Good — triangulation strengthens your argument. Which districts did you select?
Aisha: The financial district, a suburban housing estate, and the riverside park zone.
Ben: The park should act as a control because of its tree canopy cover.
Tutor: Remember to normalise for building height in the financial area.
Aisha: We'll also analyse night-time readings — that's when heat retention matters most.
Ben: Our draft hypothesis is that green infrastructure reduces peak temperatures by at least two degrees.
Tutor: Cite the Melbourne urban forestry study; it's highly relevant.
Aisha: Presentation is scheduled for the twenty-second; we're aiming for fifteen slides.
Ben: Should we include policy recommendations or stay descriptive?
Tutor: Brief recommendations are fine if they're evidence-based.`,
    questions: [
      {
        id: "l3-q1",
        number: 21,
        section: 3,
        type: "mcq",
        prompt: "What is the main data source for temperature comparison?",
        options: ["Weather balloons", "Satellite and ground sensors", "Historical newspapers", "Traffic cameras"],
        correct: "Satellite and ground sensors",
      },
      {
        id: "l3-q2",
        number: 22,
        section: 3,
        type: "mcq",
        prompt: "Ben proposed collecting data through:",
        options: ["Resident questionnaires", "Soil samples", "Traffic counts", "Building permits"],
        correct: "Resident questionnaires",
      },
      {
        id: "l3-q3",
        number: 23,
        section: 3,
        type: "mcq",
        prompt: "Which area serves as a control site?",
        options: ["Financial district", "Suburban estate", "Riverside park", "Industrial zone"],
        correct: "Riverside park",
      },
      {
        id: "l3-q4",
        number: 24,
        section: 3,
        type: "mcq",
        prompt: "What factor must be adjusted in the financial district?",
        options: ["Population density", "Building height", "Road width", "River flow"],
        correct: "Building height",
      },
      {
        id: "l3-q5",
        number: 25,
        section: 3,
        type: "mcq",
        prompt: "Night-time readings are important because they measure:",
        options: ["Wind speed", "Heat retention", "Rainfall", "Air quality"],
        correct: "Heat retention",
      },
      {
        id: "l3-q6",
        number: 26,
        section: 3,
        type: "mcq",
        prompt: "The expected temperature reduction from green infrastructure is:",
        options: ["0.5 degrees", "1 degree", "2 degrees", "5 degrees"],
        correct: "2 degrees",
      },
      {
        id: "l3-q7",
        number: 27,
        section: 3,
        type: "mcq",
        prompt: "Which study does the tutor recommend citing?",
        options: ["London flood report", "Melbourne urban forestry study", "Tokyo transit review", "Berlin housing survey"],
        correct: "Melbourne urban forestry study",
      },
      {
        id: "l3-q8",
        number: 28,
        section: 3,
        type: "mcq",
        prompt: "When is the presentation due?",
        options: ["The twelfth", "The fifteenth", "The twenty-second", "The thirtieth"],
        correct: "The twenty-second",
      },
      {
        id: "l3-q9",
        number: 29,
        section: 3,
        type: "mcq",
        prompt: "How many slides are they planning?",
        options: ["Ten", "Fifteen", "Twenty", "Twenty-five"],
        correct: "Fifteen",
      },
      {
        id: "l3-q10",
        number: 30,
        section: 3,
        type: "mcq",
        prompt: "Policy recommendations should be:",
        options: ["Avoided entirely", "Evidence-based", "Written by the tutor", "Based on opinion only"],
        correct: "Evidence-based",
      },
    ],
  },
  {
    section: 4,
    title: "Section 4",
    subtitle: "Academic lecture — Summary completion",
    voice: "shimmer",
    transcript: `Today's lecture examines cognitive load theory and its implications for instructional design.
Working memory can handle only a limited number of novel elements simultaneously — typically four, plus or minus one.
Intrinsic load refers to the inherent difficulty of the material itself.
Extraneous load is caused by poor presentation — cluttered slides, redundant narration, or split attention.
Germane load is productive mental effort devoted to schema construction and learning.
The modality principle suggests combining visual diagrams with concise spoken explanation rather than on-screen text.
Segmenting complex procedures into short steps reduces overload and improves retention.
Expertise reversal effect means detailed guidance helps novices but hinders experts.
When designing e-learning, eliminate redundant sources of information and signal key relationships explicitly.
Finally, retrieval practice — not re-reading — is the most reliable method for long-term retention.`,
    questions: [
      { id: "l4-q1", number: 31, section: 4, type: "summary", prompt: "Working memory capacity: about _____ elements", correct: "four" },
      { id: "l4-q2", number: 32, section: 4, type: "summary", prompt: "Difficulty inherent in the topic = _____ load", correct: "intrinsic" },
      { id: "l4-q3", number: 33, section: 4, type: "summary", prompt: "Poor presentation creates _____ load", correct: "extraneous" },
      { id: "l4-q4", number: 34, section: 4, type: "summary", prompt: "Productive effort building schemas = _____ load", correct: "germane" },
      { id: "l4-q5", number: 35, section: 4, type: "summary", prompt: "Use diagrams with _____ explanation (modality principle)", correct: "spoken" },
      { id: "l4-q6", number: 36, section: 4, type: "summary", prompt: "Breaking tasks into steps is called _____", correct: "segmenting" },
      { id: "l4-q7", number: 37, section: 4, type: "summary", prompt: "Detailed guidance hurts _____ learners (expertise reversal)", correct: "experts" },
      { id: "l4-q8", number: 38, section: 4, type: "summary", prompt: "Remove _____ sources of information in e-learning", correct: "redundant" },
      { id: "l4-q9", number: 39, section: 4, type: "summary", prompt: "Best method for long-term retention: _____ practice", correct: "retrieval" },
      { id: "l4-q10", number: 40, section: 4, type: "summary", prompt: "Re-reading is _____ effective than retrieval practice", correct: "less" },
    ],
  },
];

export function getAllListeningQuestions() {
  return LISTENING_SECTIONS.flatMap((s) => s.questions);
}
