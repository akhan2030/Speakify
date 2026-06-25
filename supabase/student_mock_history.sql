-- Per-student history: which banked listening content they have already used

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
