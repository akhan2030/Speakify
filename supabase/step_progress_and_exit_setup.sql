-- STEP progress history + phase exit test attempts
-- Run in Supabase SQL editor alongside step_accelerator_setup.sql

CREATE TABLE IF NOT EXISTS step_progress_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  source TEXT NOT NULL,
  phase INTEGER,
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_step_progress_history_student_date
  ON step_progress_history(student_id, recorded_at DESC);

CREATE TABLE IF NOT EXISTS step_exit_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  phase INTEGER NOT NULL,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  question_ids TEXT[] DEFAULT '{}',
  questions_snapshot JSONB,
  answers JSONB,
  reading_score INTEGER,
  structure_score INTEGER,
  listening_score INTEGER,
  compositional_score INTEGER,
  reading_raw INTEGER,
  structure_raw INTEGER,
  listening_raw INTEGER,
  compositional_raw INTEGER,
  total_score INTEGER,
  passed BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'in_progress',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_step_exit_tests_student_phase
  ON step_exit_tests(student_id, phase, submitted_at DESC);

ALTER TABLE step_progress_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE step_exit_tests DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
