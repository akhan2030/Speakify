-- STEP Mini Mock results + in-progress attempts
-- Run in Supabase SQL editor

CREATE TABLE IF NOT EXISTS step_mini_mock_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  mock_number INTEGER NOT NULL,
  reading_score INTEGER DEFAULT 0,
  structure_score INTEGER DEFAULT 0,
  listening_score INTEGER DEFAULT 0,
  compositional_score INTEGER DEFAULT 0,
  total_score INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 20,
  estimated_step_score INTEGER,
  duration_minutes INTEGER,
  phase INTEGER DEFAULT 1,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS step_mini_mock_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  mock_number INTEGER NOT NULL,
  question_ids TEXT[] DEFAULT '{}',
  questions_snapshot JSONB,
  answers JSONB,
  reading_score INTEGER,
  structure_score INTEGER,
  listening_score INTEGER,
  compositional_score INTEGER,
  total_score INTEGER,
  estimated_step_score INTEGER,
  status TEXT DEFAULT 'in_progress',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_step_mini_mock_results_student
  ON step_mini_mock_results(student_id, completed_at DESC);

ALTER TABLE step_mini_mock_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE step_mini_mock_attempts DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
