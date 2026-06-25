-- Optional: stop requiring legacy section_1..4 columns on every row
-- (Agent now fills them with {} — this makes them nullable for future inserts)

alter table public.generated_listening_tests
  alter column section_1 drop not null;

alter table public.generated_listening_tests
  alter column section_2 drop not null;

alter table public.generated_listening_tests
  alter column section_3 drop not null;

alter table public.generated_listening_tests
  alter column section_4 drop not null;

alter table public.generated_listening_tests
  alter column topics drop not null;

alter table public.generated_listening_tests
  alter column topic drop not null;

alter table public.generated_listening_tests
  alter column is_available drop not null;

alter table public.generated_listening_tests
  alter column total_questions drop not null;

notify pgrst, 'reload schema';
