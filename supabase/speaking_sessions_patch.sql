-- Patch for existing speaking tables (run if setup was already applied)

ALTER TABLE speaking_sessions
  ADD COLUMN IF NOT EXISTS speaking_time_seconds INTEGER;

ALTER TABLE speaking_vocabulary_progress
  ADD COLUMN IF NOT EXISTS practiced BOOLEAN DEFAULT FALSE;

-- Migrate legacy column name if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speaking_vocabulary_progress' AND column_name = 'mastered'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'speaking_vocabulary_progress' AND column_name = 'practiced'
  ) THEN
    ALTER TABLE speaking_vocabulary_progress RENAME COLUMN mastered TO practiced;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
