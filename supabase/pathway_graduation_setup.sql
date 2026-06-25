-- Pathway graduation test sessions and attempts

create table if not exists public.pathway_graduation_attempts (
  id uuid primary key default gen_random_uuid(),
  student_id text not null,
  level_id uuid not null references public.course_levels(id) on delete cascade,
  overall_score numeric(5, 2),
  passed boolean not null default false,
  section_scores jsonb default '{}'::jsonb,
  answers jsonb default '{}'::jsonb,
  retest_available_at timestamptz,
  completed_at timestamptz not null default now()
);

create index if not exists idx_pathway_graduation_attempts_student
  on public.pathway_graduation_attempts (student_id, level_id, completed_at desc);

alter table public.pathway_graduation_attempts disable row level security;

notify pgrst, 'reload schema';
