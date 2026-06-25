-- Separate section practice vs full mock content pools

alter table public.generated_listening_tests
  add column if not exists content_type text not null default 'full_mock';

alter table public.generated_listening_tests
  add column if not exists generation_date date not null default current_date;

alter table public.generated_listening_tests
  drop constraint if exists generated_listening_tests_test_number_check;

alter table public.generated_listening_tests
  add constraint generated_listening_tests_test_number_check
  check (test_number >= 1 and test_number <= 5);

alter table public.generated_listening_tests
  drop constraint if exists generated_listening_tests_content_type_check;

alter table public.generated_listening_tests
  add constraint generated_listening_tests_content_type_check
  check (content_type in ('section_practice', 'full_mock'));

create unique index if not exists idx_generated_listening_unique_daily
  on public.generated_listening_tests (
    generation_date,
    content_type,
    test_number,
    section_number
  );

create index if not exists idx_generated_listening_pool
  on public.generated_listening_tests (
    generation_date,
    content_type,
    section_number
  );
