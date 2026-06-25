-- Add examiner_report column for cached AI examiner commentary
ALTER TABLE public.mock_test_attempts
  ADD COLUMN IF NOT EXISTS examiner_report JSONB NOT NULL DEFAULT '{}'::jsonb;
