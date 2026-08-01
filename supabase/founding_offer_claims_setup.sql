-- Founding 50 claims + testimonials
-- Safe to run multiple times.

create table if not exists public.founding_offer_claims (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references public.users (id) on delete set null,
  product_id text not null,
  payment_id text,
  reservation_token text,
  status text not null default 'confirmed'
    check (status in ('reserved', 'confirmed')),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.founding_offer_claims
  add column if not exists reservation_token text;

alter table public.founding_offer_claims
  add column if not exists status text;

alter table public.founding_offer_claims
  add column if not exists confirmed_at timestamptz;

-- Backfill defaults for rows created by the earlier migration
update public.founding_offer_claims
set status = 'confirmed'
where status is null;

update public.founding_offer_claims
set confirmed_at = coalesce(confirmed_at, created_at)
where status = 'confirmed' and confirmed_at is null;

do $$
begin
  alter table public.founding_offer_claims
    alter column status set default 'confirmed';
exception when others then null;
end $$;

do $$
begin
  alter table public.founding_offer_claims
    alter column status set not null;
exception when others then null;
end $$;

create index if not exists founding_offer_claims_created_at_idx
  on public.founding_offer_claims (created_at desc);

create index if not exists founding_offer_claims_status_idx
  on public.founding_offer_claims (status);

create unique index if not exists founding_offer_claims_payment_id_uidx
  on public.founding_offer_claims (payment_id)
  where payment_id is not null;

create unique index if not exists founding_offer_claims_reservation_token_uidx
  on public.founding_offer_claims (reservation_token)
  where reservation_token is not null;

-- Active spots = confirmed + non-expired reservations (45 minutes)
create or replace function public.founding_active_claim_count()
returns integer
language sql
stable
as $$
  select count(*)::integer
  from public.founding_offer_claims
  where status = 'confirmed'
     or (
       status = 'reserved'
       and created_at > now() - interval '45 minutes'
     );
$$;

-- Atomically reserve one shared Founding 50 spot (pool of 50 across all products)
create or replace function public.reserve_founding_spot(
  p_student_id uuid,
  p_product_id text,
  p_reservation_token text
)
returns jsonb
language plpgsql
as $$
declare
  v_count integer;
  v_id uuid;
begin
  if p_reservation_token is null or length(trim(p_reservation_token)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'missing_token');
  end if;

  perform pg_advisory_xact_lock(88220050);

  delete from public.founding_offer_claims
  where status = 'reserved'
    and created_at < now() - interval '45 minutes';

  select public.founding_active_claim_count() into v_count;

  if v_count >= 50 then
    return jsonb_build_object(
      'ok', false,
      'reason', 'full',
      'claimed', v_count,
      'spots_remaining', 0
    );
  end if;

  insert into public.founding_offer_claims (
    student_id, product_id, reservation_token, status, created_at
  ) values (
    p_student_id, p_product_id, p_reservation_token, 'reserved', now()
  )
  returning id into v_id;

  return jsonb_build_object(
    'ok', true,
    'id', v_id,
    'claimed', v_count + 1,
    'spots_remaining', 50 - (v_count + 1)
  );
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'reason', 'full', 'claimed', 50, 'spots_remaining', 0);
end;
$$;

create or replace function public.attach_founding_payment(
  p_reservation_token text,
  p_payment_id text
)
returns boolean
language plpgsql
as $$
begin
  update public.founding_offer_claims
  set payment_id = p_payment_id
  where reservation_token = p_reservation_token
    and status = 'reserved';
  return found;
end;
$$;

-- Confirm on webhook (idempotent). Still under advisory lock if inserting fresh.
create or replace function public.confirm_founding_claim(
  p_student_id uuid,
  p_product_id text,
  p_payment_id text
)
returns jsonb
language plpgsql
as $$
declare
  v_row public.founding_offer_claims%rowtype;
  v_count integer;
begin
  if p_payment_id is null or length(trim(p_payment_id)) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'missing_payment');
  end if;

  perform pg_advisory_xact_lock(88220050);

  delete from public.founding_offer_claims
  where status = 'reserved'
    and created_at < now() - interval '45 minutes'
    and (payment_id is distinct from p_payment_id);

  select * into v_row
  from public.founding_offer_claims
  where payment_id = p_payment_id
  limit 1;

  if found then
    update public.founding_offer_claims
    set status = 'confirmed',
        confirmed_at = coalesce(confirmed_at, now()),
        student_id = coalesce(student_id, p_student_id),
        product_id = coalesce(nullif(product_id, ''), p_product_id)
    where id = v_row.id;
    return jsonb_build_object('ok', true, 'already', v_row.status = 'confirmed');
  end if;

  -- No reservation (legacy path) — only insert if capacity remains
  select public.founding_active_claim_count() into v_count;
  if v_count >= 50 then
    return jsonb_build_object('ok', false, 'reason', 'full', 'claimed', v_count);
  end if;

  insert into public.founding_offer_claims (
    student_id, product_id, payment_id, status, confirmed_at, created_at
  ) values (
    p_student_id, p_product_id, p_payment_id, 'confirmed', now(), now()
  );

  return jsonb_build_object('ok', true, 'already', false);
end;
$$;

create or replace function public.release_founding_reservation(
  p_reservation_token text
)
returns boolean
language plpgsql
as $$
begin
  delete from public.founding_offer_claims
  where reservation_token = p_reservation_token
    and status = 'reserved';
  return found;
end;
$$;

-- Testimonials from founding buyers
create table if not exists public.founding_testimonials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  product_id text,
  rating integer check (rating is null or (rating >= 1 and rating <= 5)),
  review_text text,
  band_score numeric(3,1),
  submitted_at timestamptz not null default now(),
  dismissed boolean not null default false
);

-- One prompt outcome per user (submit or dismiss)
create unique index if not exists founding_testimonials_user_uidx
  on public.founding_testimonials (user_id);

create index if not exists founding_testimonials_submitted_at_idx
  on public.founding_testimonials (submitted_at desc);
