-- FIX: Run this ENTIRE script in Supabase SQL Editor (replaces broken setup)
-- Safe to re-run. Fixes: column "section_number" does not exist

-- ─── Step 1: Fix student_mock_history (drop broken table, recreate) ───
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

-- Optional FK (only if generated_listening_tests exists)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'generated_listening_tests'
  ) then
    alter table public.student_mock_history
      drop constraint if exists student_mock_history_bank_row_id_fkey;
    alter table public.student_mock_history
      add constraint student_mock_history_bank_row_id_fkey
      foreign key (bank_row_id) references public.generated_listening_tests (id) on delete set null;
  end if;
end $$;

-- ─── Step 2: Ensure content bank columns exist ───
create table if not exists public.generated_listening_tests (
  id bigint generated always as identity primary key,
  content_type text not null default 'full_mock',
  generation_date date not null default current_date,
  test_number int not null,
  section_number int not null,
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

-- ─── Step 3: Refresh API ───
notify pgrst, 'reload schema';
