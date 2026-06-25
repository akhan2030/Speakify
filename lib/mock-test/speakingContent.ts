import type { SpeakingPart } from "./types";

export const SPEAKING_PARTS: SpeakingPart[] = [
  {
    part: 1,
    answerSeconds: 60,
    questions: [
      "Tell me about your hometown.",
      "What do you enjoy doing in your free time?",
      "Do you prefer studying alone or with others? Why?",
      "How important is English in your daily life?",
    ],
  },
  {
    part: 2,
    prepSeconds: 60,
    answerSeconds: 120,
    questions: [],
    cueCard: {
      topic: "Describe a person who has influenced you greatly.",
      bullets: [
        "who this person is",
        "how you know them",
        "what qualities they have",
        "and explain why they have influenced you",
      ],
    },
  },
  {
    part: 3,
    answerSeconds: 90,
    questions: [
      "How do role models influence young people in society?",
      "Do you think the media has too much influence on people's choices?",
      "How might sources of influence change in the future?",
    ],
  },
];
