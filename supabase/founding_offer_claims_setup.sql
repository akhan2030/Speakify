-- Founding 50 launch claims — one row per paid founding purchase.
-- Safe to run multiple times.

create table if not exists public.founding_offer_claims (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.users (id) on delete set null,
  product_id text not null,
  payment_id text,
  created_at timestamptz not null default now()
);

create index if not exists founding_offer_claims_created_at_idx
  on public.founding_offer_claims (created_at desc);

create unique index if not exists founding_offer_claims_payment_id_uidx
  on public.founding_offer_claims (payment_id)
  where payment_id is not null;
