-- Pathway lesson progress + IELTS readiness snapshot

alter table public.student_level_progress
  add column if not exists weekly_scores jsonb not null default '{}'::jsonb;

create table if not exists public.ielts_readiness (
  student_id text primary key,
  readiness_percent numeric(5, 2),
  overall_band numeric(3, 1),
  target_band numeric(3, 1),
  skill_bands jsonb default '{}'::jsonb,
  hours_studied numeric(8, 1) default 0,
  projected_date date,
  updated_at timestamptz not null default now()
);

alter table public.ielts_readiness disable row level security;

notify pgrst, 'reload schema';
