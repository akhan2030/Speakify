-- Placement test tables (run in Supabase SQL Editor)

CREATE TABLE IF NOT EXISTS placement_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  overall_band DECIMAL(3,1),
  cefr_level TEXT,
  skill_bands JSONB,
  weak_areas TEXT[],
  strong_areas TEXT[],
  total_questions INTEGER,
  confidence_score INTEGER,
  status TEXT DEFAULT 'in_progress',
  full_name TEXT,
  email TEXT,
  phone TEXT,
  education_level TEXT,
  field_of_study TEXT,
  ielts_purpose TEXT,
  target_band_score DECIMAL(3,1),
  score_deadline TEXT
);

CREATE TABLE IF NOT EXISTS placement_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  attempt_id UUID REFERENCES placement_attempts(id),
  question_id TEXT,
  section TEXT,
  band_level DECIMAL(3,1),
  student_answer TEXT,
  correct BOOLEAN,
  time_taken INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS placement_question_bank (
  id TEXT PRIMARY KEY,
  section TEXT,
  band DECIMAL(3,1),
  type TEXT,
  question TEXT,
  options JSONB,
  correct TEXT,
  explanation TEXT,
  saudi_trap TEXT,
  topic TEXT,
  times_used INTEGER DEFAULT 0,
  correct_rate DECIMAL(4,3) DEFAULT 0
);

ALTER TABLE placement_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE placement_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE placement_question_bank DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
