-- Daily pre-generated IELTS Reading mock tests (run in Supabase SQL editor)

create table if not exists public.generated_mock_tests (
  id bigint generated always as identity primary key,
  test_number int not null,
  generation_date date not null,
  passage_1 jsonb not null,
  passage_2 jsonb not null,
  passage_3 jsonb not null,
  total_questions int not null default 40,
  topics text[] not null default '{}',
  is_available boolean not null default true,
  times_used int not null default 0,
  created_at timestamptz default now(),
  unique (generation_date, test_number)
);

alter table public.generated_mock_tests disable row level security;

create index if not exists idx_generated_mock_tests_date
  on public.generated_mock_tests (generation_date);
