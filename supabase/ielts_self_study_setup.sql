-- IELTS Self-Study LMS — Session 1 schema
-- Run in Supabase SQL editor

ALTER TABLE users
ADD COLUMN IF NOT EXISTS ielts_exam_date DATE,
ADD COLUMN IF NOT EXISTS study_days_per_week INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS preferred_study_time TEXT DEFAULT 'evening',
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS daily_task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  task_type TEXT,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  time_spent_minutes INTEGER,
  score DECIMAL,
  week_number INTEGER,
  day_of_week TEXT,
  UNIQUE(student_id, task_id)
);

CREATE TABLE IF NOT EXISTS study_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT UNIQUE NOT NULL,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  total_study_days INTEGER DEFAULT 0,
  total_hours DECIMAL DEFAULT 0,
  total_tasks_completed INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  achievement_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS band_score_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  band_score DECIMAL NOT NULL,
  source TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_task_completions_student
  ON daily_task_completions(student_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_band_score_history_student
  ON band_score_history(student_id, recorded_at DESC);

ALTER TABLE daily_task_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE study_streaks DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE band_score_history DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';

-- Patch existing study_streaks tables
ALTER TABLE study_streaks
ADD COLUMN IF NOT EXISTS total_tasks_completed INTEGER DEFAULT 0;

ALTER TABLE study_streaks
ALTER COLUMN student_id SET NOT NULL;
