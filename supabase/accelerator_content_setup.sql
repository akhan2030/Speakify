-- IELTS Accelerator content bank
-- Run in Supabase SQL Editor (full file).
--
-- NOTE: Do NOT reuse public.student_mock_history — that table already tracks
-- listening content pool usage (see student_mock_history.sql).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.accelerator_mock_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  track TEXT NOT NULL, -- foundation | plus | elite
  test_number INTEGER NOT NULL,
  test_type TEXT NOT NULL, -- full_mock | section_practice
  section TEXT, -- listening | reading | writing | speaking
  difficulty TEXT,
  target_band TEXT,
  content JSONB NOT NULL,
  answer_key JSONB,
  marking_rubric JSONB,
  model_answers JSONB,
  topic TEXT,
  status TEXT DEFAULT 'draft',
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  content_hash TEXT UNIQUE
);

-- Per-student accelerator mock history (separate from listening student_mock_history)
CREATE TABLE IF NOT EXISTS public.accelerator_test_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  test_id UUID NOT NULL REFERENCES public.accelerator_mock_tests(id) ON DELETE CASCADE,
  test_type TEXT,
  section TEXT,
  track TEXT,
  score DECIMAL,
  band_score DECIMAL,
  answers JSONB,
  feedback JSONB,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.accelerator_practice_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  test_id UUID REFERENCES public.accelerator_mock_tests(id) ON DELETE SET NULL,
  section TEXT NOT NULL,
  score INTEGER,
  total_questions INTEGER,
  accuracy DECIMAL,
  time_spent_minutes INTEGER,
  weak_areas TEXT[],
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.accelerator_mock_tests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accelerator_test_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.accelerator_practice_attempts DISABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_accelerator_test_history_student_test
  ON public.accelerator_test_history (student_id, test_id);

CREATE INDEX IF NOT EXISTS idx_accelerator_test_history_student_completed
  ON public.accelerator_test_history (student_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_accelerator_mock_tests_track_type
  ON public.accelerator_mock_tests (track, test_type, status);

NOTIFY pgrst, 'reload schema';
