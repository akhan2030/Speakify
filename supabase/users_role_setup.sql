-- Role column on public.users: admin | teacher | student (default student)
-- Run in Supabase SQL Editor after users table exists.

-- Ensure role column exists with default
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS role text;

-- Backfill null / empty values before NOT NULL + constraint
UPDATE public.users
SET role = 'student'
WHERE role IS NULL
   OR trim(role) = '';

-- Normalize legacy values to allowed set
UPDATE public.users
SET role = CASE lower(trim(role))
  WHEN 'admin' THEN 'admin'
  WHEN 'teacher' THEN 'teacher'
  WHEN 'student' THEN 'student'
  ELSE 'student'
END;

ALTER TABLE public.users
  ALTER COLUMN role SET DEFAULT 'student';

ALTER TABLE public.users
  ALTER COLUMN role SET NOT NULL;

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'teacher', 'student'));

COMMENT ON COLUMN public.users.role IS 'Account role: admin, teacher, or student';

NOTIFY pgrst, 'reload schema';
