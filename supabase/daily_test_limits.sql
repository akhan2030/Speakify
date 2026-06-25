-- Run this in the Supabase SQL editor for daily mock test limits.

create table if not exists public.daily_test_limits (
  id bigint generated always as identity primary key,
  student_id text not null,
  test_date date not null default current_date,
  tests_taken int default 0,
  last_test_at timestamptz,
  unique(student_id, test_date)
);

alter table public.daily_test_limits disable row level security;
