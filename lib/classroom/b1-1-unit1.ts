/**
 * B1.1 Unit 1 — Identity & Background (pilot unit)
 * Original Speakify GLC content for Saudi/Gulf in-person classes.
 * Review by a qualified ELT teacher before publishing to live classes.
 */

import type { ClassroomSectionType } from "./levels";

export type QuizQuestion = {
  id: number;
  type: "mcq" | "true_false" | "gap_fill";
  prompt: string;
  options?: string[];
  answer: string;
  points?: number;
};

export type VocabEntry = {
  word: string;
  definition: string;
  example: string;
  collocation: string;
  arabicHint: string;
};

export type ClassroomUnitContent = {
  levelCode: "B1.1";
  unitNumber: 1;
  theme: string;
  grammarFocus: string;
  status: "published" | "draft";
  learningObjectives: string[];
  sections: Record<ClassroomSectionType, unknown>;
  quiz: {
    title: string;
    questions: QuizQuestion[];
  };
  answerKey: {
    comprehension: Record<string, string>;
    grammar: Record<string, string | string[]>;
    listening: Record<string, string>;
    quiz: Record<string, string>;
  };
};

export const B1_1_UNIT_1: ClassroomUnitContent = {
  levelCode: "B1.1",
  unitNumber: 1,
  theme: "Identity & Background",
  grammarFocus: "Present Simple vs Present Continuous (review and extend)",
  status: "published",
  learningObjectives: [
    "Introduce yourself professionally in formal and semi-formal settings",
    "Describe your background, hometown, family, and current routine",
    "Distinguish Present Simple (habits/facts) from Present Continuous (now / temporary)",
    "Use 20 identity-related words accurately with common collocations",
    "Write a short personal profile (120–150 words) for a class or workplace context",
  ],
  sections: {
    objectives: {
      intro:
        "This unit helps you talk about who you are — your name, background, studies, and daily life — with clear, natural English. By the end of the unit you will introduce yourself with confidence in class, at university, or at work.",
      canDo: [
        "I can introduce myself and ask polite follow-up questions.",
        "I can describe where I am from and what I usually do.",
        "I can explain what I am doing these days (courses, projects, work).",
        "I can spot Present Simple vs Present Continuous in reading and listening.",
      ],
    },
    warm_up: {
      title: "First impressions",
      teacherNote:
        "2–3 minutes pair talk, then 3 volunteers share one interesting fact about their partner.",
      imagePrompt:
        "A mixed group of young Saudi professionals and students networking at a university career fair in Riyadh.",
      discussionPrompts: [
        "Look at the scene: What are the people doing? How do they feel?",
        "When you meet someone new, what information do you usually share first?",
        "Which is harder for you in English: saying your name clearly, or talking about your job/studies? Why?",
      ],
      predictionTask:
        "You will read about Noura, a young professional in Jeddah. Predict three details she might include when she introduces herself (job, family, hobbies, hometown…).",
    },
    reading: {
      title: "More Than a Name Tag",
      wordCountTarget: "800–1000",
      wordCount: 859,
      passage: `When people ask Noura Al-Harbi who she is, she used to answer with only two words: her first name and her family name. Today she knows that a good introduction is longer — and more useful.

Noura works as a junior communications officer for a mid-size logistics company in Jeddah. She is twenty-four years old. In the morning she usually takes the Haramain train when she visits Riyadh for meetings, but most days she works from the open-plan office near the Corniche. She shares a small apartment with her older sister, who teaches chemistry at a girls’ secondary school. Their parents still live in Yanbu, so the sisters visit home most weekends unless work gets busy.

Noura’s day often looks ordinary on paper. She checks emails at eight, joins short stand-up meetings, and writes social media posts for the company. She does not travel abroad every month, and she does not manage a large team. However, she is currently preparing a presentation for a regional client conference, and that temporary project is changing how she talks about herself.

“In the past I said, ‘I work in communications,’ and stopped,” she explains. “Now I say what I am working on this season. Clients remember stories more than job titles.” Last week a visitor asked if she was a student. She smiled and replied, “I finished my degree two years ago. These days I am building case studies about Gulf supply chains.” The visitor nodded — suddenly the conversation had a clear direction.

Identity at work is not only about job titles. Noura’s manager asks new staff to prepare a sixty-second introduction for team meetings. The structure is simple: name, role, one current focus, and one personal detail that is professional enough for the room. Noura’s personal detail is that she volunteers on Fridays at a community reading club for teenagers who want stronger English for university applications. She does not teach grammar tables; she helps them practise short interviews about hobbies and future plans.

Outside work, Noura is learning photography. She takes photos of Jeddah’s historic districts early on Friday mornings before the streets become crowded. She posts some images privately for family, not for clients. She believes personal hobbies keep conversations human. “People are not only their LinkedIn profiles,” she says. “But in a professional room, you still choose details carefully.”

Family background also shapes how she introduces herself. Her father worked for years in industrial maintenance, and her mother managed the household while studying part-time later in life. Noura mentions this when young women ask how she stayed motivated at university. She is proud, but she does not turn family stories into long speeches. She keeps them short and respectful.

Language is another part of identity. At home Noura speaks Arabic. At work she writes mostly in English and switches to Arabic in corridors when a colleague prefers it. She knows some people worry that mixing languages looks unprofessional. Her advice is practical: match the room. If the meeting is with international partners, stay in clear English. If the tea break is local, enjoy Arabic. What matters is that listeners understand you and feel included.

Sometimes introductions go wrong. Once Noura started a networking event by listing every responsibility on her job description. People looked tired after thirty seconds. Later she shortened her message and asked one question back: “What brings you here today?” Suddenly she was having a real conversation, not delivering a speech.

She also notices how greetings differ across the Gulf. In some rooms a warm smile and a firm “Assalamu alaikum” come first; in others, a simple “Good morning” and a handshake feel more natural. Noura does not treat one style as modern and the other as old-fashioned. She watches the host and follows the energy of the room. Respect, she says, is showing that you are listening — not proving that you memorised a perfect script.

This week Noura is practising a new version of her introduction for the conference. She writes it, says it aloud, and times it. She is not memorising every word — she wants natural rhythm — but she is fixing the facts: her name, her company focus, her current project, and one clear invitation to continue the talk. She laughs when friends say she is “rebranding” herself. In her view she is simply learning to show the useful parts of who she is.

For classmates who feel shy, she offers a small plan. Write three sentences at home. Practise once with a mirror. Then practise with a friend who will interrupt politely after one minute. Interruptions are not rude in training; they teach you to restart calmly when a listener asks a question. Many students discover that the hardest part is not vocabulary — it is deciding which personal detail belongs in a professional introduction.

If you listen carefully to skilled professionals across Riyadh, Jeddah, and Dammam, you hear the same pattern. They state who they are, what they usually do, and what they are doing right now. Those three layers — identity, routine, and temporary focus — turn a name tag into a starting point for connection.`,
    },
    comprehension: {
      instruction:
        "Answer in complete sentences where possible. Use evidence from the text.",
      questions: [
        {
          id: 1,
          kind: "literal",
          prompt: "Where does Noura work, and what is her job title?",
          answer:
            "She works as a junior communications officer for a logistics company in Jeddah.",
        },
        {
          id: 2,
          kind: "literal",
          prompt: "Who does Noura live with, and where do their parents live?",
          answer:
            "She lives with her older sister; their parents live in Yanbu.",
        },
        {
          id: 3,
          kind: "literal",
          prompt: "What temporary project is Noura preparing for?",
          answer:
            "A presentation / case studies for a regional client conference.",
        },
        {
          id: 4,
          kind: "literal",
          prompt:
            "What four parts does her manager want in a sixty-second introduction?",
          answer:
            "Name, role, one current focus, and one suitable personal detail.",
        },
        {
          id: 5,
          kind: "inferential",
          prompt:
            "Why does Noura say clients remember stories more than job titles?",
          answer:
            "Stories create interest and make the speaker memorable; titles alone are too general.",
        },
        {
          id: 6,
          kind: "inferential",
          prompt:
            "What does the text suggest about mixing Arabic and English at work?",
          answer:
            "It is fine if you match the situation so everyone understands and feels included.",
        },
        {
          id: 7,
          kind: "inferential",
          prompt:
            "Why did Noura’s long job-description introduction fail at the networking event?",
          answer:
            "It was too long and one-way; people got bored and there was no real interaction.",
        },
        {
          id: 8,
          kind: "vocabulary",
          prompt:
            "In paragraph 2, what does “open-plan office” suggest about the workplace?",
          answer:
            "A shared workspace without many private rooms/walls between desks.",
        },
        {
          id: 9,
          kind: "vocabulary",
          prompt:
            "What does “match the room” mean in the language paragraph?",
          answer:
            "Choose the language and style that fit the people and situation you are in.",
        },
        {
          id: 10,
          kind: "vocabulary",
          prompt:
            "The final paragraph mentions three layers of a strong introduction. Name them.",
          answer: "Identity, routine (what you usually do), and temporary focus (what you are doing now).",
        },
      ],
    },
    vocabulary: {
      instruction:
        "Study each word. Notice the collocation. Cover the English definition and try to remember it from the Arabic hint.",
      entries: [
        {
          word: "background",
          definition: "Your education, family, and experience history",
          example: "In interviews, briefly describe your educational background.",
          collocation: "educational / professional background",
          arabicHint: "خلفية (تعليمية/مهنية)",
        },
        {
          word: "introduce",
          definition: "To tell people your name and basic information",
          example: "Let me introduce myself before we start.",
          collocation: "introduce yourself / introduce someone to",
          arabicHint: "يُقدّم نفسه/شخصاً",
        },
        {
          word: "identity",
          definition: "Who you are; the qualities that make you you",
          example: "Your professional identity includes your role and values.",
          collocation: "professional identity",
          arabicHint: "هوية",
        },
        {
          word: "routine",
          definition: "Things you do regularly in the same way",
          example: "My morning routine starts with checking emails.",
          collocation: "daily / morning routine",
          arabicHint: "روتين / عادة يومية",
        },
        {
          word: "currently",
          definition: "At the present time",
          example: "I am currently preparing a conference talk.",
          collocation: "currently working on",
          arabicHint: "حالياً",
        },
        {
          word: "temporary",
          definition: "Lasting for a limited time only",
          example: "This is a temporary project until June.",
          collocation: "temporary focus / temporary contract",
          arabicHint: "مؤقت",
        },
        {
          word: "colleague",
          definition: "A person you work with",
          example: "My colleague helped me practise my introduction.",
          collocation: "close colleague / former colleague",
          arabicHint: "زميل عمل",
        },
        {
          word: "network",
          definition: "To meet people for professional connections",
          example: "Students network at career fairs.",
          collocation: "network with professionals",
          arabicHint: "يبني علاقات مهنية / يتخالط للعمل",
        },
        {
          word: "profile",
          definition: "A short public description of a person",
          example: "Update your profile before the interview.",
          collocation: "personal / LinkedIn profile",
          arabicHint: "ملف شخصي",
        },
        {
          word: "volunteer",
          definition: "To work without pay to help others",
          example: "She volunteers at a weekend reading club.",
          collocation: "volunteer at / as",
          arabicHint: "يتطوع",
        },
        {
          word: "presentation",
          definition: "A formal talk to an audience, often with slides",
          example: "He is practising his presentation tonight.",
          collocation: "give / prepare a presentation",
          arabicHint: "عرض تقديمي",
        },
        {
          word: "conference",
          definition: "A large meeting for people in the same field",
          example: "The company is sending two staff to the conference.",
          collocation: "attend a conference",
          arabicHint: "مؤتمر",
        },
        {
          word: "responsibility",
          definition: "A duty that is part of your job",
          example: "One responsibility is writing weekly updates.",
          collocation: "main responsibilities",
          arabicHint: "مسؤولية / مهام",
        },
        {
          word: "switch",
          definition: "To change from one thing to another",
          example: "We switch to Arabic during tea breaks.",
          collocation: "switch to / between",
          arabicHint: "ينتقل / يغيّر",
        },
        {
          word: "include",
          definition: "To make someone or something part of a group",
          example: "A good introduction includes one personal detail.",
          collocation: "include in",
          arabicHint: "يشمل / يُضمّن",
        },
        {
          word: "respectful",
          definition: "Showing care for other people’s feelings and culture",
          example: "Keep family stories short and respectful.",
          collocation: "respectful of",
          arabicHint: "محترم / يراعي",
        },
        {
          word: "direction",
          definition: "A clear path or purpose for a conversation",
          example: "Her answer gave the talk a clear direction.",
          collocation: "give direction to",
          arabicHint: "اتجاه / مسار",
        },
        {
          word: "focus",
          definition: "The main thing you are paying attention to",
          example: "My current focus is customer stories.",
          collocation: "current / main focus",
          arabicHint: "تركيز / محور",
        },
        {
          word: "connection",
          definition: "A helpful relationship between people",
          example: "Small talk can build a real connection.",
          collocation: "build a connection",
          arabicHint: "تواصل / علاقة",
        },
        {
          word: "memorise",
          definition: "To learn something so you can say it from memory",
          example: "Do not memorise every word of your introduction.",
          collocation: "memorise a speech",
          arabicHint: "يحفظ عن ظهر قلب",
        },
      ] as VocabEntry[],
    },
    grammar: {
      title: "Present Simple vs Present Continuous",
      explanation: [
        "Use Present Simple for facts, habits, and permanent situations: I work in Jeddah. She visits Yanbu most weekends.",
        "Use Present Continuous for actions happening now, or temporary situations around now: I am preparing a presentation this week.",
        "Signal words: usually / every day / often → Present Simple. currently / this week / at the moment → Present Continuous.",
        "Be careful: some verbs (know, believe, want, understand) are rarely used in continuous form in this meaning.",
      ],
      examples: [
        {
          simple: "Noura works in communications.",
          continuous: "Noura is working on a conference talk this month.",
        },
        {
          simple: "They live in Jeddah.",
          continuous: "They are staying with relatives this weekend.",
        },
      ],
      exercises: [
        {
          type: "controlled",
          title: "A — Choose the correct form",
          items: [
            {
              id: "g1",
              prompt: "I usually _____ (take) the train to Riyadh.",
              answer: "take",
            },
            {
              id: "g2",
              prompt: "This week she _____ (prepare) a client presentation.",
              answer: "is preparing",
            },
            {
              id: "g3",
              prompt: "They _____ (not / live) abroad; they live in Yanbu.",
              answer: "do not live / don't live",
            },
            {
              id: "g4",
              prompt: "Right now we _____ (practise) our introductions.",
              answer: "are practising / are practicing",
            },
            {
              id: "g5",
              prompt: "He _____ (believe) short stories help clients remember you.",
              answer: "believes",
            },
          ],
        },
        {
          type: "guided",
          title: "B — Rewrite with the better tense",
          items: [
            {
              id: "g6",
              prompt:
                "Temporary: (I / build) case studies about Gulf supply chains these days.",
              answer: "I am building case studies about Gulf supply chains these days.",
            },
            {
              id: "g7",
              prompt: "Habit: (She / volunteer) at a reading club on Fridays.",
              answer: "She volunteers at a reading club on Fridays.",
            },
            {
              id: "g8",
              prompt: "Now: Quiet please — the manager (speak).",
              answer: "Quiet please — the manager is speaking.",
            },
          ],
        },
        {
          type: "free",
          title: "C — Write about you (6–8 sentences)",
          prompt:
            "Write about your identity using both tenses: (1) facts and habits about your life; (2) what you are doing these days (course, project, or temporary routine). Underline one Present Simple and one Present Continuous verb.",
          checklist: [
            "At least 3 Present Simple sentences",
            "At least 2 Present Continuous sentences",
            "One personal detail suitable for a classroom or workplace",
          ],
        },
      ],
    },
    listening: {
      title: "Career fair introductions",
      audioNote:
        "Teacher plays audio once for gist, once for detail. Upload file in Admin → Classroom when recording is ready.",
      audioUrl: null,
      transcript: `Host: Good afternoon and welcome to the Speakify Career Connections corner. First up is Fahad. Fahad, please introduce yourself.

Fahad: Sure. My name is Fahad Al-Qahtani. I study industrial engineering at a university in Riyadh. I usually attend lectures in the morning, and in the afternoons I work part-time in a family warehouse. These days I’m preparing a short poster about warehouse safety for a student exhibition. One personal detail: I love football analytics, so I sometimes help my club organise match data.

Host: Thanks, Fahad. And next we have Reem.

Reem: Hello. I’m Reem Hassan. I’m a customer support associate for an e-commerce company in Dammam. Most days I answer client messages and update order notes. Right now I’m training two new colleagues on polite email language. Outside work I volunteer once a month at a neighbourhood book swap.

Host: Great. One quick question for both of you: what do you say if someone asks, “Who are you?” in thirty seconds?

Fahad: I say who I am, what I normally do, and what I’m focusing on this month.

Reem: Same structure — and I always ask one question back so it’s a conversation, not a speech.`,
      tasks: {
        prediction: [
          "Before listening: What three pieces of information do good professional introductions usually include?",
        ],
        whileListening: [
          {
            id: "l1",
            prompt: "What does Fahad study?",
            answer: "industrial engineering",
          },
          {
            id: "l2",
            prompt: "What is Fahad preparing these days?",
            answer: "a poster about warehouse safety",
          },
          {
            id: "l3",
            prompt: "Where does Reem work?",
            answer: "an e-commerce company in Dammam",
          },
          {
            id: "l4",
            prompt: "What is Reem doing right now with new colleagues?",
            answer: "training them on polite email language",
          },
        ],
        postListening: [
          "In pairs: Compare Fahad’s and Reem’s introductions. Which personal detail felt most professional? Why?",
          "Write the three-layer structure they both recommend.",
        ],
      },
    },
    speaking: {
      pairWork: {
        title: "Partner passport",
        steps: [
          "Student A has 60 seconds to introduce themselves using: name → usual role/studies → current focus → one personal detail.",
          "Student B asks two follow-up questions.",
          "Swap roles.",
        ],
      },
      groupDiscussion: {
        title: "Class map of identities",
        prompt:
          "In groups of 4, each person shares one habit (Present Simple) and one temporary focus (Present Continuous). The group creates a quick poster titled “Who we are this week.”",
      },
      rolePlay: {
        title: "Career fair desk",
        roles: [
          "Visitor: You meet a student/professional for the first time. Ask polite questions.",
          "Exhibitor: Deliver a 45–60 second introduction, then invite a question.",
        ],
        successCriteria: [
          "Clear name and role",
          "One habit + one current project",
          "One question back to the partner",
          "Respectful tone and eye contact",
        ],
      },
    },
    writing: {
      title: "Professional profile paragraph",
      wordCount: "120–150 words",
      prompt:
        "Write a personal profile for the class “About Us” board (or a workplace intranet). Include: who you are, where you are from, what you usually do, what you are doing these days, and one respectful personal detail.",
      modelAnswer: `My name is Layla Al-Mutairi, and I am from Al-Ahsa. I study business administration in Khobar, and I usually attend lectures from Sunday to Wednesday. On Thursdays I help my uncle in his small retail shop, where I greet customers and update simple stock lists. These days I am preparing a short presentation about customer service for my English class. Outside campus I enjoy calligraphy, and I sometimes join community workshops in the evening. I am not looking for a full-time job yet, but I want to practise clear professional introductions now. If we work in a pair activity, please ask me about my presentation — I am happy to exchange ideas.`,
      markingChecklist: [
        "120–150 words",
        "Clear Present Simple for habits/facts",
        "Clear Present Continuous for temporary focus",
        "Professional tone suitable for classroom/workplace",
        "Spelling and basic punctuation accuracy",
        "One personal detail that is appropriate and specific",
      ],
    },
    quiz: {
      note: "Auto-marked on the student device. Teacher sees results on the dashboard.",
    },
    cultural_bridge: {
      title: "Names, families, and first meetings in the Gulf",
      context:
        "In many Saudi and Gulf contexts, people value respectful greetings, clear family names, and an appropriate level of personal detail. What feels warm in a family majlis may feel too private in a mixed professional meeting — and the reverse can also be true across cultures.",
      task: [
        "Interview one classmate (or a family member, if homework): How do you prefer to be introduced in English — first name only, first + family name, or with a title?",
        "List two personal details that are safe to share in a professional room, and two that you would keep for close friends.",
        "Write three lines you would use when meeting an international guest at your university or workplace.",
      ],
      reflectionPrompt:
        "How can you stay true to your identity while adapting your introduction to different rooms?",
    },
    reflection: {
      title: "How confident do you feel?",
      instruction:
        "Rate each skill from 1 (not confident) to 5 (very confident). Add one action for next week.",
      skills: ["speaking", "reading", "writing", "listening"],
      prompt:
        "One thing I will practise before Unit 2: _______________________________",
    },
  },
  quiz: {
    title: "Unit 1 End-of-Unit Quiz — Identity & Background",
    questions: [
      {
        id: 1,
        type: "mcq",
        prompt: "Present Continuous is best for…",
        options: [
          "permanent facts",
          "temporary actions around now",
          "finished actions in 2019",
          "general truths only",
        ],
        answer: "temporary actions around now",
      },
      {
        id: 2,
        type: "mcq",
        prompt: "“She _____ in Jeddah.” (habit / permanent)",
        options: ["is living", "lives", "live", "living"],
        answer: "lives",
      },
      {
        id: 3,
        type: "mcq",
        prompt: "“This week we _____ a conference talk.”",
        options: ["prepare", "are preparing", "prepared", "prepares"],
        answer: "are preparing",
      },
      {
        id: 4,
        type: "mcq",
        prompt: "Which detail belongs in Noura’s sixty-second work introduction?",
        options: [
          "Every task on her job description",
          "Name, role, current focus, one suitable personal detail",
          "Only her salary expectations",
          "A full family history",
        ],
        answer: "Name, role, current focus, one suitable personal detail",
      },
      {
        id: 5,
        type: "true_false",
        prompt: "Noura lives with her parents in Yanbu.",
        answer: "false",
      },
      {
        id: 6,
        type: "true_false",
        prompt: "A good introduction can include one question back to the listener.",
        answer: "true",
      },
      {
        id: 7,
        type: "mcq",
        prompt: "Collocation: educational ______",
        options: ["colleague", "background", "conference", "switch"],
        answer: "background",
      },
      {
        id: 8,
        type: "mcq",
        prompt: "“Match the room” means…",
        options: [
          "Always speak only English",
          "Choose language/style that fits the situation",
          "Never mention your hometown",
          "Memorise a fixed speech for every event",
        ],
        answer: "Choose language/style that fits the situation",
      },
      {
        id: 9,
        type: "gap_fill",
        prompt: "I _____ (usually / take) the train on Sundays.",
        answer: "usually take",
      },
      {
        id: 10,
        type: "gap_fill",
        prompt: "Right now he _____ (write) his profile.",
        answer: "is writing",
      },
      {
        id: 11,
        type: "mcq",
        prompt: "Which sentence is correct?",
        options: [
          "I am knowing her sister.",
          "I know her sister.",
          "I knowing her sister.",
          "I knows her sister.",
        ],
        answer: "I know her sister.",
      },
      {
        id: 12,
        type: "mcq",
        prompt: "Fahad’s temporary focus in the listening is…",
        options: [
          "football coaching full-time",
          "a warehouse safety poster",
          "moving to Jeddah",
          "managing a large team",
        ],
        answer: "a warehouse safety poster",
      },
      {
        id: 13,
        type: "true_false",
        prompt: "Reem volunteers at a neighbourhood book swap.",
        answer: "true",
      },
      {
        id: 14,
        type: "mcq",
        prompt: "The three layers of a strong introduction are…",
        options: [
          "salary, age, address",
          "identity, routine, temporary focus",
          "grammar, spelling, punctuation",
          "past, present perfect, future perfect",
        ],
        answer: "identity, routine, temporary focus",
      },
      {
        id: 15,
        type: "mcq",
        prompt: "A respectful professional personal detail is…",
        options: [
          "private family medical information",
          "a hobby or volunteer activity suitable for the room",
          "someone else’s salary",
          "criticism of a classmate by name",
        ],
        answer: "a hobby or volunteer activity suitable for the room",
      },
    ],
  },
  answerKey: {
    comprehension: {
      "1": "She works as a junior communications officer for a logistics company in Jeddah.",
      "2": "She lives with her older sister; their parents live in Yanbu.",
      "3": "A presentation / case studies for a regional client conference.",
      "4": "Name, role, one current focus, and one suitable personal detail.",
      "5": "Stories create interest and make the speaker memorable; titles alone are too general.",
      "6": "It is fine if you match the situation so everyone understands and feels included.",
      "7": "It was too long and one-way; people got bored and there was no real interaction.",
      "8": "A shared workspace without many private rooms/walls between desks.",
      "9": "Choose the language and style that fit the people and situation you are in.",
      "10": "Identity, routine (what you usually do), and temporary focus (what you are doing now).",
    },
    grammar: {
      g1: "take",
      g2: "is preparing",
      g3: ["do not live", "don't live"],
      g4: ["are practising", "are practicing"],
      g5: "believes",
      g6: "I am building case studies about Gulf supply chains these days.",
      g7: "She volunteers at a reading club on Fridays.",
      g8: "Quiet please — the manager is speaking.",
    },
    listening: {
      l1: "industrial engineering",
      l2: "a poster about warehouse safety",
      l3: "an e-commerce company in Dammam",
      l4: "training them on polite email language",
    },
    quiz: Object.fromEntries(
      [
        [1, "temporary actions around now"],
        [2, "lives"],
        [3, "are preparing"],
        [4, "Name, role, current focus, one suitable personal detail"],
        [5, "false"],
        [6, "true"],
        [7, "background"],
        [8, "Choose language/style that fits the situation"],
        [9, "usually take"],
        [10, "is writing"],
        [11, "I know her sister."],
        [12, "a warehouse safety poster"],
        [13, "true"],
        [14, "identity, routine, temporary focus"],
        [15, "a hobby or volunteer activity suitable for the room"],
      ].map(([id, ans]) => [String(id), String(ans)])
    ),
  },
};
