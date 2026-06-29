-- Vocabulary 3-layer bank: core words + per-student AI top-up
-- Run in Supabase SQL Editor after vocabulary_content_setup.sql

ALTER TABLE public.vocabulary_words
  ADD COLUMN IF NOT EXISTS word_source text NOT NULL DEFAULT 'core',
  ADD COLUMN IF NOT EXISTS student_id text,
  ADD COLUMN IF NOT EXISTS part_of_speech text,
  ADD COLUMN IF NOT EXISTS definition_arabic text,
  ADD COLUMN IF NOT EXISTS pronunciation_ipa text,
  ADD COLUMN IF NOT EXISTS memory_hook text,
  ADD COLUMN IF NOT EXISTS topic_category text;

UPDATE public.vocabulary_words
SET word_source = 'core'
WHERE word_source IS NULL OR word_source = '';

UPDATE public.vocabulary_words
SET definition_arabic = COALESCE(definition_arabic, arabic_translation, '')
WHERE definition_arabic IS NULL;

UPDATE public.vocabulary_words
SET pronunciation_ipa = COALESCE(pronunciation_ipa, ipa, '')
WHERE pronunciation_ipa IS NULL;

CREATE INDEX IF NOT EXISTS idx_vocabulary_words_core_level
  ON public.vocabulary_words (cefr_level, word_source)
  WHERE student_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_vocabulary_words_personal
  ON public.vocabulary_words (student_id, cefr_level, word_source)
  WHERE student_id IS NOT NULL;

-- Per-student level completion + AI top-up tracking
CREATE TABLE IF NOT EXISTS public.student_vocab_level_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  cefr_level text NOT NULL,
  core_words_studied int NOT NULL DEFAULT 0,
  core_words_mastered int NOT NULL DEFAULT 0,
  core_accuracy_pct numeric(5, 2) NOT NULL DEFAULT 0,
  core_completed boolean NOT NULL DEFAULT false,
  ai_topup_count int NOT NULL DEFAULT 0,
  last_ai_topup_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, cefr_level)
);

CREATE INDEX IF NOT EXISTS idx_student_vocab_level_status_student
  ON public.student_vocab_level_status (student_id, cefr_level);

ALTER TABLE public.student_vocab_level_status DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
