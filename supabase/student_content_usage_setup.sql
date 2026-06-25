-- Per-student content usage tracking (IELTS Accelerator + mocks)
-- Compatible with manual Supabase SQL Editor run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.student_content_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL,
  linked_parent_id TEXT,
  section TEXT,
  band_track TEXT,
  topic TEXT,
  difficulty_band TEXT,
  source_activity_type TEXT,
  attempt_id TEXT,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_student_content_usage
  ON public.student_content_usage (student_id, content_id);

CREATE INDEX IF NOT EXISTS idx_student_section_usage
  ON public.student_content_usage (student_id, section);

CREATE INDEX IF NOT EXISTS idx_student_content_usage_type
  ON public.student_content_usage (student_id, content_type);

ALTER TABLE public.student_content_usage DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
