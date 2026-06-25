-- Purge overused listening speaker names from banked content (Sarah Mitchell, etc.)
-- Run in Supabase SQL Editor, then run: npm run refresh:section1-speakers
-- (Node script rewrites speakers + transcripts with validated random pairs.)

-- Rows that still reference banned names in transcript or questions JSON:
select
  id,
  section_number,
  content_type,
  test_number,
  generation_date
from public.generated_listening_tests
where section_number = 1
  and (
    transcript ilike '%sarah mitchell%'
    or transcript ilike '%sarah johnson%'
    or transcript ilike '%david mitchell%'
    or transcript ilike '%david johnson%'
    or questions::text ilike '%sarah mitchell%'
    or questions::text ilike '%sarah johnson%'
    or questions::text ilike '%david mitchell%'
  )
order by generation_date desc, id desc;

-- Optional: mark stale rows unavailable until refresh script runs
-- update public.generated_listening_tests
-- set is_available = false
-- where section_number = 1
--   and (
--     transcript ilike '%sarah mitchell%'
--     or transcript ilike '%sarah johnson%'
--     or transcript ilike '%david mitchell%'
--   );
