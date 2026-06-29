-- Add synonyms column for vocabulary flashcards
-- Run in Supabase SQL Editor before: node scripts/seedSynonyms.js

ALTER TABLE public.vocabulary_words
  ADD COLUMN IF NOT EXISTS synonyms jsonb DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';
