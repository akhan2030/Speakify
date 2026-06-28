-- Persist diagnostic question set so submit grades the same items the student saw
ALTER TABLE step_enrollments
ADD COLUMN IF NOT EXISTS diagnostic_snapshot JSONB;

NOTIFY pgrst, 'reload schema';
