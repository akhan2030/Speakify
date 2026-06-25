-- Writing essay attempts (for teacher profile history) — run in Supabase SQL Editor

create table if not exists public.writing_attempts (
  id bigint generated always as identity primary key,
  student_id text not null,
  task_type text not null,
  essay_text text not null,
  evaluation_text text,
  band_overall numeric(3, 1),
  band_ta numeric(3, 1),
  band_cc numeric(3, 1),
  band_lr numeric(3, 1),
  band_gra numeric(3, 1),
  created_at timestamptz not null default now()
);

create index if not exists idx_writing_attempts_student
  on public.writing_attempts (student_id, created_at desc);

alter table public.writing_attempts disable row level security;

notify pgrst, 'reload schema';
