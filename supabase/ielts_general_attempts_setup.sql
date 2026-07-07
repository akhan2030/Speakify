-- IELTS General Training skill attempts + band history
-- Run in Supabase SQL Editor for GT dashboard, writing persistence, reading saves.

create table if not exists public.ielts_general_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  skill text not null,
  band_score numeric(3, 1),
  accuracy numeric(5, 4),
  letter_type text,
  status text default 'completed',
  mock_number int,
  completed_at timestamptz not null default now()
);

create index if not exists idx_ielts_general_attempts_student
  on public.ielts_general_attempts (student_id, completed_at desc);

create index if not exists idx_ielts_general_attempts_letter
  on public.ielts_general_attempts (student_id, letter_type)
  where letter_type is not null;

create table if not exists public.ielts_general_student_history (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  skill text not null,
  band_score numeric(3, 1),
  recorded_at timestamptz not null default now()
);

create index if not exists idx_ielts_general_history_student
  on public.ielts_general_student_history (student_id, recorded_at desc);

alter table public.ielts_general_attempts disable row level security;
alter table public.ielts_general_student_history disable row level security;

notify pgrst, 'reload schema';
