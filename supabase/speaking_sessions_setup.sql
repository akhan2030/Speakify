-- AI Speaking Partner — run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS speaking_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  session_number INTEGER DEFAULT 1,
  session_type TEXT DEFAULT 'practice',
  programme TEXT DEFAULT 'ielts',
  cue_card_id TEXT,
  transcript JSONB DEFAULT '[]'::jsonb,
  overall_band DECIMAL(3,1),
  fluency_band DECIMAL(3,1),
  lexical_band DECIMAL(3,1),
  grammar_band DECIMAL(3,1),
  pronunciation_band DECIMAL(3,1),
  feedback JSONB,
  duration_minutes INTEGER,
  speaking_time_seconds INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS speaking_progress (
  student_id TEXT PRIMARY KEY,
  total_sessions INTEGER DEFAULT 0,
  current_band DECIMAL(3,1),
  best_band DECIMAL(3,1),
  band_history JSONB DEFAULT '[]'::jsonb,
  last_session_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS speaking_vocabulary_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  word TEXT NOT NULL,
  assigned_date DATE NOT NULL DEFAULT CURRENT_DATE,
  practiced BOOLEAN DEFAULT FALSE,
  UNIQUE (student_id, word, assigned_date)
);

CREATE TABLE IF NOT EXISTS public.vocabulary_bank (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL,
  word TEXT NOT NULL,
  source TEXT DEFAULT 'speaking_scoring',
  source_session_id UUID,
  suggested_from TEXT,
  review_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  incorrect_count INTEGER NOT NULL DEFAULT 0,
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_practiced_at TIMESTAMPTZ,
  last_sentence TEXT,
  last_feedback TEXT,
  status TEXT NOT NULL DEFAULT 'due',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, word)
);

CREATE INDEX IF NOT EXISTS idx_speaking_sessions_student
  ON speaking_sessions(student_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_vocabulary_bank_due
  ON public.vocabulary_bank (student_id, next_review_date, status);

ALTER TABLE speaking_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE speaking_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE speaking_vocabulary_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.vocabulary_bank DISABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
