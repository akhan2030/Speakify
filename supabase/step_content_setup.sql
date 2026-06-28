-- STEP knowledge base (RAG) + practice question bank
-- Run in Supabase SQL editor before agent:step-research / agent:step-questions

-- Enable pgvector if not already enabled
create extension if not exists vector;

-- Scraped & embedded Qiyas STEP research chunks
create table if not exists public.step_knowledge (
  id bigint generated always as identity primary key,
  content text not null,
  embedding vector(1536),
  source_url text not null,
  source_title text,
  language text not null default 'ar',
  section_hints text[] not null default '{}',
  agent text not null default 'step_research_agent',
  created_at timestamptz not null default now()
);

create index if not exists idx_step_knowledge_source_url
  on public.step_knowledge (source_url);

create index if not exists idx_step_knowledge_embedding
  on public.step_knowledge
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- AI-generated STEP practice content (section drills)
create table if not exists public.step_practice_bank (
  id bigint generated always as identity primary key,
  section text not null check (
    section in ('reading', 'structure', 'listening', 'compositional_analysis')
  ),
  title text not null,
  generation_date date not null,
  question_count int not null default 0,
  content jsonb not null,
  content_hash text not null,
  agent text not null default 'step_question_agent',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  times_used int not null default 0,
  created_at timestamptz not null default now(),
  unique (content_hash)
);

create index if not exists idx_step_practice_bank_section_date
  on public.step_practice_bank (section, generation_date desc);

alter table public.step_knowledge disable row level security;
alter table public.step_practice_bank disable row level security;

-- Semantic search helper for STEP tutoring RAG
create or replace function public.match_step_knowledge(
  query_embedding vector(1536),
  match_count int default 5,
  filter_language text default null
)
returns table (
  id bigint,
  content text,
  source_url text,
  source_title text,
  language text,
  section_hints text[],
  similarity float
)
language sql stable
as $$
  select
    sk.id,
    sk.content,
    sk.source_url,
    sk.source_title,
    sk.language,
    sk.section_hints,
    1 - (sk.embedding <=> query_embedding) as similarity
  from public.step_knowledge sk
  where sk.embedding is not null
    and (filter_language is null or sk.language = filter_language)
  order by sk.embedding <=> query_embedding
  limit match_count;
$$;
