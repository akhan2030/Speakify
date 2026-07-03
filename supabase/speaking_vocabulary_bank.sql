-- Verified speaking vocabulary review loop
-- Run in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.vocabulary_bank (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  word TEXT NOT NULL,
  source TEXT DEFAULT 'speaking_scoring',
  source_session_id UUID,
  suggested_from TEXT,
  review_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_practiced_at TIMESTAMPTZ,
  last_sentence TEXT,
  last_feedback TEXT,
  status TEXT NOT NULL DEFAULT 'due',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, word)
);

CREATE INDEX IF NOT EXISTS idx_vocabulary_bank_due
  ON public.vocabulary_bank (student_id, next_review_date, status);

ALTER TABLE public.vocabulary_bank DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
