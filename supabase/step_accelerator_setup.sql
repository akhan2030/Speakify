-- Speakify STEP Accelerator — enrollment, phases, scores, mocks, certificates
-- Run in Supabase SQL editor before using /dashboard/step/student

CREATE TABLE IF NOT EXISTS step_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL UNIQUE,
  diagnostic_score INTEGER,
  current_phase INTEGER DEFAULT 1,
  current_week INTEGER DEFAULT 1,
  estimated_score INTEGER DEFAULT 0,
  target_score INTEGER DEFAULT 80,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS step_phase_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  phase INTEGER NOT NULL,
  status TEXT DEFAULT 'locked',
  entry_score INTEGER,
  exit_score INTEGER,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  UNIQUE(student_id, phase)
);

CREATE TABLE IF NOT EXISTS step_section_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  session_date DATE DEFAULT CURRENT_DATE,
  section TEXT NOT NULL,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  estimated_score INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, session_date, section)
);

CREATE TABLE IF NOT EXISTS step_mock_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  mock_number INTEGER NOT NULL,
  mock_type TEXT DEFAULT 'full',
  reading_score INTEGER,
  structure_score INTEGER,
  listening_score INTEGER,
  compositional_score INTEGER,
  total_score INTEGER,
  duration_minutes INTEGER,
  phase INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS step_certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  certificate_type TEXT NOT NULL,
  final_score INTEGER,
  certificate_id TEXT UNIQUE,
  issued_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE step_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE step_phase_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE step_section_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE step_mock_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE step_certificates DISABLE ROW LEVEL SECURITY;

ALTER TABLE users
ADD COLUMN IF NOT EXISTS step_enrolled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS step_current_phase INTEGER DEFAULT 1;

NOTIFY pgrst, 'reload schema';
