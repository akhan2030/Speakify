-- Student pathway progress across CEFR sub-levels (run in Supabase SQL Editor)

create table if not exists public.student_level_progress (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  level_id uuid not null references public.course_levels(id) on delete cascade,
  status text not null default 'locked',
  current_week integer default 1,
  overall_score numeric(5, 2),
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (student_id, level_id),
  constraint student_level_progress_status_check
    check (status in ('completed', 'active', 'locked'))
);

create index if not exists idx_student_level_progress_student
  on public.student_level_progress (student_id);

create index if not exists idx_student_level_progress_level
  on public.student_level_progress (level_id);

alter table public.student_level_progress disable row level security;

notify pgrst, 'reload schema';
