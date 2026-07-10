-- Growth Roadmap: practice_recommendations library + student_roadmap_items
-- Run in Supabase SQL Editor after speaking_sessions_setup.sql

CREATE TABLE IF NOT EXISTS practice_recommendations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  skill TEXT NOT NULL CHECK (skill IN ('speaking', 'writing')),
  criterion TEXT NOT NULL,
  trigger_pattern TEXT NOT NULL,
  task_title TEXT NOT NULL,
  task_description TEXT NOT NULL,
  task_type TEXT NOT NULL CHECK (
    task_type IN ('drill', 'targeted_speaking_session', 'targeted_writing_prompt', 'lesson')
  ),
  estimated_band_impact DECIMAL(3,2) NOT NULL DEFAULT 0.25,
  estimated_sessions_to_resolve INTEGER NOT NULL DEFAULT 2,
  estimated_minutes INTEGER NOT NULL DEFAULT 10,
  task_href TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (skill, criterion, trigger_pattern)
);

CREATE TABLE IF NOT EXISTS student_roadmap_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  source_session_id TEXT,
  skill TEXT NOT NULL CHECK (skill IN ('speaking', 'writing')),
  criterion TEXT NOT NULL,
  trigger_pattern TEXT NOT NULL,
  practice_recommendation_id UUID REFERENCES practice_recommendations(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'in_progress', 'completed', 'resolved', 'still_present')
  ),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  last_seen_session_id TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_roadmap_student_status
  ON student_roadmap_items (student_id, status);

CREATE INDEX IF NOT EXISTS idx_roadmap_student_pattern
  ON student_roadmap_items (student_id, skill, trigger_pattern);

-- Prevent duplicate active items for the same weakness pattern per student
CREATE UNIQUE INDEX IF NOT EXISTS idx_roadmap_active_pattern
  ON student_roadmap_items (student_id, skill, trigger_pattern)
  WHERE status IN ('pending', 'in_progress', 'completed', 'still_present');
