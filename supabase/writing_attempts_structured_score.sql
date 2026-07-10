-- Optional: store structured writing deductions alongside prose feedback
ALTER TABLE writing_attempts
  ADD COLUMN IF NOT EXISTS structured_score JSONB;

NOTIFY pgrst, 'reload schema';
