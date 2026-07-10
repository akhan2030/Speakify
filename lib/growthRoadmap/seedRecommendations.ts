/**
 * Initial practice_recommendations library.
 * Estimated impacts are conservative (0.25–0.5 per pattern); resolving one pattern
 * does not guarantee a band change — verified only on the next scored session.
 */

export type RoadmapSkill = "speaking" | "writing";

export type RoadmapCriterion =
  | "fluency_coherence"
  | "lexical_resource"
  | "grammatical_range_accuracy"
  | "pronunciation"
  | "task_achievement"
  | "task_response"
  | "coherence_cohesion";

export type RoadmapTaskType =
  | "drill"
  | "targeted_speaking_session"
  | "targeted_writing_prompt"
  | "lesson";

export type PracticeRecommendationSeed = {
  skill: RoadmapSkill;
  criterion: RoadmapCriterion;
  trigger_pattern: string;
  task_title: string;
  task_description: string;
  task_type: RoadmapTaskType;
  estimated_band_impact: number;
  estimated_sessions_to_resolve: number;
  estimated_minutes: number;
  task_href?: string;
};

export const PRACTICE_RECOMMENDATION_SEEDS: PracticeRecommendationSeed[] = [
  {
    skill: "speaking",
    criterion: "lexical_resource",
    trigger_pattern: "repetitive_vocabulary",
    task_title: "Vocabulary upgrade drill",
    task_description:
      "Rewrite 5 answers using synonyms for overused words (like, good, nice, thing). Record one minute on each topic: hometown, hobbies, food, work/study, travel.",
    task_type: "drill",
    estimated_band_impact: 0.5,
    estimated_sessions_to_resolve: 2,
    estimated_minutes: 12,
    task_href: "/dashboard/student/vocabulary",
  },
  {
    skill: "speaking",
    criterion: "fluency_coherence",
    trigger_pattern: "filler_word_overuse",
    task_title: "Filler-free fluency drill",
    task_description:
      "Speak for 90 seconds on one familiar topic without um/uh/like/you know. Pause silently instead of filling. Repeat twice and compare recordings.",
    task_type: "targeted_speaking_session",
    estimated_band_impact: 0.5,
    estimated_sessions_to_resolve: 2,
    estimated_minutes: 10,
    task_href: "/dashboard/ielts/student/speaking?mode=practice",
  },
  {
    skill: "speaking",
    criterion: "grammatical_range_accuracy",
    trigger_pattern: "past_tense_inconsistency",
    task_title: "Past tense control drill",
    task_description:
      "Tell a story about a past holiday or event using only past simple and past continuous correctly. Check every verb ending before you speak.",
    task_type: "drill",
    estimated_band_impact: 0.5,
    estimated_sessions_to_resolve: 2,
    estimated_minutes: 10,
    task_href: "/dashboard/ielts/student/grammar?focus=tense",
  },
  {
    skill: "speaking",
    criterion: "grammatical_range_accuracy",
    trigger_pattern: "run_on_sentences",
    task_title: "Sentence control speaking drill",
    task_description:
      "Answer 4 Part 1 questions with exactly 2–3 clear sentences each. Stop at the full stop — do not chain ideas with and/and/and.",
    task_type: "targeted_speaking_session",
    estimated_band_impact: 0.5,
    estimated_sessions_to_resolve: 2,
    estimated_minutes: 12,
    task_href: "/dashboard/ielts/student/speaking?mode=practice",
  },
  {
    skill: "speaking",
    criterion: "fluency_coherence",
    trigger_pattern: "weak_coherence_markers",
    task_title: "Linking words in speech",
    task_description:
      "Practise answers using because, however, for example, and as a result to connect ideas. One marker per sentence where possible.",
    task_type: "lesson",
    estimated_band_impact: 0.25,
    estimated_sessions_to_resolve: 2,
    estimated_minutes: 10,
    task_href: "/dashboard/ielts/student/grammar?focus=linking",
  },
  {
    skill: "speaking",
    criterion: "lexical_resource",
    trigger_pattern: "redundant_intensifiers",
    task_title: "Drop the empty intensifiers",
    task_description:
      "Replace very/really/so + basic adjective with one precise word (e.g. very delicious → flavourful). Drill 8 adjective upgrades aloud.",
    task_type: "drill",
    estimated_band_impact: 0.25,
    estimated_sessions_to_resolve: 1,
    estimated_minutes: 8,
    task_href: "/dashboard/student/vocabulary",
  },
  {
    skill: "speaking",
    criterion: "pronunciation",
    trigger_pattern: "word_stress_error",
    task_title: "Word stress practice",
    task_description:
      "Pick 10 topic words you used incorrectly. Mark the stressed syllable, say each word 5 times slowly, then use in a full sentence.",
    task_type: "drill",
    estimated_band_impact: 0.25,
    estimated_sessions_to_resolve: 3,
    estimated_minutes: 10,
    task_href: "/dashboard/ielts/student/speaking?mode=practice",
  },
  {
    skill: "writing",
    criterion: "lexical_resource",
    trigger_pattern: "repetitive_vocabulary",
    task_title: "Writing vocabulary upgrade",
    task_description:
      "Write 5 sentences on the same essay topic using no repeated content words. Swap basic nouns/verbs for topic-specific vocabulary.",
    task_type: "drill",
    estimated_band_impact: 0.5,
    estimated_sessions_to_resolve: 2,
    estimated_minutes: 15,
    task_href: "/dashboard/student/vocabulary",
  },
  {
    skill: "writing",
    criterion: "grammatical_range_accuracy",
    trigger_pattern: "run_on_sentences",
    task_title: "Complex sentence control prompt",
    task_description:
      "Write one Task 2 paragraph using 3 complex sentences (because/although/which) and zero comma splices. One idea per sentence.",
    task_type: "targeted_writing_prompt",
    estimated_band_impact: 0.5,
    estimated_sessions_to_resolve: 2,
    estimated_minutes: 20,
    task_href: "/dashboard/ielts/student/writing?tab=task2&focus=sentence-control",
  },
  {
    skill: "writing",
    criterion: "grammatical_range_accuracy",
    trigger_pattern: "past_tense_inconsistency",
    task_title: "Tense consistency writing drill",
    task_description:
      "Write a 120-word recount of a chart trend or past event. Highlight every verb and check tense matches the time frame.",
    task_type: "drill",
    estimated_band_impact: 0.5,
    estimated_sessions_to_resolve: 2,
    estimated_minutes: 15,
    task_href: "/dashboard/ielts/student/grammar?focus=tense",
  },
  {
    skill: "writing",
    criterion: "coherence_cohesion",
    trigger_pattern: "weak_coherence_markers",
    task_title: "Paragraph linking drill",
    task_description:
      "Write two body paragraphs and start each with a clear topic sentence plus one linking phrase (However, As a result, In contrast).",
    task_type: "lesson",
    estimated_band_impact: 0.5,
    estimated_sessions_to_resolve: 2,
    estimated_minutes: 15,
    task_href: "/dashboard/ielts/student/grammar?focus=linking",
  },
  {
    skill: "writing",
    criterion: "coherence_cohesion",
    trigger_pattern: "poor_paragraph_linking",
    task_title: "Cohesion & flow rewrite",
    task_description:
      "Take your last essay introduction + first body paragraph. Add 3 cohesive ties (this, these, such) so ideas flow without jumps.",
    task_type: "targeted_writing_prompt",
    estimated_band_impact: 0.5,
    estimated_sessions_to_resolve: 2,
    estimated_minutes: 18,
    task_href: "/dashboard/ielts/student/writing?tab=task2&focus=cohesion",
  },
  {
    skill: "writing",
    criterion: "lexical_resource",
    trigger_pattern: "redundant_intensifiers",
    task_title: "Cut redundant intensifiers",
    task_description:
      "Edit one paragraph: remove every very/really/extremely unless essential. Replace with stronger single adjectives or data.",
    task_type: "drill",
    estimated_band_impact: 0.25,
    estimated_sessions_to_resolve: 1,
    estimated_minutes: 10,
    task_href: "/dashboard/ielts/student/writing?tab=task2",
  },
  {
    skill: "writing",
    criterion: "task_response",
    trigger_pattern: "weak_task_response",
    task_title: "Clear position statement drill",
    task_description:
      "Write 3 Task 2 introductions only. Each must state your position in sentence 2 and paraphrase the question without copying.",
    task_type: "targeted_writing_prompt",
    estimated_band_impact: 0.5,
    estimated_sessions_to_resolve: 2,
    estimated_minutes: 20,
    task_href: "/dashboard/ielts/student/writing?tab=task2&focus=position",
  },
  {
    skill: "writing",
    criterion: "task_achievement",
    trigger_pattern: "weak_task_achievement",
    task_title: "Task 1 overview accuracy drill",
    task_description:
      "Describe one chart in 150 words: overview in sentence 1 (main trend + comparison), then 2 detail paragraphs with accurate figures.",
    task_type: "targeted_writing_prompt",
    estimated_band_impact: 0.5,
    estimated_sessions_to_resolve: 2,
    estimated_minutes: 25,
    task_href: "/dashboard/ielts/student/writing?tab=task1&focus=overview",
  },
];

export const CRITERION_DISPLAY_LABELS: Record<RoadmapCriterion, string> = {
  fluency_coherence: "Fluency & Coherence",
  lexical_resource: "Lexical Resource",
  grammatical_range_accuracy: "Grammatical Range & Accuracy",
  pronunciation: "Pronunciation",
  task_achievement: "Task Achievement",
  task_response: "Task Response",
  coherence_cohesion: "Coherence & Cohesion",
};

export const TRIGGER_PATTERN_ALIASES: Record<string, string> = {
  basic_vocabulary_only: "repetitive_vocabulary",
  frequent_hesitation: "filler_word_overuse",
  slow_speech_rate: "filler_word_overuse",
  weak_linking_words: "weak_coherence_markers",
  article_omission: "past_tense_inconsistency",
  subject_verb_agreement: "past_tense_inconsistency",
  limited_complex_structures: "run_on_sentences",
  incorrect_collocation: "repetitive_vocabulary",
  consonant_confusion: "word_stress_error",
  unclear_pronunciation: "word_stress_error",
};
