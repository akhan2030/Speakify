-- Student registration fields (run in Supabase SQL Editor)

alter table public.users
  add column if not exists phone text;

alter table public.users
  add column if not exists english_level text;

alter table public.users
  add column if not exists target_band text;

alter table public.users
  add column if not exists study_reason text;

alter table public.users
  add column if not exists cefr_level text;

alter table public.users
  add column if not exists placement_test_completed boolean not null default false;

create unique index if not exists idx_users_email_unique
  on public.users (lower(email));

notify pgrst, 'reload schema';
