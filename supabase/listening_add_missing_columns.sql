-- REQUIRED before npm run agent:listening
-- Your table is missing: transcript, questions, used

alter table public.generated_listening_tests
  add column if not exists transcript text not null default '';

alter table public.generated_listening_tests
  add column if not exists questions jsonb not null default '[]'::jsonb;

alter table public.generated_listening_tests
  add column if not exists used boolean not null default false;

notify pgrst, 'reload schema';
