-- IELTS program tracks: Foundation (6wk), Plus (6wk), Elite (4wk)
-- Run after course_architecture_setup.sql and course_cefr_levels_setup.sql

INSERT INTO course_levels (slug, name, description, cefr_level, cefr_sub_level, week_count, track_type, sort_order, min_band, max_band)
VALUES
  ('foundation', 'Speakify Foundation Track', '6-week core build: vocabulary, grammar foundations, and basic IELTS skills for bands below 5.5.', 'A2-B1', 'Foundation', 6, 'program', 1, 0, 5.5),
  ('plus', 'Speakify Plus Track', '6-week intermediate IELTS prep: essay structure, listening strategies, and speaking fluency for bands 5.5–7.0.', 'B1-B2', 'Plus', 6, 'program', 2, 5.5, 7.0),
  ('elite', 'Speakify Elite Track', '4-week intensive accelerator: timed tasks, advanced writing, and mock sections for bands 7.0+.', 'C1', 'Elite', 4, 'program', 3, 7.0, 9.0)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  cefr_level = EXCLUDED.cefr_level,
  cefr_sub_level = EXCLUDED.cefr_sub_level,
  week_count = EXCLUDED.week_count,
  track_type = EXCLUDED.track_type,
  sort_order = EXCLUDED.sort_order,
  min_band = EXCLUDED.min_band,
  max_band = EXCLUDED.max_band;

DO $$
DECLARE
  lvl RECORD;
  unit_id UUID;
  w INTEGER;
  mid_week INTEGER;
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
  FOR lvl IN
    SELECT id, slug, week_count, cefr_sub_level, name
    FROM course_levels
    WHERE track_type = 'program'
  LOOP
    mid_week := FLOOR(lvl.week_count / 2);

    FOR w IN 1..lvl.week_count LOOP
      INSERT INTO course_units (level_id, slug, title, description, week_number, unit_type, sort_order)
      VALUES (
        lvl.id,
        'week-' || w,
        'Week ' || w || ' — ' || lvl.cefr_sub_level,
        'Weekly unit ' || w || ' for ' || lvl.name,
        w,
        'weekly',
        w
      )
      ON CONFLICT (level_id, slug) DO UPDATE SET
        week_number = EXCLUDED.week_number,
        title = EXCLUDED.title,
        description = EXCLUDED.description;

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
      (
        lvl.id,
        'mid_level',
        lvl.cefr_sub_level || ' Mid-Level Check',
        'Covers Weeks 1–' || mid_week || '. Pass to unlock Weeks ' || (mid_week + 1) || '–' || lvl.week_count || '.',
        70,
        1
      ),
      (
        lvl.id,
        'graduation',
        lvl.cefr_sub_level || ' Graduation Exam',
        'Full track assessment. Pass to earn your certificate and advance.',
        75,
        2
      )
    ON CONFLICT (level_id, assessment_type) DO UPDATE SET
      title = EXCLUDED.title,
      description = EXCLUDED.description;
  END LOOP;
END $$;

NOTIFY pgrst, 'reload schema';
