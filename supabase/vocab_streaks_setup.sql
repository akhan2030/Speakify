-- Vocabulary streak tracking per student (run in Supabase SQL Editor)

create table if not exists public.vocab_streaks (
  student_id text primary key,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_study_date date,
  updated_at timestamptz not null default now()
);

create index if not exists idx_vocab_streaks_updated
  on public.vocab_streaks (updated_at desc);

alter table public.vocab_streaks disable row level security;

notify pgrst, 'reload schema';
