-- Speaking module tables (run in Supabase SQL editor)

create table if not exists public.speaking_attempts (
  id bigint generated always as identity primary key,
  student_id text not null,
  part text not null,
  task_type text not null,
  question_text text,
  transcript text,
  duration_seconds int default 0,
  topic text,
  band_fc numeric(3,1),
  band_lr numeric(3,1),
  band_gra numeric(3,1),
  band_p numeric(3,1),
  band_overall numeric(3,1),
  feedback jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists public.speaking_tracker (
  id bigint generated always as identity primary key,
  student_id text not null,
  tracker_key text not null default 'part1_overall',
  attempts int default 0,
  band_fc numeric(3,1),
  band_lr numeric(3,1),
  band_gra numeric(3,1),
  band_p numeric(3,1),
  band_overall numeric(3,1),
  updated_at timestamptz default now(),
  unique (student_id, tracker_key)
);

create table if not exists public.speaking_daily_limits (
  id bigint generated always as identity primary key,
  student_id text not null,
  test_date date not null,
  part1_sessions_taken int default 0,
  part2_sessions_taken int default 0,
  part3_sessions_taken int default 0,
  mock_tests_taken int default 0,
  last_test_at timestamptz,
  unique (student_id, test_date)
);

alter table public.speaking_attempts disable row level security;
alter table public.speaking_tracker disable row level security;
alter table public.speaking_daily_limits disable row level security;
