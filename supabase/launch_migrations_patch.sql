-- Launch-critical schema patches (safe, additive — run in Supabase SQL Editor)
-- Re-run scripts/check-prod-migrations.mjs after applying.

-- 1. Speaking attempts: ActiveSession scorer writes task_type
alter table public.speaking_attempts
  add column if not exists task_type text default 'practice';

update public.speaking_attempts
set task_type = coalesce(task_type, 'legacy')
where task_type is null;

-- 2. GT attempts: app uses skill; older prod tables used task_type only
alter table public.ielts_general_attempts
  add column if not exists skill text,
  add column if not exists accuracy numeric(5, 4),
  add column if not exists status text default 'completed',
  add column if not exists mock_number int;

update public.ielts_general_attempts
set skill = coalesce(skill, task_type)
where skill is null and task_type is not null;

-- 3. GT history: app logs per-skill rows (skill + band_score + recorded_at)
alter table public.ielts_general_student_history
  add column if not exists skill text,
  add column if not exists band_score numeric(3, 1),
  add column if not exists recorded_at timestamptz default now();

update public.ielts_general_student_history
set
  band_score = coalesce(band_score, overall_band),
  recorded_at = coalesce(recorded_at, completed_at)
where band_score is null or recorded_at is null;

-- 4. Grammar progress (modern columns) — keeps legacy rows; API detects schema automatically
alter table public.grammar_progress
  add column if not exists lessons_completed int not null default 0,
  add column if not exists total_lessons int not null default 6,
  add column if not exists exercises_completed int not null default 0,
  add column if not exists practice_score int,
  add column if not exists updated_at timestamptz not null default now();

notify pgrst, 'reload schema';
