-- Run this in Supabase SQL Editor BEFORE npm run agent:listening

alter table public.generated_listening_tests
  add column if not exists questions jsonb default '[]'::jsonb;

alter table public.generated_listening_tests
  add column if not exists transcript text default '';

notify pgrst, 'reload schema';
