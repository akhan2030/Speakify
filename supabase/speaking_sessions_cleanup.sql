-- Remove speaking sessions scored without real student speech (run in Supabase SQL Editor)

DELETE FROM speaking_sessions
WHERE transcript IS NULL
   OR transcript::text = '[]'
   OR transcript::text = 'null'
   OR (
     SELECT COALESCE(SUM(LENGTH(TRIM(elem->>'text'))), 0)
     FROM jsonb_array_elements(
       CASE WHEN jsonb_typeof(transcript) = 'array' THEN transcript ELSE '[]'::jsonb END
     ) AS elem
     WHERE elem->>'role' = 'student'
   ) < 50;

-- Remove band scores from progress driven by invalid sessions
UPDATE speaking_progress sp
SET
  current_band = NULL,
  best_band = NULL,
  total_sessions = GREATEST(
    0,
    (SELECT COUNT(*)::int FROM speaking_sessions ss
     WHERE ss.student_id = sp.student_id
       AND ss.completed_at IS NOT NULL
       AND ss.overall_band IS NOT NULL)
  ),
  band_history = '[]'::jsonb,
  updated_at = NOW()
WHERE student_id IN (
  SELECT DISTINCT student_id FROM speaking_sessions
  WHERE completed_at IS NULL OR overall_band IS NULL
);

NOTIFY pgrst, 'reload schema';
