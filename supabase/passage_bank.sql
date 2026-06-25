-- Passage bank + student history (run in Supabase SQL editor)

create table if not exists public.passage_bank (
  id bigint generated always as identity primary key,
  title text not null,
  content text not null,
  topic text not null,
  difficulty text default 'medium',
  question_type text not null,
  questions jsonb not null,
  answers jsonb not null,
  used_by jsonb default '[]',
  created_at timestamptz default now()
);

alter table public.passage_bank disable row level security;

create table if not exists public.student_passage_history (
  id bigint generated always as identity primary key,
  student_id text not null,
  passage_id bigint not null,
  test_type text not null,
  taken_at timestamptz default now()
);

alter table public.student_passage_history disable row level security;

create index if not exists idx_student_passage_history_student
  on public.student_passage_history (student_id);

create index if not exists idx_passage_bank_question_type
  on public.passage_bank (question_type);
