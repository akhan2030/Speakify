-- Vocabulary agent tables — run in Supabase SQL Editor

create table if not exists public.vocabulary_words (
  id bigint generated always as identity primary key,
  generation_date date not null default current_date,
  cefr_level text not null,
  word text not null,
  definition text not null,
  arabic_translation text not null,
  ipa text not null,
  example_sentence text not null,
  ielts_example text not null,
  word_family jsonb not null default '{}'::jsonb,
  collocations jsonb not null default '[]'::jsonb,
  memory_hook text not null,
  saudi_context text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.ielts_phrases (
  id bigint generated always as identity primary key,
  generation_date date not null default current_date,
  skill_area text not null,
  phrase text not null,
  phrase_function text not null,
  band_level text not null,
  example_sentence text not null,
  weaker_phrase_replaces text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_generation_log (
  id bigint generated always as identity primary key,
  agent_name text not null,
  generation_date date not null default current_date,
  status text not null default 'running',
  words_generated int not null default 0,
  phrases_generated int not null default 0,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.vocabulary_words disable row level security;
alter table public.ielts_phrases disable row level security;
alter table public.agent_generation_log disable row level security;

create index if not exists idx_vocabulary_words_date_level
  on public.vocabulary_words (generation_date, cefr_level);

create index if not exists idx_ielts_phrases_date_skill
  on public.ielts_phrases (generation_date, skill_area);

create unique index if not exists idx_vocabulary_words_unique_daily
  on public.vocabulary_words (generation_date, cefr_level, word);

create unique index if not exists idx_ielts_phrases_unique_daily
  on public.ielts_phrases (generation_date, skill_area, phrase);

notify pgrst, 'reload schema';
