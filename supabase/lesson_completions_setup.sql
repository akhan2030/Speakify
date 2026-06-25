-- Per-student lesson completion records for the English Pathway

CREATE TABLE IF NOT EXISTS public.lesson_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  lesson_id uuid NOT NULL,
  level_id text NOT NULL,
  week_number int NOT NULL,
  day_type text NOT NULL,
  score int,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_lesson_completions_student
  ON public.lesson_completions (student_id, completed_at DESC);

ALTER TABLE public.lesson_completions DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
