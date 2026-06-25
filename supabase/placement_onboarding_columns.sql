-- Run after placement_setup.sql to add onboarding columns

ALTER TABLE public.placement_attempts
  ADD COLUMN IF NOT EXISTS full_name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS education_level TEXT,
  ADD COLUMN IF NOT EXISTS field_of_study TEXT,
  ADD COLUMN IF NOT EXISTS ielts_purpose TEXT,
  ADD COLUMN IF NOT EXISTS target_band_score DECIMAL(3,1),
  ADD COLUMN IF NOT EXISTS score_deadline TEXT;

NOTIFY pgrst, 'reload schema';
