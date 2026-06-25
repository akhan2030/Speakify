-- Full IELTS mock test attempts (4-skill orchestrator)
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.mock_test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  current_section TEXT NOT NULL DEFAULT 'listening',
  plan_id TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  flagged JSONB NOT NULL DEFAULT '[]'::jsonb,
  section_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  transcripts JSONB NOT NULL DEFAULT '{}'::jsonb,
  overall_band NUMERIC,
  report JSONB NOT NULL DEFAULT '{}'::jsonb,
  examiner_report JSONB NOT NULL DEFAULT '{}'::jsonb,
  exam_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  mock_number INTEGER,
  generated_mock_test_id BIGINT
);

CREATE INDEX IF NOT EXISTS idx_mock_test_attempts_student
  ON public.mock_test_attempts (student_id, started_at DESC);

ALTER TABLE public.mock_test_attempts DISABLE ROW LEVEL SECURITY;
