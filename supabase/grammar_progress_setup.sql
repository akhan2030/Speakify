-- Grammar module progress (run in Supabase SQL Editor or: npm run setup:grammar)
-- Drops legacy grammar_progress (per-lesson rows) and creates category-level progress.

drop table if exists public.grammar_progress cascade;

create table public.grammar_progress (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  category text not null,
  lessons_completed int not null default 0,
  total_lessons int not null default 6,
  exercises_completed int not null default 0,
  practice_score int,
  updated_at timestamptz not null default now(),
  unique (student_id, category)
);

create index idx_grammar_progress_student
  on public.grammar_progress (student_id);

alter table public.grammar_progress disable row level security;

notify pgrst, 'reload schema';
