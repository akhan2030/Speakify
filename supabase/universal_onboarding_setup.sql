-- Speakify Universal Assessment Gateway
-- Run in Supabase SQL editor before deploying /onboarding

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS placement_band DECIMAL(3,1),
  ADD COLUMN IF NOT EXISTS program_selected TEXT,
  ADD COLUMN IF NOT EXISTS accelerator_track TEXT;

-- Reset existing students so they see the gateway (keep admin/teacher accounts as-is)
UPDATE users
SET onboarding_completed = FALSE
WHERE role = 'student'
  AND email NOT IN ('admin@speakify.com', 'student@speakify.com');

-- IELTS AI Tutor demo student must land on IELTS — not STEP diagnostic
UPDATE users
SET
  program_type = 'ielts',
  enrolled_programs = '["ielts"]'::jsonb,
  step_enrolled = FALSE,
  onboarding_completed = TRUE,
  program_selected = 'ielts',
  placement_test_completed = TRUE
WHERE lower(email) = 'student@speakify.com';

NOTIFY pgrst, 'reload schema';
