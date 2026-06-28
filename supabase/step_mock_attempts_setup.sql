-- STEP Full Mock Exam — in-progress attempts (run after step_accelerator_setup.sql)

CREATE TABLE IF NOT EXISTS step_mock_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  mock_number INTEGER NOT NULL,
  question_ids TEXT[] NOT NULL,
  questions_snapshot JSONB NOT NULL DEFAULT '[]',
  answers JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'expired')),
  time_spent_seconds INTEGER,
  reading_score INTEGER,
  structure_score INTEGER,
  listening_score INTEGER,
  compositional_score INTEGER,
  total_score INTEGER
);

CREATE INDEX IF NOT EXISTS idx_step_mock_attempts_student
  ON step_mock_attempts (student_id, started_at DESC);

ALTER TABLE step_mock_attempts DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
