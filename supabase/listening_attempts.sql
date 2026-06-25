-- Listening test attempts (section practice + full mock tests)

create table if not exists public.listening_attempts (
  id bigint generated always as identity primary key,
  student_id text not null,
  test_id text,
  section int,
  question_type text,
  test_type text not null default 'section',
  score int not null,
  total int,
  band numeric(4, 1) not null,
  section_scores jsonb,
  answers jsonb,
  correct_answers jsonb,
  accuracy numeric(5, 2),
  time_taken_seconds int,
  timed_out boolean default false,
  completed_at timestamptz not null default now(),
  created_at timestamptz default now()
);

alter table public.listening_attempts disable row level security;

create index if not exists idx_listening_attempts_student
  on public.listening_attempts (student_id, completed_at desc);

create index if not exists idx_listening_attempts_mock
  on public.listening_attempts (student_id, test_type, completed_at desc)
  where test_type = 'mock';
