-- Password reset tokens for email links and WhatsApp/SMS OTP flows.
-- Run in Supabase SQL Editor.

create table if not exists public.password_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token text not null,
  method text not null check (method in ('whatsapp', 'sms', 'email', 'verified')),
  phone text,
  email text,
  expires_at timestamptz not null,
  used boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists password_reset_tokens_user_id_key
  on public.password_reset_tokens (user_id);

create index if not exists password_reset_tokens_token_idx
  on public.password_reset_tokens (token)
  where used = false;

create index if not exists password_reset_tokens_phone_idx
  on public.password_reset_tokens (phone)
  where used = false;
