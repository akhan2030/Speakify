-- IELTS Mock Exam numbering + full-mock content columns
-- Run in Supabase SQL Editor

-- 1. mock_number on student attempts (per-student sequence)
ALTER TABLE public.mock_test_attempts
  ADD COLUMN IF NOT EXISTS mock_number INTEGER;

ALTER TABLE public.mock_test_attempts
  ADD COLUMN IF NOT EXISTS generated_mock_test_id BIGINT;

UPDATE public.mock_test_attempts
SET mock_number = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY started_at) AS row_num
  FROM public.mock_test_attempts
) sub
WHERE mock_test_attempts.id = sub.id
  AND mock_test_attempts.mock_number IS NULL;

CREATE INDEX IF NOT EXISTS idx_mock_test_attempts_mock_number
  ON public.mock_test_attempts (student_id, mock_number);

-- 2. Extend generated_mock_tests for daily full-mock agent output
ALTER TABLE public.generated_mock_tests
  ADD COLUMN IF NOT EXISTS test_type TEXT DEFAULT 'reading_only';

ALTER TABLE public.generated_mock_tests
  ADD COLUMN IF NOT EXISTS topic TEXT;

ALTER TABLE public.generated_mock_tests
  ADD COLUMN IF NOT EXISTS listening JSONB;

ALTER TABLE public.generated_mock_tests
  ADD COLUMN IF NOT EXISTS reading JSONB;

ALTER TABLE public.generated_mock_tests
  ADD COLUMN IF NOT EXISTS writing JSONB;

ALTER TABLE public.generated_mock_tests
  ADD COLUMN IF NOT EXISTS speaking JSONB;

ALTER TABLE public.generated_mock_tests
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

ALTER TABLE public.generated_mock_tests
  ADD COLUMN IF NOT EXISTS mock_number INTEGER;

ALTER TABLE public.generated_mock_tests
  ADD COLUMN IF NOT EXISTS generated_by TEXT;

ALTER TABLE public.generated_mock_tests
  ADD COLUMN IF NOT EXISTS content_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_generated_mock_tests_type_number
  ON public.generated_mock_tests (test_type, mock_number);

CREATE INDEX IF NOT EXISTS idx_generated_mock_tests_status
  ON public.generated_mock_tests (status, generation_date DESC);

-- Backfill global mock numbers for existing full_mock rows (oldest = 1)
UPDATE public.generated_mock_tests
SET mock_number = sub.row_num
FROM (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) AS row_num
  FROM public.generated_mock_tests
  WHERE test_type = 'full_mock' OR listening IS NOT NULL
) sub
WHERE generated_mock_tests.id = sub.id
  AND generated_mock_tests.mock_number IS NULL;
