-- Speakify In-Person Classroom Textbook System
-- Idempotent schema for levels, units, lessons, quizzes, classes, progress.
-- Apply in Supabase SQL Editor (or via migration runner).

-- ---------------------------------------------------------------------------
-- Tag in-person vs self-study students
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS student_type text DEFAULT 'self_study';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_student_type_check'
  ) THEN
    ALTER TABLE public.users
      ADD CONSTRAINT users_student_type_check
      CHECK (student_type IN ('self_study', 'in_person'));
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Levels (13 micro-CEFR)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classroom_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  order_index int NOT NULL,
  target_weeks int NOT NULL,
  next_level_code text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Units
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classroom_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id uuid NOT NULL REFERENCES public.classroom_levels(id) ON DELETE CASCADE,
  unit_number int NOT NULL,
  slug text NOT NULL,
  title text NOT NULL,
  theme text,
  grammar_point_1 text,
  grammar_point_2 text,
  objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (level_id, unit_number),
  UNIQUE (level_id, slug)
);

CREATE INDEX IF NOT EXISTS classroom_units_level_idx
  ON public.classroom_units (level_id, unit_number);

-- ---------------------------------------------------------------------------
-- Lessons (per unit: main lessons + extras + quiz slot)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classroom_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.classroom_units(id) ON DELETE CASCADE,
  lesson_number int NOT NULL,
  title text NOT NULL,
  type text NOT NULL
    CHECK (type IN ('lesson', 'extra_activities', 'quiz')),
  UNIQUE (unit_id, lesson_number)
);

CREATE INDEX IF NOT EXISTS classroom_lessons_unit_idx
  ON public.classroom_lessons (unit_id, lesson_number);

-- ---------------------------------------------------------------------------
-- Sections (rich content blocks inside a lesson)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classroom_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.classroom_lessons(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  order_index int NOT NULL DEFAULT 0,
  content jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS classroom_sections_lesson_idx
  ON public.classroom_sections (lesson_id, order_index);

-- ---------------------------------------------------------------------------
-- Quizzes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classroom_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.classroom_units(id) ON DELETE CASCADE,
  title text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (unit_id)
);

CREATE INDEX IF NOT EXISTS classroom_quizzes_unit_idx
  ON public.classroom_quizzes (unit_id);

CREATE TABLE IF NOT EXISTS public.classroom_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_id uuid NOT NULL REFERENCES public.classroom_quizzes(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  max_score int NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS classroom_quiz_attempts_student_idx
  ON public.classroom_quiz_attempts (student_id, completed_at DESC);

-- ---------------------------------------------------------------------------
-- Classes & roster
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classroom_classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  level_id uuid NOT NULL REFERENCES public.classroom_levels(id),
  teacher_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  schedule text
);

CREATE TABLE IF NOT EXISTS public.classroom_class_students (
  class_id uuid NOT NULL REFERENCES public.classroom_classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  PRIMARY KEY (class_id, student_id)
);

-- ---------------------------------------------------------------------------
-- Progress & attendance
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classroom_student_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  unit_id uuid NOT NULL REFERENCES public.classroom_units(id) ON DELETE CASCADE,
  lesson_number int NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, unit_id, lesson_number)
);

CREATE INDEX IF NOT EXISTS classroom_student_progress_student_idx
  ON public.classroom_student_progress (student_id, unit_id);

CREATE TABLE IF NOT EXISTS public.classroom_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classroom_classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date date NOT NULL,
  present boolean NOT NULL DEFAULT true,
  UNIQUE (class_id, student_id, date)
);

CREATE INDEX IF NOT EXISTS classroom_attendance_class_date_idx
  ON public.classroom_attendance (class_id, date);

-- ---------------------------------------------------------------------------
-- Media library
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.classroom_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  filename text NOT NULL,
  url text NOT NULL,
  media_type text NOT NULL,
  labels jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Seed 13 micro-CEFR levels
-- ---------------------------------------------------------------------------
INSERT INTO public.classroom_levels (code, name, order_index, target_weeks, next_level_code)
VALUES
  ('AB',   'Absolute Beginner',      1,  6,  'A1.1'),
  ('A1.1', 'Beginner 1',             2,  6,  'A1.2'),
  ('A1.2', 'Beginner 2',             3,  6,  'A2.1'),
  ('A2.1', 'Elementary 1',           4,  7,  'A2.2'),
  ('A2.2', 'Elementary 2',           5,  7,  'B1.1'),
  ('B1.1', 'Pre-Intermediate 1',     6,  8,  'B1.2'),
  ('B1.2', 'Pre-Intermediate 2',     7,  8,  'B2.1'),
  ('B2.1', 'Intermediate 1',         8,  8,  'B2.2'),
  ('B2.2', 'Intermediate 2',         9,  9,  'C1.1'),
  ('C1.1', 'Upper-Intermediate 1',  10,  9,  'C1.2'),
  ('C1.2', 'Upper-Intermediate 2',  11,  9,  'C2.1'),
  ('C2.1', 'Advanced 1',            12, 10,  'C2.2'),
  ('C2.2', 'Advanced 2',            13, 10,  NULL)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  order_index = EXCLUDED.order_index,
  target_weeks = EXCLUDED.target_weeks,
  next_level_code = EXCLUDED.next_level_code;

NOTIFY pgrst, 'reload schema';
