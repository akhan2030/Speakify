-- REQUIRED: allows 20 practice rows + 12 mock rows per day (one row per section)

alter table public.generated_listening_tests
  drop constraint if exists generated_listening_tests_generation_date_test_number_key;

drop index if exists generated_listening_tests_generation_date_test_number_key;

drop index if exists idx_generated_listening_unique_daily;

create unique index idx_generated_listening_unique_daily
  on public.generated_listening_tests (
    generation_date,
    content_type,
    test_number,
    section_number
  );

notify pgrst, 'reload schema';
