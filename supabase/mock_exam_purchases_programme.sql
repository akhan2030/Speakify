-- Add programme dimension so Academic (ielts) and GT (ielts_general)
-- can unlock the same mock_number independently.
-- Existing rows default to 'ielts' — no data backfill required.
-- Run: node scripts/apply-mock-purchases-programme.mjs

ALTER TABLE mock_exam_purchases
  ADD COLUMN IF NOT EXISTS programme TEXT NOT NULL DEFAULT 'ielts';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mock_exam_purchases_programme_check'
  ) THEN
    ALTER TABLE mock_exam_purchases
      ADD CONSTRAINT mock_exam_purchases_programme_check
      CHECK (programme IN ('ielts', 'ielts_general'));
  END IF;
END $$;

-- Replace UNIQUE (student_id, mock_number) with programme-aware key.
ALTER TABLE mock_exam_purchases
  DROP CONSTRAINT IF EXISTS mock_exam_purchases_student_id_mock_number_key;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'mock_exam_purchases_student_programme_mock_key'
  ) THEN
    ALTER TABLE mock_exam_purchases
      ADD CONSTRAINT mock_exam_purchases_student_programme_mock_key
      UNIQUE (student_id, programme, mock_number);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS mock_exam_purchases_student_programme_idx
  ON mock_exam_purchases (student_id, programme);

NOTIFY pgrst, 'reload schema';
