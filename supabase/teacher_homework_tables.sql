-- Teacher notes + homework (PROMPT 5) — run in Supabase SQL Editor
-- student_id / teacher_id use TEXT to match public.users.id from NextAuth

CREATE TABLE IF NOT EXISTS public.teacher_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id TEXT,
  student_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.homework (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT,
  teacher_id TEXT,
  module TEXT,
  task_description TEXT,
  due_date DATE,
  status TEXT DEFAULT 'pending',
  submission TEXT,
  teacher_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- One note row per teacher + student (for upsert in the app)
CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_notes_teacher_student
  ON public.teacher_notes (teacher_id, student_id);

CREATE INDEX IF NOT EXISTS idx_homework_student
  ON public.homework (student_id, due_date DESC);

CREATE INDEX IF NOT EXISTS idx_homework_teacher
  ON public.homework (teacher_id, created_at DESC);

-- Enables PostgREST embed: users:student_id(name, email)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'homework_student_id_fkey'
  ) THEN
    ALTER TABLE public.homework
      ADD CONSTRAINT homework_student_id_fkey
      FOREIGN KEY (student_id) REFERENCES public.users (id)
      ON DELETE SET NULL;
  END IF;
EXCEPTION
  WHEN undefined_table THEN NULL;
END $$;

ALTER TABLE public.teacher_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.homework DISABLE ROW LEVEL SECURITY;

-- Migrate legacy column name if an older teacher_notes table used "notes"
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'teacher_notes'
      AND column_name = 'notes'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'teacher_notes'
      AND column_name = 'note'
  ) THEN
    ALTER TABLE public.teacher_notes RENAME COLUMN notes TO note;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
