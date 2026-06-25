-- Student vocabulary progress (spaced repetition) — run in Supabase SQL Editor

create table if not exists public.student_vocab_progress (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  word_id uuid not null references public.vocabulary_words (id) on delete cascade,
  cefr_level text not null,
  next_review date not null default current_date,
  interval_days int not null default 0,
  ease_factor numeric(4, 2) not null default 2.5,
  repetitions int not null default 0,
  last_rating text,
  last_studied_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (student_id, word_id)
);

create index if not exists idx_student_vocab_progress_student_review
  on public.student_vocab_progress (student_id, next_review);

create index if not exists idx_student_vocab_progress_student_studied
  on public.student_vocab_progress (student_id, last_studied_at desc);

alter table public.student_vocab_progress disable row level security;

notify pgrst, 'reload schema';
