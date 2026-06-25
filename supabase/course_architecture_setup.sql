-- Course architecture: levels → units → lessons → exercises
-- Run after placement_setup.sql and users_registration_setup.sql

CREATE TABLE IF NOT EXISTS course_levels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  min_band DECIMAL(3,1) DEFAULT 0,
  max_band DECIMAL(3,1) DEFAULT 9,
  cefr_level TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID NOT NULL REFERENCES course_levels(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  UNIQUE (level_id, slug)
);

CREATE TABLE IF NOT EXISTS course_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES course_units(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  skill TEXT,
  estimated_minutes INTEGER DEFAULT 45,
  sort_order INTEGER DEFAULT 0,
  UNIQUE (unit_id, slug)
);

CREATE TABLE IF NOT EXISTS course_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  exercise_type TEXT DEFAULT 'practice',
  sort_order INTEGER DEFAULT 0,
  UNIQUE (lesson_id, slug)
);

CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  level_id UUID NOT NULL REFERENCES course_levels(id),
  placement_attempt_id UUID REFERENCES placement_attempts(id),
  status TEXT DEFAULT 'active',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  recommended_from_band DECIMAL(3,1),
  target_band DECIMAL(3,1),
  UNIQUE (student_id, level_id)
);

CREATE TABLE IF NOT EXISTS student_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES course_exercises(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'not_started',
  score DECIMAL(4,1),
  attempts INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, lesson_id, exercise_id)
);

CREATE TABLE IF NOT EXISTS level_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  level_id UUID NOT NULL REFERENCES course_levels(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  band_score DECIMAL(3,1),
  source TEXT DEFAULT 'activity',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, level_id, skill)
);

CREATE TABLE IF NOT EXISTS certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  level_id UUID REFERENCES course_levels(id),
  certificate_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  placement_band DECIMAL(3,1),
  target_band DECIMAL(3,1),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_student ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_level_scores_student ON level_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);

ALTER TABLE course_levels DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_units DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_lessons DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments DISABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE level_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE certificates DISABLE ROW LEVEL SECURITY;

-- Seed IELTS pathway levels (idempotent via slug)
INSERT INTO course_levels (slug, name, description, min_band, max_band, cefr_level, sort_order)
VALUES
  ('foundations', 'Speakify Foundations', 'Build core vocabulary, basic grammar, and short reading skills before full IELTS prep.', 0, 4.5, 'A2', 1),
  ('bridge', 'Speakify IELTS Bridge', 'Strengthen academic vocabulary, tense control, and Task 1/2 foundations toward band 5.5–6.0.', 4.5, 5.5, 'B1', 2),
  ('core', 'Speakify IELTS Core', 'Target band 6.0–6.5 with integrated reading, writing, listening, and speaking fluency.', 5.5, 6.5, 'B2', 3),
  ('advanced', 'Speakify IELTS Advanced', 'Refine coherence, lexical precision, and complex grammar for band 7.0+.', 6.5, 7.5, 'C1', 4),
  ('mastery', 'Speakify IELTS Mastery', 'Polish nuance, academic argument, and high-stakes exam strategy for band 7.5–8.0+.', 7.5, 9, 'C2', 5)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  min_band = EXCLUDED.min_band,
  max_band = EXCLUDED.max_band,
  cefr_level = EXCLUDED.cefr_level,
  sort_order = EXCLUDED.sort_order;

-- Seed units + lessons for each level (sample curriculum skeleton)
DO $$
DECLARE
  lvl RECORD;
  unit_id UUID;
BEGIN
  FOR lvl IN SELECT id, slug FROM course_levels LOOP
    INSERT INTO course_units (level_id, slug, title, description, sort_order)
    VALUES (lvl.id, 'unit-1', 'Diagnostic & Foundations', 'Baseline skills and goal setting', 1)
    ON CONFLICT (level_id, slug) DO NOTHING;

    SELECT id INTO unit_id FROM course_units WHERE level_id = lvl.id AND slug = 'unit-1';

    IF unit_id IS NOT NULL THEN
      INSERT INTO course_lessons (unit_id, slug, title, skill, estimated_minutes, sort_order)
      VALUES
        (unit_id, 'welcome', 'Welcome & Study Plan', 'general', 30, 1),
        (unit_id, 'vocab-boost', 'Academic Vocabulary Sprint', 'vocabulary', 45, 2),
        (unit_id, 'grammar-core', 'Grammar Accuracy Lab', 'grammar', 45, 3),
        (unit_id, 'reading-skills', 'Reading Strategies', 'reading', 45, 4),
        (unit_id, 'writing-task1', 'Writing Task 1 Foundations', 'writing', 60, 5),
        (unit_id, 'listening-drills', 'Listening Prediction Drills', 'listening', 45, 6),
        (unit_id, 'speaking-fluency', 'Speaking Fluency Builder', 'speaking', 45, 7)
      ON CONFLICT (unit_id, slug) DO NOTHING;
    END IF;

    INSERT INTO course_units (level_id, slug, title, description, sort_order)
    VALUES (lvl.id, 'unit-2', 'Exam Integration', 'Timed practice and mock sections', 2)
    ON CONFLICT (level_id, slug) DO NOTHING;

    SELECT id INTO unit_id FROM course_units WHERE level_id = lvl.id AND slug = 'unit-2';

    IF unit_id IS NOT NULL THEN
      INSERT INTO course_lessons (unit_id, slug, title, skill, estimated_minutes, sort_order)
      VALUES
        (unit_id, 'mini-mock', 'Mini Mock Test', 'general', 90, 1),
        (unit_id, 'error-log', 'Personal Error Log Review', 'general', 30, 2),
        (unit_id, 'weak-skill', 'Weak-Skill Intensive', 'general', 60, 3)
      ON CONFLICT (unit_id, slug) DO NOTHING;
    END IF;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
