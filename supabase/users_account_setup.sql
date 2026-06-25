-- Account status and first-login password change (run in Supabase SQL Editor)

alter table public.users
  add column if not exists is_active boolean not null default true;

alter table public.users
  add column if not exists must_change_password boolean not null default false;

notify pgrst, 'reload schema';
