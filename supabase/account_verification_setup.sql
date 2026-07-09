-- Account verification + password reset rate limiting.
-- Run in Supabase SQL Editor after password_reset_tokens_setup.sql.

alter table public.users
  add column if not exists email_verified_at timestamptz;

alter table public.users
  add column if not exists phone_verified_at timestamptz;

-- Grandfather existing accounts so current students are not locked out.
update public.users
set email_verified_at = now()
where email_verified_at is null and email is not null;

update public.users
set phone_verified_at = now()
where phone_verified_at is null and phone is not null and btrim(phone) <> '';

create table if not exists public.registration_verification_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  channel text not null check (channel in ('email', 'phone')),
  token text not null,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists registration_verification_tokens_user_idx
  on public.registration_verification_tokens (user_id, channel)
  where used = false;

create table if not exists public.password_reset_attempts (
  id uuid primary key default gen_random_uuid(),
  scope text not null,
  created_at timestamptz not null default now()
);

create index if not exists password_reset_attempts_scope_created_idx
  on public.password_reset_attempts (scope, created_at desc);

notify pgrst, 'reload schema';
