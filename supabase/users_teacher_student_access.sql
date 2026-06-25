-- Optional: allow teachers to switch to student dashboard
-- Run in Supabase SQL Editor, then set student_access = true for specific teachers

alter table public.users
  add column if not exists student_access boolean not null default false;

notify pgrst, 'reload schema';
