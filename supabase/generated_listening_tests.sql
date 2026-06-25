-- Daily pre-generated IELTS Listening content (two pools — never mix)

create table if not exists public.generated_listening_tests (
  id bigint generated always as identity primary key,
  content_type text not null check (content_type in ('section_practice', 'full_mock')),
  generation_date date not null default current_date,
  test_number int not null check (test_number >= 1 and test_number <= 5),
  section_number int not null check (section_number >= 1 and section_number <= 4),
  transcript text not null,
  questions jsonb not null,
  used boolean not null default false,
  created_at timestamptz not null default now(),
  unique (generation_date, content_type, test_number, section_number)
);

alter table public.generated_listening_tests disable row level security;

create index if not exists idx_generated_listening_pool
  on public.generated_listening_tests (
    generation_date,
    content_type,
    section_number
  );
