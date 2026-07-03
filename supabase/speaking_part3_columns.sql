-- Part 3 linkage columns for speaking_sessions
-- Run in Supabase SQL Editor after speaking_sessions_setup.sql

ALTER TABLE speaking_sessions
  ADD COLUMN IF NOT EXISTS part2_cue_card JSONB,
  ADD COLUMN IF NOT EXISTS part2_transcript TEXT,
  ADD COLUMN IF NOT EXISTS part3_questions JSONB DEFAULT '[]'::jsonb;

NOTIFY pgrst, 'reload schema';
