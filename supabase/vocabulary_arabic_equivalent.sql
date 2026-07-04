-- Short lexical Arabic equivalent (e.g. مسؤول for "responsible"),
-- separate from definition_arabic (full translated definition sentence).
-- Run in Supabase SQL editor if the column is not present yet.

alter table public.vocabulary_words
  add column if not exists arabic_equivalent text;

comment on column public.vocabulary_words.arabic_equivalent is
  'Short MSA lexical equivalent of the headword (1–3 words), not a full definition.';
