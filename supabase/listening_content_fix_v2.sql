-- PASTE THIS ENTIRE FILE IN SUPABASE SQL EDITOR (from line 1 to the end)
-- Fixes: column "section_number" does not exist on generated_listening_tests

-- ═══════════════════════════════════════════════════════════════
-- PART A: Fix generated_listening_tests (add missing columns FIRST)
-- ═══════════════════════════════════════════════════════════════

create table if not exists public.generated_listening_tests (
  id bigint generated always as identity primary key,
  test_number int,
  section_number int,
  transcript text,
  questions jsonb,
  used boolean default false,
  created_at timestamptz default now()
);

alter table public.generated_listening_tests
  add column if not exists test_number int;

alter table public.generated_listening_tests
  add column if not exists section_number int;

alter table public.generated_listening_tests
  add column if not exists transcript text;

alter table public.generated_listening_tests
  add column if not exists questions jsonb;

alter table public.generated_listening_tests
  add column if not exists used boolean default false;

alter table public.generated_listening_tests
  add column if not exists created_at timestamptz default now();

alter table public.generated_listening_tests
  add column if not exists content_type text default 'full_mock';

alter table public.generated_listening_tests
  add column if not exists generation_date date default current_date;

update public.generated_listening_tests
set test_number = 1
where test_number is null;

update public.generated_listening_tests
set section_number = 1
where section_number is null;

update public.generated_listening_tests
set content_type = 'full_mock'
where content_type is null;

update public.generated_listening_tests
set generation_date = current_date
where generation_date is null;

update public.generated_listening_tests
set transcript = ''
where transcript is null;

update public.generated_listening_tests
set questions = '[]'::jsonb
where questions is null;

alter table public.generated_listening_tests disable row level security;

drop index if exists idx_generated_listening_unique_daily;

create unique index idx_generated_listening_unique_daily
  on public.generated_listening_tests (
    generation_date,
    content_type,
    test_number,
    section_number
  );

-- ═══════════════════════════════════════════════════════════════
-- PART B: Fix student_mock_history
-- ═══════════════════════════════════════════════════════════════

drop table if exists public.student_mock_history cascade;

create table public.student_mock_history (
  id bigint generated always as identity primary key,
  student_id text not null,
  content_type text not null check (content_type in ('section_practice', 'full_mock')),
  test_id text not null,
  section_number int not null default 0,
  bank_row_id bigint,
  completed_at timestamptz not null default now()
);

alter table public.student_mock_history disable row level security;

create unique index idx_student_mock_history_unique
  on public.student_mock_history (student_id, content_type, test_id, section_number);

create index idx_student_mock_history_student
  on public.student_mock_history (student_id, content_type, completed_at desc);

-- ═══════════════════════════════════════════════════════════════
-- PART C: Refresh API (ignore error on this line if it fails)
-- ═══════════════════════════════════════════════════════════════

notify pgrst, 'reload schema';
