-- Patch existing student_vocab_progress for vocabulary 3-layer system
-- Run in Supabase SQL Editor if progress saves fail with "cefr_level" column errors

ALTER TABLE public.student_vocab_progress
  ADD COLUMN IF NOT EXISTS cefr_level text,
  ADD COLUMN IF NOT EXISTS next_review date DEFAULT current_date,
  ADD COLUMN IF NOT EXISTS interval_days int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_rating text,
  ADD COLUMN IF NOT EXISTS last_studied_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS repetitions int NOT NULL DEFAULT 0;

UPDATE public.student_vocab_progress p
SET cefr_level = w.cefr_level
FROM public.vocabulary_words w
WHERE p.cefr_level IS NULL
  AND p.word_id = w.id;

NOTIFY pgrst, 'reload schema';
