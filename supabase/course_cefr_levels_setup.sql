-- CEFR sub-levels A1.1 → C1.2 with weekly units, assessments, 70/30 progression
-- Run after course_architecture_setup.sql

ALTER TABLE course_levels ADD COLUMN IF NOT EXISTS cefr_sub_level TEXT;
ALTER TABLE course_levels ADD COLUMN IF NOT EXISTS week_count INTEGER DEFAULT 4;
ALTER TABLE course_levels ADD COLUMN IF NOT EXISTS track_type TEXT DEFAULT 'cefr';

ALTER TABLE course_units ADD COLUMN IF NOT EXISTS week_number INTEGER;
ALTER TABLE course_units ADD COLUMN IF NOT EXISTS unit_type TEXT DEFAULT 'weekly';

ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'new';
ALTER TABLE course_lessons ADD COLUMN IF NOT EXISTS progression_weight INTEGER DEFAULT 30;

CREATE TABLE IF NOT EXISTS course_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level_id UUID NOT NULL REFERENCES course_levels(id) ON DELETE CASCADE,
  assessment_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  pass_score DECIMAL(4,1) DEFAULT 70,
  max_score DECIMAL(4,1) DEFAULT 100,
  sort_order INTEGER DEFAULT 0,
  UNIQUE (level_id, assessment_type)
);

CREATE TABLE IF NOT EXISTS assessment_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  assessment_id UUID NOT NULL REFERENCES course_assessments(id) ON DELETE CASCADE,
  score DECIMAL(4,1),
  passed BOOLEAN DEFAULT FALSE,
  answers JSONB DEFAULT '{}'::jsonb,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_course_assessments_level ON course_assessments(level_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student ON assessment_attempts(student_id);

ALTER TABLE course_assessments DISABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts DISABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS idx_course_levels_cefr_sub
  ON course_levels (cefr_sub_level)
  WHERE cefr_sub_level IS NOT NULL;

-- Seed CEFR sub-levels A1.1 through C1.2
INSERT INTO course_levels (slug, name, description, cefr_level, cefr_sub_level, week_count, track_type, sort_order, min_band, max_band)
VALUES
  ('a1-1', 'A1.1 — Beginner Start', 'First steps: greetings, basic vocabulary, present simple.', 'A1', 'A1.1', 4, 'cefr', 10, 0, 3.5),
  ('a1-2', 'A1.2 — Beginner Plus', 'Daily routines, questions, and simple conversations.', 'A1', 'A1.2', 4, 'cefr', 11, 3.0, 4.0),
  ('a2-1', 'A2.1 — Elementary Core', 'Past tenses, shopping, travel basics.', 'A2', 'A2.1', 4, 'cefr', 12, 3.5, 4.5),
  ('a2-2', 'A2.2 — Elementary Plus', 'Future forms, opinions, and short paragraphs.', 'A2', 'A2.2', 4, 'cefr', 13, 4.0, 5.0),
  ('b1-1', 'B1.1 — Intermediate Core', 'Academic vocabulary, complex sentences, IELTS foundations.', 'B1', 'B1.1', 4, 'cefr', 14, 4.5, 5.5),
  ('b1-2', 'B1.2 — Intermediate Plus', 'Essay structure, listening strategies, fluency drills.', 'B1', 'B1.2', 4, 'cefr', 15, 5.0, 6.0),
  ('b2-1', 'B2.1 — Upper-Intermediate Core', 'Coherence, argument essays, advanced reading.', 'B2', 'B2.1', 4, 'cefr', 16, 5.5, 6.5),
  ('b2-2', 'B2.2 — Upper-Intermediate Plus', 'Timed tasks, collocation, mock sections.', 'B2', 'B2.2', 4, 'cefr', 17, 6.0, 7.0),
  ('c1-1', 'C1.1 — Advanced Core', 'Nuanced grammar, academic writing, band 7+ skills.', 'C1', 'C1.1', 4, 'cefr', 18, 6.5, 7.5),
  ('c1-2', 'C1.2 — Advanced Mastery', 'Exam polish, high-stakes strategy, graduation ready.', 'C1', 'C1.2', 4, 'cefr', 19, 7.0, 9.0)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cefr_level = EXCLUDED.cefr_level,
  cefr_sub_level = EXCLUDED.cefr_sub_level,
  week_count = EXCLUDED.week_count,
  track_type = EXCLUDED.track_type,
  sort_order = EXCLUDED.sort_order;

-- Weekly units + 70/30 lessons + assessments for each CEFR level
DO $$
DECLARE
  lvl RECORD;
  unit_id UUID;
  w INTEGER;
  lesson_titles TEXT[] := ARRAY[
    'Review: Vocabulary Recap',
    'Review: Grammar Consolidation',
    'Review: Listening Replay',
    'Review: Reading Reinforcement',
    'Review: Speaking Patterns',
    'Review: Writing Corrections',
    'Review: Mixed Skills Drill',
    'New: Core Concept Introduction',
    'New: Applied Practice',
    'New: Challenge Task'
  ];
  lesson_types TEXT[] := ARRAY[
    'review','review','review','review','review','review','review','new','new','new'
  ];
  lesson_weights INT[] := ARRAY[10,10,10,10,10,10,10,10,10,10];
  lesson_skills TEXT[] := ARRAY[
    'vocabulary','grammar','listening','reading','speaking','writing','general',
    'vocabulary','grammar','general'
  ];
  i INTEGER;
BEGIN
  FOR lvl IN SELECT id, slug, cefr_sub_level FROM course_levels WHERE track_type = 'cefr' LOOP
    FOR w IN 1..4 LOOP
      INSERT INTO course_units (level_id, slug, title, description, week_number, unit_type, sort_order)
      VALUES (
        lvl.id,
        'week-' || w,
        'Week ' || w || ' — ' || lvl.cefr_sub_level,
        'Weekly unit ' || w || ' for ' || lvl.cefr_sub_level,
        w,
        'weekly',
        w
      )
      ON CONFLICT (level_id, slug) DO UPDATE SET
        week_number = EXCLUDED.week_number,
        title = EXCLUDED.title;

      SELECT id INTO unit_id FROM course_units WHERE level_id = lvl.id AND slug = 'week-' || w;

      IF unit_id IS NOT NULL THEN
        FOR i IN 1..10 LOOP
          INSERT INTO course_lessons (unit_id, slug, title, skill, estimated_minutes, sort_order, content_type, progression_weight)
          VALUES (
            unit_id,
            'lesson-' || i,
            lesson_titles[i],
            lesson_skills[i],
            CASE WHEN lesson_types[i] = 'review' THEN 30 ELSE 45 END,
            i,
            lesson_types[i],
            lesson_weights[i]
          )
          ON CONFLICT (unit_id, slug) DO UPDATE SET
            content_type = EXCLUDED.content_type,
            progression_weight = EXCLUDED.progression_weight;
        END LOOP;
      END IF;
    END LOOP;

    INSERT INTO course_assessments (level_id, assessment_type, title, description, pass_score, sort_order)
    VALUES
      (lvl.id, 'mid_level', lvl.cefr_sub_level || ' Mid-Level Check', 'Covers Weeks 1–2. Pass to unlock Week 3 new content.', 70, 1),
      (lvl.id, 'graduation', lvl.cefr_sub_level || ' Graduation Exam', 'Full level assessment. Pass to earn your certificate.', 75, 2)
    ON CONFLICT (level_id, assessment_type) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
