-- Run this ENTIRE file in Supabase SQL Editor (Ctrl+A in this file, Ctrl+C, paste, Run)
-- NOT the filename — copy the SQL lines below only.
-- If you get "section_number does not exist", run listening_content_fix.sql instead.

-- 1) Content bank (two pools: section_practice + full_mock)
create table if not exists public.generated_listening_tests (
  id bigint generated always as identity primary key,
  content_type text not null default 'full_mock',
  generation_date date not null default current_date,
  test_number int not null check (test_number >= 1 and test_number <= 5),
  section_number int not null check (section_number >= 1 and section_number <= 4),
  transcript text not null,
  questions jsonb not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.generated_listening_tests
  add column if not exists content_type text not null default 'full_mock';

alter table public.generated_listening_tests
  add column if not exists generation_date date not null default current_date;

alter table public.generated_listening_tests disable row level security;

create unique index if not exists idx_generated_listening_unique_daily
  on public.generated_listening_tests (
    generation_date,
    content_type,
    test_number,
    section_number
  );

-- 2) Per-student history (which banked tests they already used)
create table if not exists public.student_mock_history (
  id bigint generated always as identity primary key,
  student_id text not null,
  content_type text not null check (content_type in ('section_practice', 'full_mock')),
  test_id text not null,
  section_number int not null default 0,
  bank_row_id bigint references public.generated_listening_tests (id) on delete set null,
  completed_at timestamptz not null default now()
);

alter table public.student_mock_history disable row level security;

create unique index if not exists idx_student_mock_history_unique
  on public.student_mock_history (student_id, content_type, test_id, section_number);

create index if not exists idx_student_mock_history_student
  on public.student_mock_history (student_id, content_type, completed_at desc);

-- 3) Reload PostgREST schema cache (Supabase API)
notify pgrst, 'reload schema';
