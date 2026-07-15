-- Speakify In-Person Classroom Textbook System
-- Separate from self-study LMS (/dashboard). Apply in Supabase SQL Editor.

-- ---------------------------------------------------------------------------
-- Levels (13 micro-CEFR)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classroom_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  sort_order integer NOT NULL,
  duration_weeks integer NOT NULL DEFAULT 6,
  target_profile text NOT NULL DEFAULT '',
  next_level_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Units
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classroom_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL REFERENCES public.classroom_levels(id) ON DELETE CASCADE,
  unit_number integer NOT NULL CHECK (unit_number BETWEEN 1 AND 8),
  theme text NOT NULL,
  grammar_focus text NOT NULL DEFAULT '',
  learning_objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  estimated_hours numeric(4,1) DEFAULT 6,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (level_id, unit_number)
);

CREATE INDEX IF NOT EXISTS classroom_units_level_idx
  ON public.classroom_units (level_id, unit_number);

-- ---------------------------------------------------------------------------
-- Unit sections (warm-up, reading, vocab, grammar, listening, speaking,
-- writing, quiz, cultural bridge, reflection, etc.)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classroom_unit_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.classroom_units(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  title text NOT NULL DEFAULT '',
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  audio_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unit_id, section_type)
);

CREATE INDEX IF NOT EXISTS classroom_unit_sections_unit_idx
  ON public.classroom_unit_sections (unit_id, sort_order);

-- ---------------------------------------------------------------------------
-- Quizzes (end-of-unit + end-of-level)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classroom_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid REFERENCES public.classroom_levels(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.classroom_units(id) ON DELETE CASCADE,
  quiz_type text NOT NULL CHECK (quiz_type IN ('end_of_unit', 'end_of_level')),
  title text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  pass_score integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS classroom_quizzes_unit_idx
  ON public.classroom_quizzes (unit_id);

-- ---------------------------------------------------------------------------
-- Class groups (whole class at one CEFR micro-level)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classroom_class_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level_id uuid NOT NULL REFERENCES public.classroom_levels(id),
  teacher_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  campus text DEFAULT '',
  schedule_note text DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classroom_class_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_group_id uuid NOT NULL REFERENCES public.classroom_class_groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (class_group_id, user_id)
);

CREATE INDEX IF NOT EXISTS classroom_class_members_user_idx
  ON public.classroom_class_members (user_id);

-- ---------------------------------------------------------------------------
-- Progress, quizzes, homework, reflection
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classroom_unit_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_group_id uuid NOT NULL REFERENCES public.classroom_class_groups(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.classroom_units(id) ON DELETE CASCADE,
  completed_at timestamptz,
  marked_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  UNIQUE (class_group_id, unit_id)
);

CREATE TABLE IF NOT EXISTS public.classroom_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL REFERENCES public.classroom_quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  class_group_id uuid REFERENCES public.classroom_class_groups(id) ON DELETE SET NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  score integer NOT NULL DEFAULT 0,
  max_score integer NOT NULL DEFAULT 15,
  submitted_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS classroom_quiz_attempts_user_idx
  ON public.classroom_quiz_attempts (user_id, quiz_id);

CREATE TABLE IF NOT EXISTS public.classroom_homework (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_group_id uuid NOT NULL REFERENCES public.classroom_class_groups(id) ON DELETE CASCADE,
  unit_id uuid REFERENCES public.classroom_units(id) ON DELETE SET NULL,
  title text NOT NULL,
  instructions text NOT NULL DEFAULT '',
  pages_note text DEFAULT '',
  due_at timestamptz,
  assigned_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classroom_self_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.classroom_units(id) ON DELETE CASCADE,
  speaking integer CHECK (speaking BETWEEN 1 AND 5),
  reading integer CHECK (reading BETWEEN 1 AND 5),
  writing integer CHECK (writing BETWEEN 1 AND 5),
  listening integer CHECK (listening BETWEEN 1 AND 5),
  note text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, unit_id)
);

CREATE TABLE IF NOT EXISTS public.classroom_advancement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_level_id uuid NOT NULL REFERENCES public.classroom_levels(id),
  to_level_id uuid NOT NULL REFERENCES public.classroom_levels(id),
  end_of_level_score integer,
  teacher_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at timestamptz NOT NULL DEFAULT now(),
  note text DEFAULT ''
);

-- Tag in-person students (same login; different experience)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS classroom_student boolean NOT NULL DEFAULT false;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS classroom_level_code text;

-- ---------------------------------------------------------------------------
-- Seed 13 micro-CEFR levels
-- ---------------------------------------------------------------------------
INSERT INTO public.classroom_levels (code, name, sort_order, duration_weeks, target_profile, next_level_code)
VALUES
  ('AB', 'Absolute Beginner', 1, 6, 'Zero English, Arabic-only background', 'A1.1'),
  ('A1.1', 'Beginner 1', 2, 6, 'Knows alphabet, basic greetings', 'A1.2'),
  ('A1.2', 'Beginner 2', 3, 6, 'Simple words, basic sentences', 'A2.1'),
  ('A2.1', 'Elementary 1', 4, 7, 'Everyday survival English', 'A2.2'),
  ('A2.2', 'Elementary 2', 5, 7, 'Simple conversations, present/past', 'B1.1'),
  ('B1.1', 'Pre-Intermediate 1', 6, 8, 'Clear communication on familiar topics', 'B1.2'),
  ('B1.2', 'Pre-Intermediate 2', 7, 8, 'Extended communication, opinions', 'B2.1'),
  ('B2.1', 'Intermediate 1', 8, 8, 'Fluent on wide range of topics', 'B2.2'),
  ('B2.2', 'Intermediate 2', 9, 9, 'Academic and professional English', 'C1.1'),
  ('C1.1', 'Upper-Intermediate 1', 10, 9, 'Complex ideas, flexible language', 'C1.2'),
  ('C1.2', 'Upper-Intermediate 2', 11, 9, 'Near-professional mastery', 'C2.1'),
  ('C2.1', 'Advanced 1', 12, 10, 'Near-native, nuanced expression', 'C2.2'),
  ('C2.2', 'Advanced 2', 13, 10, 'Full mastery, academic/literary English', NULL)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  duration_weeks = EXCLUDED.duration_weeks,
  target_profile = EXCLUDED.target_profile,
  next_level_code = EXCLUDED.next_level_code,
  updated_at = now();

NOTIFY pgrst, 'reload schema';
