-- Fix demo accounts on the IELTS AI Tutor deployment (not STEP diagnostic).
-- Run in Supabase SQL Editor.

UPDATE users
SET
  program_type = 'ielts',
  enrolled_programs = '["ielts"]'::jsonb,
  step_enrolled = FALSE,
  onboarding_completed = TRUE,
  program_selected = 'ielts',
  placement_test_completed = TRUE
WHERE lower(email) IN (
  'student@speakify.com',
  'ahmed@test.com',
  'ismail.ammar.hamido@speakify.test'
);

NOTIFY pgrst, 'reload schema';
