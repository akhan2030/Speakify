import type { GrammarCategorySlug } from "@/lib/grammar";
import type { GrammarLessonContent } from "@/lib/grammarContent";

/** General Training grammar — letters, essays, workplace & everyday English (no graphs/charts). */
export const GRAMMAR_LESSONS_GT: Record<GrammarCategorySlug, GrammarLessonContent> = {
  tenses: {
    rules: [
      "Present Simple: facts, habits, and routines (I work in Riyadh; the shop opens at 9).",
      "Present Continuous: temporary situations — not for stative verbs (know, believe).",
      "Past Simple: finished past events with clear time markers (last week, in 2022).",
      "Present Perfect: past actions connected to now (I have lived here for five years).",
      "Future: will / going to / present continuous for arrangements — choose by certainty.",
    ],
    ieltsWritingExamples: [
      "I am writing to complain about the service I received at your hotel last weekend.",
      "I have been working as a sales assistant since I moved to Jeddah in 2020.",
    ],
    ieltsSpeakingExamples: [
      "I've been learning English for about six months now.",
      "When I was at university, I lived in Riyadh.",
    ],
    saudiMistakes: [
      "Using present simple for completed past actions (*Yesterday I go* → Yesterday I went).",
      "Overusing present continuous with stative verbs (*I am believing*).",
      "Mixing present perfect with past time expressions (*I have visited Jeddah last year*).",
    ],
    exercises: [
      {
        id: "t1",
        type: "fill",
        prompt: "I ______ (write) to request information about your training course.",
        modelAnswer: "am writing",
        hint: "Present continuous for a letter in progress",
      },
      {
        id: "t2",
        type: "correct",
        prompt: "Find the error: Last month I am applying for a new job.",
        modelAnswer: "Last month I applied for a new job.",
      },
      {
        id: "t3",
        type: "rewrite",
        prompt: "Rewrite formally: I will probably move to another city next year.",
        modelAnswer: "I am likely to relocate to another city next year.",
      },
      {
        id: "t4",
        type: "fill",
        prompt: "While I ______ (prepare) for IELTS, my sister works in Dammam.",
        modelAnswer: "am preparing",
      },
    ],
  },
  conditionals: {
    rules: [
      "Zero: If + present, present — general truths (If you heat ice, it melts).",
      "First: If + present, will — real future possibilities.",
      "Second: If + past, would — unlikely present/future hypotheticals.",
      "Third: If + past perfect, would have — regrets about the past.",
    ],
    ieltsWritingExamples: [
      "If you could extend the deadline, I would be grateful.",
      "If I had known about the maintenance work, I would have booked another hotel.",
    ],
    ieltsSpeakingExamples: [
      "If I had more time, I would practise speaking every day.",
      "If the weather is good, we'll visit the corniche.",
    ],
    saudiMistakes: [
      "Using would in both clauses (*If I would study harder…*).",
      "Using would have for present unreal situations instead of would.",
      "Comma splices instead of proper if-clauses.",
    ],
    exercises: [
      {
        id: "c1",
        type: "fill",
        prompt: "If the manager ______ (approve) my request, I would start the course next month.",
        modelAnswer: "approved",
      },
      {
        id: "c2",
        type: "correct",
        prompt: "Find the error: If I would get band 7, I will apply for the visa.",
        modelAnswer: "If I got band 7, I would apply for the visa.",
      },
      {
        id: "c3",
        type: "rewrite",
        prompt: "Rewrite with a third conditional: I didn't reply in time, so I lost the apartment.",
        modelAnswer: "If I had replied in time, I would have secured the apartment.",
      },
      {
        id: "c4",
        type: "fill",
        prompt: "If rent prices rise, tenants ______ (look) for cheaper areas.",
        modelAnswer: "will look",
      },
    ],
  },
  "passive-voice": {
    rules: [
      "Form: be + past participle (is produced, were delivered).",
      "Use in formal letters for polite requests (I would be grateful if the issue could be resolved).",
      "Common in notices and workplace documents when the actor is unknown or unimportant.",
      "Balance passive and active — letters should still sound natural.",
    ],
    ieltsWritingExamples: [
      "I was informed that my application had been received.",
      "The damaged item was replaced within three working days.",
    ],
    ieltsSpeakingExamples: [
      "My hometown is known for its historical sites.",
      "I was born in Saudi Arabia and raised in the Eastern Province.",
    ],
    saudiMistakes: [
      "Missing be verb (*The letter sent* → The letter was sent).",
      "Wrong past participle (*was build* → was built).",
      "Overusing passive in informal letters to friends.",
    ],
    exercises: [
      {
        id: "p1",
        type: "fill",
        prompt: "My complaint ______ (not address) within the promised timeframe.",
        modelAnswer: "was not addressed",
      },
      {
        id: "p2",
        type: "correct",
        prompt: "Find the error: The package were deliver to the wrong address.",
        modelAnswer: "The package was delivered to the wrong address.",
      },
      {
        id: "p3",
        type: "rewrite",
        prompt: "Rewrite in passive: The company cancelled my flight.",
        modelAnswer: "My flight was cancelled by the company.",
      },
      {
        id: "p4",
        type: "fill",
        prompt: "It ______ (suggest) that applicants submit documents online.",
        modelAnswer: "is suggested",
      },
    ],
  },
  articles: {
    rules: [
      "a/an: first mention, singular countable, jobs (a manager).",
      "the: specific, unique, second mention, superlatives.",
      "Zero article: plural generalisations, uncountable general concepts.",
      "No article with most subjects (study engineering).",
    ],
    ieltsWritingExamples: [
      "I am writing regarding the position advertised in yesterday's newspaper.",
      "Education plays a vital role in career development.",
    ],
    ieltsSpeakingExamples: [
      "I want to be an engineer in the energy sector.",
      "The weather in summer is extremely hot.",
    ],
    saudiMistakes: [
      "Adding the before general plural nouns (*The students should study*).",
      "Omitting the before superlatives (*most important factor* → the most important factor).",
      "a/an confusion before vowel sounds (an hour, a university).",
    ],
    exercises: [
      {
        id: "a1",
        type: "fill",
        prompt: "I would like to apply for ______ position of customer service assistant.",
        modelAnswer: "the",
      },
      {
        id: "a2",
        type: "correct",
        prompt: "Find the error: She is best candidate for the job.",
        modelAnswer: "She is the best candidate for the job.",
      },
      {
        id: "a3",
        type: "rewrite",
        prompt: "Rewrite correctly: I studied engineering at university in Riyadh.",
        modelAnswer: "I studied engineering at a university in Riyadh.",
      },
      {
        id: "a4",
        type: "fill",
        prompt: "He wants to become ______ doctor after completing ______ medical degree.",
        modelAnswer: "a; a",
      },
    ],
  },
  "relative-clauses": {
    rules: [
      "Defining clauses: essential information, no commas (who/which/that).",
      "Non-defining: extra information, commas, cannot use that.",
      "Useful in letters to add detail without starting a new sentence.",
      "Preposition placement: the manager to whom I spoke / who I spoke to.",
    ],
    ieltsWritingExamples: [
      "The colleague who organised the event has left the company.",
      "My previous landlord, who was very helpful, returned my deposit promptly.",
    ],
    ieltsSpeakingExamples: [
      "My brother, who lives in Jeddah, works in finance.",
      "The book that I read last week was about leadership.",
    ],
    saudiMistakes: [
      "Using that in non-defining clauses with commas.",
      "Double subjects (*My friend he is kind*).",
      "Omitting relative pronoun objects incorrectly.",
    ],
    exercises: [
      {
        id: "r1",
        type: "fill",
        prompt: "The training course ______ you recommended was very useful.",
        modelAnswer: "that",
      },
      {
        id: "r2",
        type: "correct",
        prompt: "Find the error: Riyadh, that is the capital, is growing rapidly.",
        modelAnswer: "Riyadh, which is the capital, is growing rapidly.",
      },
      {
        id: "r3",
        type: "rewrite",
        prompt: "Combine: I met the manager. The manager approved my leave request.",
        modelAnswer: "I met the manager who approved my leave request.",
      },
      {
        id: "r4",
        type: "fill",
        prompt: "Employees ______ arrive on time receive a punctuality bonus.",
        modelAnswer: "who",
      },
    ],
  },
  "academic-structures": {
    rules: [
      "Formal openings: I am writing to… / I would like to enquire about…",
      "Polite requests: I would be grateful if you could… / Would it be possible to…",
      "Closing phrases: I look forward to hearing from you / Yours faithfully.",
      "Linking in essays: However, Furthermore, On the other hand.",
    ],
    ieltsWritingExamples: [
      "I am writing to express my dissatisfaction with the service I received.",
      "Furthermore, flexible working hours would improve staff morale.",
    ],
    ieltsSpeakingExamples: [
      "I'd say that technology has somewhat changed family life.",
      "It seems to me that practice is the key factor.",
    ],
    saudiMistakes: [
      "Overly informal phrases in formal letters (Hey, Thanks a lot).",
      "Missing formal closing (Yours faithfully vs Best wishes).",
      "Sounding too absolute in opinions (*Everyone must agree*).",
    ],
    exercises: [
      {
        id: "s1",
        type: "fill",
        prompt: "I ______ (write) to request a refund for the faulty product.",
        modelAnswer: "am writing",
      },
      {
        id: "s2",
        type: "correct",
        prompt: "Find the error: Hey manager, I want my money back now.",
        modelAnswer: "Dear Sir or Madam, I am writing to request a refund.",
      },
      {
        id: "s3",
        type: "rewrite",
        prompt: "Rewrite politely: Give me the information about the course.",
        modelAnswer: "I would be grateful if you could provide information about the course.",
      },
      {
        id: "s4",
        type: "rewrite",
        prompt: "Add a linker: Many people prefer online shopping. It is convenient.",
        modelAnswer: "Many people prefer online shopping because it is convenient.",
      },
    ],
  },
};

export const GT_GRAMMAR_CATEGORY_LABELS: Partial<
  Record<GrammarCategorySlug, { name?: string; subtitle?: string; ieltsTip: string }>
> = {
  "passive-voice": {
    subtitle: "Form & formal letter use",
    ieltsTip: "Passive voice helps polite requests in formal letters (I would be grateful if…).",
  },
  "academic-structures": {
    name: "Formal letter structures",
    subtitle: "Openings, requests & closings",
    ieltsTip: "Formal openings and polite modals are essential for GT Task 1 letters.",
  },
};
